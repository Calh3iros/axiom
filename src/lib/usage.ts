/**
 * Usage Tracking — 3-Tier Monetisation (Free / Pro / Elite)
 *
 * Tracks daily + monthly usage in Supabase `usage` table.
 * Enforces per-day limits and monthly caps per plan.
 *
 * Free:  solve 3/d, write 1/d, humanize 500 words/d, learn 2/d
 * Pro ($19/mo):  solve 50/d (1500/mo), write 20/d (600/mo),
 *                humanize 5000 words/d, learn 20/d (600/mo)
 * Elite ($49/mo): solve 150/d (4500/mo), write 50/d (1500/mo),
 *                 humanize unlimited, learn 50/d (1500/mo)
 *                 Monthly cap → throttle to 10 calls/hr (never hard-block)
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanType = 'free' | 'pro' | 'elite';
export type UsageType = 'solve' | 'humanize' | 'write' | 'learn';

interface DailyLimit {
  solves: number;
  writes: number;
  humanize_words: number;
  learns: number;
}

interface MonthlyCap {
  solves: number | null;
  writes: number | null;
  learns: number | null;
  // humanize has no monthly cap (even Pro is per-day only)
}

interface PlanConfig {
  daily: DailyLimit;
  monthly: MonthlyCap;
}

export interface UsageCheck {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  used?: number;
  /** true when Elite user exceeded monthly cap — request is allowed but throttled */
  throttled?: boolean;
}

export interface UserInfo {
  userId: string;
  plan: PlanType;
}

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    daily: { solves: 3, writes: 1, humanize_words: 500, learns: 2 },
    monthly: { solves: null, writes: null, learns: null },
  },
  pro: {
    daily: { solves: 50, writes: 20, humanize_words: 5_000, learns: 20 },
    monthly: { solves: 1_500, writes: 600, learns: 600 },
  },
  elite: {
    daily: { solves: 150, writes: 50, humanize_words: Infinity, learns: 50 },
    monthly: { solves: 4_500, writes: 1_500, learns: 1_500 },
  },
} as const;

// Elite throttle: 10 calls per hour when monthly cap is hit
const ELITE_THROTTLE_WINDOW_MS = 60 * 60 * 1_000; // 1 hour
const ELITE_THROTTLE_MAX_CALLS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getFirstOfMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Map UsageType → DB column name in `usage` table */
const DB_FIELD: Record<UsageType, 'solves' | 'humanizes' | 'writes' | 'learns'> = {
  solve: 'solves',
  humanize: 'humanizes',
  write: 'writes',
  learn: 'learns',
};

/** Map UsageType → daily limit key in PlanConfig */
const DAILY_KEY: Record<UsageType, keyof DailyLimit> = {
  solve: 'solves',
  humanize: 'humanize_words',
  write: 'writes',
  learn: 'learns',
};

/** Map UsageType → monthly cap key (humanize has none) */
const MONTHLY_KEY: Record<UsageType, keyof MonthlyCap | null> = {
  solve: 'solves',
  humanize: null,
  write: 'writes',
  learn: 'learns',
};

// ---------------------------------------------------------------------------
// getUserAndPlan — returns plan string instead of isPro boolean
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user and their plan from Supabase.
 * Falls back to anonymous IP-based tracking for non-logged-in users.
 */
export async function getUserAndPlan(req: Request): Promise<UserInfo> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = (await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()) as { data: { plan: string } | null };

      const plan = normalisePlan(profile?.plan);

      return { userId: user.id, plan };
    }
  } catch {
    // Fall through to anonymous
  }

  return {
    userId: getUserIdFromRequest(req),
    plan: 'free',
  };
}

function normalisePlan(raw: string | undefined | null): PlanType {
  if (raw === 'elite') return 'elite';
  if (raw === 'pro') return 'pro';
  return 'free';
}

// ---------------------------------------------------------------------------
// checkUsage — daily limit + monthly cap + Elite throttle
// ---------------------------------------------------------------------------

export async function checkUsage(
  userId: string,
  type: UsageType,
  plan: PlanType = 'free',
): Promise<UsageCheck> {
  const config = PLANS[plan];
  const dailyLimit = config.daily[DAILY_KEY[type]];
  const field = DB_FIELD[type];

  // 1. Daily usage --------------------------------------------------------
  const today = getTodayStr();

  const { data: todayRow } = await supabaseAdmin
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const usedToday = Number(todayRow?.[field]) || 0;

  // Unlimited (e.g. Elite humanize)
  if (dailyLimit === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity, used: usedToday };
  }

  if (usedToday >= dailyLimit) {
    return { allowed: false, remaining: 0, limit: dailyLimit, used: usedToday };
  }

  // 2. Monthly cap (Pro & Elite only) -------------------------------------
  const monthlyKey = MONTHLY_KEY[type];
  if (monthlyKey) {
    const monthlyCap = config.monthly[monthlyKey];
    if (monthlyCap !== null) {
      const monthStart = getFirstOfMonthStr();

      const { data: monthlyRows } = await supabaseAdmin
        .from('usage')
        .select(field)
        .eq('user_id', userId)
        .gte('date', monthStart);

      const usedThisMonth = (monthlyRows ?? []).reduce(
        (sum: number, row: Record<string, unknown>) => sum + (Number(row[field]) || 0),
        0,
      );

      if (usedThisMonth >= monthlyCap) {
        // Elite → throttle instead of blocking
        if (plan === 'elite') {
          const throttled = await isEliteThrottled(userId, type);
          if (throttled) {
            return {
              allowed: false,
              remaining: 0,
              limit: dailyLimit,
              used: usedToday,
              throttled: true,
            };
          }
          // Under throttle window — allow but flag
          return {
            allowed: true,
            remaining: Math.max(0, dailyLimit - usedToday),
            limit: dailyLimit,
            used: usedToday,
            throttled: true,
          };
        }

        // Pro → hard block after monthly cap
        return { allowed: false, remaining: 0, limit: dailyLimit, used: usedToday };
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, dailyLimit - usedToday),
    limit: dailyLimit,
    used: usedToday,
  };
}

// ---------------------------------------------------------------------------
// Elite throttle — 10 calls / hour when monthly cap is hit
// ---------------------------------------------------------------------------

async function isEliteThrottled(userId: string, type: UsageType): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - ELITE_THROTTLE_WINDOW_MS).toISOString();

  const { count } = await supabaseAdmin
    .from('usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', oneHourAgo);

  return (count ?? 0) >= ELITE_THROTTLE_MAX_CALLS;
}

// ---------------------------------------------------------------------------
// incrementUsage — bump daily counter + log for throttle
// ---------------------------------------------------------------------------

export async function incrementUsage(
  userId: string,
  type: UsageType,
  amount: number = 1,
): Promise<void> {
  const today = getTodayStr();
  const field = DB_FIELD[type];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // 1. Upsert daily usage row ---------------------------------------------
  const { data: existingUsage } = (await supabaseAdmin
    .from('usage')
    .select('id, solves, writes, humanizes, learns')
    .eq('user_id', userId)
    .eq('date', today)
    .single()) as {
    data: {
      id: string;
      solves: number;
      writes: number;
      humanizes: number;
      learns: number;
    } | null;
  };

  if (existingUsage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('usage') as any)
      .update({ [field]: existingUsage[field] + amount })
      .eq('id', existingUsage.id);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('usage') as any).insert({
      user_id: userId,
      date: today,
      solves: type === 'solve' ? amount : 0,
      writes: type === 'write' ? amount : 0,
      humanizes: type === 'humanize' ? amount : 0,
      learns: type === 'learn' ? amount : 0,
    });
  }

  // 2. Append to usage_log (for Elite throttle tracking) -------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin.from('usage_log') as any).insert({
    user_id: userId,
    type,
    amount,
  });

  // 3. Streak & badge logic (skip anonymous) ------------------------------
  if (!userId.startsWith('anon:')) {
    const { data: profile } = (await supabaseAdmin
      .from('profiles')
      .select('current_streak, last_active_date, badges')
      .eq('id', userId)
      .single()) as {
      data: {
        current_streak: number | null;
        last_active_date: string | null;
        badges: string[] | null;
      } | null;
    };

    if (profile) {
      const lastActive = profile.last_active_date;
      const currentStreak = profile.current_streak || 0;

      let newStreak = currentStreak;

      if (lastActive !== today) {
        newStreak = 1;
        if (lastActive === yesterday) {
          newStreak = currentStreak + 1;
        }
      }

      const existingBadges = profile.badges || [];
      const newBadges = [...existingBadges];
      let badgesUpdated = false;

      if (newStreak >= 7 && !existingBadges.includes('1_week_scholar')) {
        newBadges.push('1_week_scholar');
        badgesUpdated = true;
      }
      if (newStreak >= 30 && !existingBadges.includes('monthly_master')) {
        newBadges.push('monthly_master');
        badgesUpdated = true;
      }

      if (lastActive !== today || badgesUpdated) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from('profiles') as any)
          .update({
            current_streak: newStreak,
            last_active_date: today,
            badges: newBadges,
          })
          .eq('id', userId);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getUserIdFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
  return `anon:${ip}`;
}

// ---------------------------------------------------------------------------
// Backward compat — expose isPro helper for settings page & other UI
// ---------------------------------------------------------------------------

export function isPaidPlan(plan: PlanType): boolean {
  return plan === 'pro' || plan === 'elite';
}
