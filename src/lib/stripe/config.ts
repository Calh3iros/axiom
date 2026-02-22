export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
} as const;

export const FREE_LIMITS = {
  SOLVES_PER_DAY: 3,
  HUMANIZE_WORDS_PER_DAY: 500,
  WRITES_PER_DAY: 1,
} as const;

export const STRIPE_PRICES = {
  MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
  YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
};
