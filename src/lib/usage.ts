/**
 * Rate Limiting / Usage Tracking
 *
 * Migrated to Supabase DB. Tracks daily usage and real consecutive-day streaks.
 *
 * Free tier limits (per day):
 * - Solve: 3 questions
 * - Humanize: 500 words
 * - Write: 1 action
 * - Learn: 2 panic mode generations
 *
 * Pro tier: unlimited
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const PLANS = {
  free: {
    limits: {
      solves: 3,
      humanize_words: 500,
      writes: 1,
      learns: 2,
    },
  },
  pro: {
    limits: null, // unlimited
  },
} as const;

type UsageType = 'solve' | 'humanize' | 'write' | 'learn';

interface UsageCheck {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  used?: number;
}

interface UserInfo {
  userId: string;
  isPro: boolean;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the authenticated user and their plan from Supabase.
 * Falls back to anonymous IP-based tracking for non-logged-in users.
 */
export async function getUserAndPlan(req: Request): Promise<UserInfo> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single() as { data: { plan: string } | null };

      return {
        userId: user.id,
        isPro: profile?.plan === 'pro',
      };
    }
  } catch {
    // Fall through
  }

  return {
    userId: getUserIdFromRequest(req),
    isPro: false,
  };
}

/**
 * Check if a user has remaining usage for a given action type.
 */
export async function checkUsage(
  userId: string,
  type: UsageType,
  isPro: boolean = false
): Promise<UsageCheck> {
  if (isPro) return { allowed: true };

  const limitMap: Record<UsageType, number> = {
    solve: PLANS.free.limits.solves,
    humanize: PLANS.free.limits.humanize_words,
    write: PLANS.free.limits.writes,
    learn: PLANS.free.limits.learns,
  };
  const limit = limitMap[type];

  // If anonymous, just use limit check but we don't block yet (memory map removed, so anonymous is basically unlimited unless we add IP blocking back. But spec focuses on auth users).
  // Actually, to keep anonymous tracking without memory leaks, we can store 'anon:ip' in the usage table too!

  const today = getTodayStr();

  const { data: usage } = await supabaseAdmin
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const fieldMap: Record<UsageType, 'solves' | 'humanizes' | 'writes'> = {
    solve: 'solves',
    humanize: 'humanizes',
    write: 'writes',
    learn: 'solves',
  };

  const fieldName = fieldMap[type];
  const used = Number(usage?.[fieldName]) || 0;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    used,
  };
}

/**
 * Increment usage counter in DB.
 * Updates user streak if it's their first action of the day.
 */
export async function incrementUsage(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<void> {
  const today = getTodayStr();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const fieldMap: Record<UsageType, 'solves' | 'humanizes' | 'writes'> = {
    solve: 'solves',
    humanize: 'humanizes',
    write: 'writes',
    learn: 'solves', // falling back to solves for learn count in DB
  };
  const field = fieldMap[type];

  const { data: existingUsage } = await supabaseAdmin
    .from('usage')
    .select('id, solves, writes, humanizes')
    .eq('user_id', userId)
    .eq('date', today)
    .single() as { data: { id: string, solves: number, writes: number, humanizes: number } | null };

  if (existingUsage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('usage') as any)
      .update({ [field]: existingUsage[field] + amount })
      .eq('id', existingUsage.id);
  } else {
    // New day usage for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('usage') as any)
      .insert({
        user_id: userId,
        date: today,
        solves: type === 'solve' || type === 'learn' ? amount : 0,
        writes: type === 'write' ? amount : 0,
        humanizes: type === 'humanize' ? amount : 0,
      });
  }

  // 2. Streak Logic & Badge Checking (Only for real uuid users, skip 'anon:ip')
  if (!userId.startsWith('anon:')) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('current_streak, last_active_date, badges')
      .eq('id', userId)
      .single() as { data: { current_streak: number | null, last_active_date: string | null, badges: string[] | null } | null };

    if (profile) {
      const lastActive = profile.last_active_date;
      const currentStreak = profile.current_streak || 0;

      let newStreak = currentStreak;

      if (lastActive !== today) {
        newStreak = 1;

        if (lastActive === yesterday) {
          // Continuous active day
          newStreak = currentStreak + 1;
        }
      }

      // Check for badges regardless of whether streak changed today (in case we want to re-eval or award missing)
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

      // We only update if something changed (either the day is new or we got new badges)
      if (lastActive !== today || badgesUpdated) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from('profiles') as any)
          .update({
            current_streak: newStreak,
            last_active_date: today,
            badges: newBadges
          })
          .eq('id', userId);
      }
    }
  }
}

export function getUserIdFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
  return `anon:${ip}`;
}
