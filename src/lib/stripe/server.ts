import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2025-01-27.acacia' as any, // Ignore strict TS literal check as installed version supports this
  appInfo: {
    name: 'Axiom',
    version: '1.0.0',
  },
});
