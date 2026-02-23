import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/update-password', '/auth/callback', '/pricing', '/share', '/privacy', '/terms'];
// Static/API routes to skip entirely
const skipRoutes = ['/api/', '/_next/', '/favicon.ico', '/manifest.json', '/icon-'];

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API routes
  if (skipRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (important for server-side auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Strip locale from pathname to check public routes correctly
  const pathWithoutLocale = pathname.replace(/^\/[a-zA-Z]{2}(\/|$)/, '/');

  // If not authenticated and trying to access protected route
  const isPublicRoute = pathWithoutLocale === '/' || publicRoutes.some((route) => pathWithoutLocale.startsWith(route));
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    // Extract locale from current path, fallback to 'en'
    const localeMatch = pathname.match(/^\/([a-zA-Z]{2})(\/|$)/);
    const currentLocale = localeMatch ? localeMatch[1] : 'en';
    url.pathname = `/${currentLocale}/auth/login`;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access auth pages, redirect to app
  if (user && (pathWithoutLocale.startsWith('/auth/login') || pathWithoutLocale.startsWith('/auth/signup'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/en/solve';
    return NextResponse.redirect(url);
  }

  // CRITICAL BYPASS: Do not let next-intl intercept and redirect the OAuth callback
  // because Supabase PKCE requires the redirect_uri to match EXACTLY during code exchange.
  if (pathWithoutLocale === '/auth/callback') {
    return response;
  }

  // Pass the request to the next-intl middleware for locale routing
  const intlResponse = handleI18nRouting(request);

  // Merge the Supabase session headers into the final next-intl response
  // We ONLY care about cookies here so session refresh works.
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      intlResponse.headers.append(key, value);
    }
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)'],
};
