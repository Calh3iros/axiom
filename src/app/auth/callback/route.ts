import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Determine the user's locale from the NEXT_LOCALE cookie set by next-intl
      const localeCookie = cookieStore.get('NEXT_LOCALE');
      const locale = localeCookie?.value || 'en';
      
      let redirectedPath = next;
      // If the 'next' URL doesn't already have a locale prefix (e.g. it's just '/solve'), prepend the locale
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

    console.error('[auth callback] Code exchange error:', error.message);
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/en/auth/login?error=auth_failed`);
}
