import type { PlanType } from '@/lib/usage';

// ---------------------------------------------------------------------------
// Plan metadata
// ---------------------------------------------------------------------------

export const PLANS = {
  FREE: 'free' as const,
  PRO: 'pro' as const,
  ELITE: 'elite' as const,
} as const;

// ---------------------------------------------------------------------------
// Stripe Price IDs (set via env vars — see .env.local)
// ---------------------------------------------------------------------------

export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
  ELITE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID || '',
  ELITE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID || '',
} as const;

// ---------------------------------------------------------------------------
// Price ID → Plan mapping (used by webhook to detect plan from subscription)
// ---------------------------------------------------------------------------

/** Given a Stripe price ID, returns the plan it corresponds to. */
export function planFromPriceId(priceId: string): PlanType {
  const map: Record<string, PlanType> = {
    [STRIPE_PRICES.PRO_MONTHLY]: 'pro',
    [STRIPE_PRICES.PRO_YEARLY]: 'pro',
    [STRIPE_PRICES.ELITE_MONTHLY]: 'elite',
    [STRIPE_PRICES.ELITE_YEARLY]: 'elite',
  };
  return map[priceId] ?? 'free';
}

// ---------------------------------------------------------------------------
// Backward compat — old MONTHLY/YEARLY aliases for settings page
// ---------------------------------------------------------------------------

/** @deprecated Use STRIPE_PRICES.PRO_MONTHLY / PRO_YEARLY */
export const LEGACY_STRIPE_PRICES = {
  MONTHLY: STRIPE_PRICES.PRO_MONTHLY,
  YEARLY: STRIPE_PRICES.PRO_YEARLY,
};
