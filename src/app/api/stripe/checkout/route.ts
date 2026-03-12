import { NextRequest, NextResponse } from "next/server";

import { stripe, PRICE_IDS } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      plan,
      interval,
      locale = "en",
    } = body as {
      plan: "pro" | "elite";
      interval: "monthly" | "yearly";
      locale?: string;
    };

    // Validate input strictly
    if (
      !plan ||
      !interval ||
      !["pro", "elite"].includes(plan) ||
      !["monthly", "yearly"].includes(interval)
    ) {
      return NextResponse.json(
        { error: "Invalid plan or interval" },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan][interval];
    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured" },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/${locale}/dashboard?checkout=success`,
      cancel_url: `${origin}/${locale}/dashboard?checkout=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        supabase_user_id: user.id,
        plan,
        interval,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
