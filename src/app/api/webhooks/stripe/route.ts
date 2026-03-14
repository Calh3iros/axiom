import { NextResponse } from "next/server";
import Stripe from "stripe";

import { planFromPriceId } from "@/lib/stripe/config";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    // ── New subscription (checkout completed) ──────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.subscription && session.metadata?.supabaseUUID) {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        // Fetch the subscription to get the price ID
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? "";
        const plan = planFromPriceId(priceId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("profiles") as any)
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
          })
          .eq("id", session.metadata.supabaseUUID);

        if (error) {
          console.error("Error updating profile on checkout:", error);
        } else {
          console.warn(
            `[webhook] checkout.session.completed → user=${session.metadata.supabaseUUID} plan=${plan}`
          );
        }
      }
      break;
    }

    // ── Subscription updated (upgrade / downgrade / cancel_at_period_end) ─
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id ?? "";
      const plan = planFromPriceId(priceId);

      // If cancel_at_period_end is set, DON'T revoke access yet.
      // The user keeps their plan until the period actually ends
      // (handled by customer.subscription.deleted when period ends).
      if (subscription.cancel_at_period_end) {
        console.warn(
          `[webhook] subscription.updated → cancel_at_period_end, keeping plan until period end`
        );
        break;
      }

      // Otherwise this is a real plan change (upgrade/downgrade)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabaseAdmin.from("profiles") as any)
        .update({ plan })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error updating profile on subscription update:", error);
      } else {
        console.warn(
          `[webhook] subscription.updated → plan=${plan} sub=${subscription.id}`
        );
      }
      break;
    }

    // ── Subscription actually deleted (period ended or immediate cancel) ─
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabaseAdmin.from("profiles") as any)
        .update({
          plan: "free",
          stripe_subscription_id: null,
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error(
          "Error reverting to free on subscription deletion:",
          error
        );
      } else {
        console.warn(
          `[webhook] subscription.deleted → reverted to free, sub=${subscription.id}`
        );
      }
      break;
    }

    // ── Renewal payment succeeded ─────────────────────────────────────
    case "invoice.payment_succeeded": {
      // Log for monitoring; plan stays the same
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(
        `[webhook] invoice.payment_succeeded → customer=${invoice.customer}`
      );
      break;
    }

    default:
      console.warn(`[webhook] Unhandled event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
