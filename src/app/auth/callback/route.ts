import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/solve';

  if (code) {
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // ── P1.7 IP Signup Tracking ──────────────────────────────────
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        'unknown';

      try {
        // Log this signup IP
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from('ip_signups') as any).insert({
          ip,
          user_id: data.user.id,
        });

        // Check if this IP has too many signups (3+ = suspicious)
        const { count } = await supabaseAdmin
          .from('ip_signups')
          .select('*', { count: 'exact', head: true })
          .eq('ip', ip);

        if (count && count >= 3) {
          console.warn(
            `[anti-abuse] IP ${ip} has ${count} signups — flagging user ${data.user.id}`,
          );
          // For now, just log. In production, you might:
          // - Flag the account for manual review
          // - Add a "suspicious" field to profiles
          // - Block the user from accessing features until verified
        }
      } catch (err) {
        // Non-blocking — don't prevent auth flow if IP tracking fails
        console.error('[anti-abuse] IP tracking error:', err);
      }

      // ── Redirect ─────────────────────────────────────────────────
      const localeCookie = cookieStore.get('NEXT_LOCALE');
      const locale = localeCookie?.value || 'en';

      let redirectedPath = next;
      const hasLocalePrefix = /^\/[a-zA-Z]{2}(\/|$)/.test(next);
      if (!hasLocalePrefix) {
        redirectedPath = `/${locale}${next.startsWith('/') ? '' : '/'}${next}`;
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectedPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectedPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectedPath}`);
      }
    }

    if (error) {
      console.error('[auth callback] Code exchange error:', error.message);
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/en/auth/login?error=auth_failed`);
}
