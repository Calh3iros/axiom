/**
 * Rate Limiting with Upstash Redis (P0.2 + P1.7)
 *
 * Tiered sliding-window rate limits per plan:
 *   Free:  5 req/min
 *   Pro:  15 req/min
 *   Elite: 30 req/min
 *
 * General routes: 60 req/min (unchanged)
 *
 * Env vars required:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import type { PlanType } from '@/lib/usage';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ---------------------------------------------------------------------------
// Per-tier AI rate limiters
// ---------------------------------------------------------------------------

const freeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai:free',
});

const proRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai:pro',
});

const eliteRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai:elite',
});

const AI_LIMITERS: Record<PlanType, Ratelimit> = {
  free: freeRatelimit,
  pro: proRatelimit,
  elite: eliteRatelimit,
};

/**
 * Get the appropriate AI rate limiter for a user's plan.
 * Usage: `const { success } = await getAiRatelimit(plan).limit(ip);`
 */
export function getAiRatelimit(plan: PlanType = 'free'): Ratelimit {
  return AI_LIMITERS[plan] ?? AI_LIMITERS.free;
}

/**
 * @deprecated Use `getAiRatelimit(plan)` for tiered limits.
 * Kept for backward compatibility — uses free-tier limit.
 */
export const aiRatelimit = freeRatelimit;

/** 60 requests per minute per identifier — for general routes */
export const generalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:general',
});
