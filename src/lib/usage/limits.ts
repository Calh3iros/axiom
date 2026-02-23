import type { PlanType } from '@/lib/usage';

export const TOKEN_LIMITS: Record<PlanType, number> = {
  free: 50_000,    // 50k tokens
  pro: 5_000_000,  // 5M tokens
  elite: Infinity, // unlimited
};

export interface UsageLimitParams {
  currentUsage: number;
  plan: PlanType;
}

export interface UsageLimitResult {
  allowed: boolean;
  remainingTokens: number;
  isApproachingLimit: boolean;
  errorCode?: 'FREE_LIMIT_EXCEEDED' | 'PRO_LIMIT_EXCEEDED' | 'ELITE_LIMIT_EXCEEDED';
}

export function checkUsageLimit({ currentUsage, plan }: UsageLimitParams): UsageLimitResult {
  const limit = TOKEN_LIMITS[plan];
  const remainingTokens = limit === Infinity ? Infinity : Math.max(0, limit - currentUsage);
  const isApproachingLimit = limit !== Infinity && currentUsage >= limit * 0.9;

  if (limit !== Infinity && currentUsage >= limit) {
    const errorCodeMap: Record<PlanType, UsageLimitResult['errorCode']> = {
      free: 'FREE_LIMIT_EXCEEDED',
      pro: 'PRO_LIMIT_EXCEEDED',
      elite: 'ELITE_LIMIT_EXCEEDED',
    };
    return {
      allowed: false,
      remainingTokens: 0,
      isApproachingLimit: true,
      errorCode: errorCodeMap[plan],
    };
  }

  return {
    allowed: true,
    remainingTokens,
    isApproachingLimit,
  };
}
