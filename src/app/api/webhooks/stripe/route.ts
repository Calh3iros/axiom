import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case 'checkout.session.completed':
      if (session.subscription && session.metadata?.supabaseUUID) {
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;

        const { error } = await (supabaseAdmin.from('profiles') as any)
          .update({
            plan: 'pro' as const,
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', session.metadata.supabaseUUID);

        if (error) {
          console.error('Error updating user profile on checkout completion:', error);
        }
      }
      break;

    case 'invoice.payment_succeeded': {
      // Handle subsequent payments if needed
      // (e.g. extending an internal expiration date, or logging payment)
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      const { error } = await (supabaseAdmin.from('profiles') as any)
        .update({
          plan: 'free',
          stripe_subscription_id: null,
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error reverting user profile to free on subscription deletion:', error);
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
