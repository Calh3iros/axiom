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
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_id_here',
  YEARLY: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_id_here',
};
