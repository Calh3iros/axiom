/**
 * Rate Limiting / Usage Tracking
 *
 * Reusable helper for all API routes.
 * Checks if a user (free or pro) has exceeded daily limits.
 *
 * Free tier limits (per day):
 * - Solve: 3 questions
 * - Humanize: 500 words
 * - Write: 1 action
 * - Learn: 2 panic mode generations
 *
 * Pro tier: unlimited
 */

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

// In-memory usage tracking (will be replaced with Supabase when DB is configured)
const memoryUsage = new Map<string, Record<string, number>>();

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getUserDayKey(userId: string): string {
  return `${userId}:${getTodayKey()}`;
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
      // Fetch plan from profiles table
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
    // Fall through to anonymous
  }

  // Anonymous fallback
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
  // Pro users have unlimited access
  if (isPro) {
    return { allowed: true };
  }

  const key = getUserDayKey(userId);
  const current = memoryUsage.get(key) || {};

  const fieldMap: Record<UsageType, string> = {
    solve: 'solves_used',
    humanize: 'humanize_words',
    write: 'writes_used',
    learn: 'learns_used',
  };

  const limitMap: Record<UsageType, number> = {
    solve: PLANS.free.limits.solves,
    humanize: PLANS.free.limits.humanize_words,
    write: PLANS.free.limits.writes,
    learn: PLANS.free.limits.learns,
  };

  const field = fieldMap[type];
  const limit = limitMap[type];
  const used = current[field] || 0;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    used,
  };
}

/**
 * Increment usage counter for a given action.
 * Call this AFTER successfully processing a request.
 */
export async function incrementUsage(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<void> {
  const key = getUserDayKey(userId);
  const current = memoryUsage.get(key) || {};

  const fieldMap: Record<UsageType, string> = {
    solve: 'solves_used',
    humanize: 'humanize_words',
    write: 'writes_used',
    learn: 'learns_used',
  };

  const field = fieldMap[type];
  current[field] = (current[field] || 0) + amount;
  memoryUsage.set(key, current);
}

/**
 * Get the user's IP from the request headers.
 * Used as a fallback identifier for anonymous users.
 */
export function getUserIdFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
  return `anon:${ip}`;
}
