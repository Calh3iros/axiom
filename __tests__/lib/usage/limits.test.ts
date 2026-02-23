import { checkUsageLimit, TOKEN_LIMITS } from '@/lib/usage/limits';

describe('Token Usage Limits Business Logic', () => {
  describe('Free Tier Users', () => {
    it('should allow usage when well below the limit', () => {
      const result = checkUsageLimit({
        currentUsage: 5000,
        plan: 'free',
      });

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(TOKEN_LIMITS.free - 5000);
      expect(result.isApproachingLimit).toBe(false);
    });

    it('should issue a warning when at 90% of the Free limit', () => {
      const nearLimit = TOKEN_LIMITS.free * 0.95;
      const result = checkUsageLimit({
        currentUsage: nearLimit,
        plan: 'free',
      });

      expect(result.allowed).toBe(true);
      expect(result.isApproachingLimit).toBe(true);
    });

    it('should block usage when exactly at or above the Free limit', () => {
      const result = checkUsageLimit({
        currentUsage: TOKEN_LIMITS.free,
        plan: 'free',
      });

      expect(result.allowed).toBe(false);
      expect(result.remainingTokens).toBe(0);
      expect(result.errorCode).toBe('FREE_LIMIT_EXCEEDED');
    });
  });

  describe('Pro Tier Users', () => {
    it('should allow massive usage well past the Free limit', () => {
      const result = checkUsageLimit({
        currentUsage: TOKEN_LIMITS.free * 2,
        plan: 'pro',
      });

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(TOKEN_LIMITS.pro - TOKEN_LIMITS.free * 2);
    });

    it('should block usage when exceeding the massive Pro safety limit', () => {
      const result = checkUsageLimit({
        currentUsage: TOKEN_LIMITS.pro + 1,
        plan: 'pro',
      });

      expect(result.allowed).toBe(false);
      expect(result.remainingTokens).toBe(0);
      expect(result.errorCode).toBe('PRO_LIMIT_EXCEEDED');
    });
  });

  describe('Elite Tier Users', () => {
    it('should always allow usage (unlimited tokens)', () => {
      const result = checkUsageLimit({
        currentUsage: TOKEN_LIMITS.pro * 10,
        plan: 'elite',
      });

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(Infinity);
      expect(result.isApproachingLimit).toBe(false);
    });
  });
});
