import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";
import { welcomeEmailHtml, welcomeEmailHtmlPt } from "@/lib/email-templates";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/map";

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
      // ── Welcome email (fire-and-forget) ──────────────────────────
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const isNewSignup =
            user.created_at &&
            Date.now() - new Date(user.created_at).getTime() < 5 * 60 * 1000;

          if (isNewSignup && user.email) {
            // Detect locale from the URL path
            const pathSegments = new URL(request.url).pathname.split("/");
            const locale = pathSegments[1] === "pt" ? "pt" : "en";
            const name =
              user.user_metadata?.full_name || user.user_metadata?.name || "";
            const html =
              locale === "pt"
                ? welcomeEmailHtmlPt(name)
                : welcomeEmailHtml(name);
            // Fire-and-forget — don't await, don't block redirect
            sendEmail({
              to: user.email,
              subject:
                locale === "pt"
                  ? "Bem-vindo ao Axiom! 🎓"
                  : "Welcome to Axiom! 🎓",
              html,
            });
          }
        }
      } catch (emailErr) {
        console.error("[auth callback] Welcome email error:", emailErr);
      }
      // ─────────────────────────────────────────────────────────────

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    console.error("[auth callback] Code exchange error:", error.message);
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
