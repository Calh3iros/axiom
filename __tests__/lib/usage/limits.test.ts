import { checkUsageLimit, FREE_TIER_LIMIT, PRO_TIER_LIMIT } from '@/lib/usage/limits';

describe('Token Usage Limits Business Logic', () => {
  describe('Free Tier Users', () => {
    it('should allow usage when well below the limit', () => {
      const result = checkUsageLimit({ 
        currentUsage: 5000, 
        isPro: false 
      });
      
      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(FREE_TIER_LIMIT - 5000);
      expect(result.isApproachingLimit).toBe(false);
    });

    it('should issue a warning when at 90% of the Free limit', () => {
      const nearLimit = FREE_TIER_LIMIT * 0.95;
      const result = checkUsageLimit({ 
        currentUsage: nearLimit, 
        isPro: false 
      });
      
      expect(result.allowed).toBe(true);
      expect(result.isApproachingLimit).toBe(true);
    });

    it('should block usage when exactly at or above the Free limit', () => {
      const result = checkUsageLimit({ 
        currentUsage: FREE_TIER_LIMIT, 
        isPro: false 
      });
      
      expect(result.allowed).toBe(false);
      expect(result.remainingTokens).toBe(0);
      expect(result.errorCode).toBe('FREE_LIMIT_EXCEEDED');
    });
  });

  describe('Pro Tier Users', () => {
    it('should allow massive usage well past the Free limit', () => {
      const result = checkUsageLimit({ 
        currentUsage: FREE_TIER_LIMIT * 2, 
        isPro: true 
      });
      
      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(PRO_TIER_LIMIT - (FREE_TIER_LIMIT * 2));
    });

    it('should block usage when exceeding the massive Pro safety limit', () => {
      const result = checkUsageLimit({ 
        currentUsage: PRO_TIER_LIMIT + 1, 
        isPro: true 
      });
      
      expect(result.allowed).toBe(false);
      expect(result.remainingTokens).toBe(0);
      expect(result.errorCode).toBe('PRO_LIMIT_EXCEEDED');
    });
  });
});
