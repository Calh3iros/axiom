/**
 * Rate Limiting with Upstash Redis (P0.2)
 *
 * Uses @upstash/ratelimit with sliding window algorithm.
 * AI routes: 10 calls/min per user | General routes: 60 calls/min
 *
 * Env vars required:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** 10 requests per minute per identifier — for AI routes */
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai',
});

/** 60 requests per minute per identifier — for general routes */
export const generalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:general',
});
