import type Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { STRIPE_PRICES as _STRIPE_PRICES } from '@/lib/stripe/config';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { priceId, locale } = body;

    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 });
    }

    // Get the user's profile to see if they already have a stripe_customer_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create a new Customer in Stripe
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabaseUUID: user.id,
        },
      });
      customerId = customer.id;

      // Update the profile with the new customer ID
      const { error } = await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);

      if (error) {
         console.error('[checkout] Error updating profile with stripe_customer_id', error);
      }
    }

    // Determine return URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Map next-intl locale to Stripe locale
    const stripeLocaleMap: Record<string, string> = {
      en: 'en', pt: 'pt-BR', es: 'es', fr: 'fr', de: 'de', zh: 'zh',
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      locale: (stripeLocaleMap[locale] || 'auto') as Stripe.Checkout.SessionCreateParams.Locale,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/solve?checkout=success`,
      cancel_url: `${appUrl}/solve?checkout=cancelled`,
      metadata: {
        supabaseUUID: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[checkout] Error creating session:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
