export const FREE_TIER_LIMIT = 50000; // 50k tokens
export const PRO_TIER_LIMIT = 5000000; // 5M tokens

export interface UsageLimitParams {
  currentUsage: number;
  isPro: boolean;
}

export interface UsageLimitResult {
  allowed: boolean;
  remainingTokens: number;
  isApproachingLimit: boolean;
  errorCode?: 'FREE_LIMIT_EXCEEDED' | 'PRO_LIMIT_EXCEEDED';
}

export function checkUsageLimit({ currentUsage, isPro }: UsageLimitParams): UsageLimitResult {
  const limit = isPro ? PRO_TIER_LIMIT : FREE_TIER_LIMIT;
  const remainingTokens = Math.max(0, limit - currentUsage);
  const isApproachingLimit = currentUsage >= limit * 0.9;
  
  if (currentUsage >= limit) {
    return {
      allowed: false,
      remainingTokens: 0,
      isApproachingLimit: true,
      errorCode: isPro ? 'PRO_LIMIT_EXCEEDED' : 'FREE_LIMIT_EXCEEDED',
    };
  }

  return {
    allowed: true,
    remainingTokens,
    isApproachingLimit,
  };
}
