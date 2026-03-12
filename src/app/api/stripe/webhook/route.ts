import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";

// Use service role for webhook — this runs server-side without user context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !plan) {
          console.error(
            "[stripe/webhook] Missing metadata in checkout session"
          );
          break;
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", userId);

        if (error) {
          console.error("[stripe/webhook] Failed to update profile:", error);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) break;

        // Determine plan from price ID using reverse lookup
        const plan = determinePlanFromPrice(priceId);
        if (plan) {
          await supabaseAdmin
            .from("profiles")
            .update({ plan })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabaseAdmin
          .from("profiles")
          .update({
            plan: "free",
            stripe_subscription_id: null,
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] Processing error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function determinePlanFromPrice(priceId: string): string | null {
  const proMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const proYearly = process.env.STRIPE_PRICE_PRO_YEARLY;
  const eliteMonthly = process.env.STRIPE_PRICE_ELITE_MONTHLY;
  const eliteYearly = process.env.STRIPE_PRICE_ELITE_YEARLY;

  if (priceId === proMonthly || priceId === proYearly) return "pro";
  if (priceId === eliteMonthly || priceId === eliteYearly) return "elite";
  return null;
}
