"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Home,
  PenTool,
  Wand2,
  BookOpen,
  Settings,
  HelpCircle,
  CreditCard,
  Menu,
  X,
  LogOut,
  Target,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { OnboardingModal } from "@/components/shared/onboarding-modal";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
// PlanType mirrors usage.ts but we can't import PLANS (it pulls in supabaseAdmin)
type PlanType = "free" | "pro" | "elite";

/** Daily solve limits per plan (mirrors PLANS in usage.ts) */
const DAILY_SOLVES: Record<PlanType, number> = {
  free: 3,
  pro: 50,
  elite: Infinity,
};

const navItems = [
  { id: "solve", href: "/solve", icon: Home },
  { id: "write", href: "/write", icon: PenTool },
  { id: "humanize", href: "/humanize", icon: Wand2 },
  { id: "learn", href: "/learn", icon: BookOpen },
  { id: "map", href: "/map", icon: Target },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [plan, setPlan] = useState<PlanType>("free");
  const [solvesRemaining, setSolvesRemaining] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [checkoutToast, setCheckoutToast] = useState<
    "success" | "cancelled" | null
  >(null);
  const t = useTranslations("Dashboard.Sidebar");
  const searchParams = useSearchParams();

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data: profile } = (await supabase
      .from("profiles")
      .select("plan, current_streak")
      .eq("id", userId)
      .single()) as {
      data: { plan: string; current_streak: number | null } | null;
    };
    if (profile?.plan) {
      const p = (
        ["free", "pro", "elite"].includes(profile.plan) ? profile.plan : "free"
      ) as PlanType;
      setPlan(p);
      const dailySolves = DAILY_SOLVES[p];
      setSolvesRemaining(dailySolves === Infinity ? Infinity : dailySolves);
    }
    if (profile?.current_streak !== undefined)
      setStreak(profile.current_streak || 0);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user and their plan
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Re-fetch plan after Stripe Checkout redirect
  useEffect(() => {
    if (searchParams.get("checkout") === "success" && user) {
      setCheckoutToast("success");
      // Webhook may take a moment to update the DB — poll a few times
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await fetchProfile(user.id);
        if (attempts >= 5) clearInterval(poll);
      }, 2000);
      // Also fetch immediately
      fetchProfile(user.id);
      return () => clearInterval(poll);
    }
    if (searchParams.get("checkout") === "cancelled") {
      setCheckoutToast("cancelled");
    }
  }, [searchParams, user, fetchProfile]);

  // Auto-dismiss checkout toast after 6s
  useEffect(() => {
    if (!checkoutToast) return;
    const timer = setTimeout(() => setCheckoutToast(null), 6000);
    return () => clearTimeout(timer);
  }, [checkoutToast]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  // Derive display info
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg0)]">
      {/* Mobile Header & Nav Toggle */}
      <div className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg1)] p-4 md:hidden">
        <Link
          href="/"
          className="font-mono text-xl font-bold tracking-tight text-[var(--color-text-primary)]"
        >
          AXIOM<span className="text-[var(--color-ax-blue)]">.</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[var(--color-text-secondary)] hover:text-white"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-[var(--color-border)] bg-[var(--color-bg1)] transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        {/* Logo Area */}
        <div className="flex hidden h-16 items-center border-b border-[var(--color-border)] px-6 md:flex">
          <Link
            href="/"
            className="font-mono text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
          >
            AXIOM<span className="text-[var(--color-ax-blue)]">.</span>
          </Link>
        </div>

        {/* Main Nav Links */}
        <nav className="mt-16 flex-1 space-y-2 overflow-y-auto px-4 py-6 md:mt-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname === "/" && item.href === "/solve");
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                  isActive
                    ? "border border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/10 text-[var(--color-text-primary)] shadow-[0_0_15px_rgba(96,165,250,0.05)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
                } `}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-[var(--color-ax-blue)]" : ""}`}
                />
                {t(item.id)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions / User */}
        <div className="space-y-2 border-t border-[var(--color-border)] p-4">
          {plan === "free" && (
            <Link
              href="/pricing"
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)]"
            >
              <CreditCard className="h-4 w-4" /> {t("upgradeToPro")}
            </Link>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)]"
          >
            <Settings className="h-4 w-4" /> {t("settings")}
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)]"
          >
            <HelpCircle className="h-4 w-4" /> {t("faq")}
          </Link>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="mt-2 border-t border-[var(--color-border)] pt-2">
              <div className="flex items-center gap-3 px-4 py-2.5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full border border-[var(--color-border)]"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-ax-blue)]/25 bg-[var(--color-ax-blue)]/15">
                    <span className="text-xs font-bold text-[var(--color-ax-blue)]">
                      {initials}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-dim)]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? t("signingOut") : t("signOut")}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col pt-16 md:overflow-y-auto md:pt-0">
        {/* Topbar with streak + usage */}
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg1)]/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/15 bg-amber-500/8 px-3 py-1.5 font-mono text-xs font-semibold text-amber-400">
              🔥 <span>{streak}</span>
            </div>
            <span className="hidden text-xs text-[var(--color-dim)] sm:inline">
              {t("dayStreak")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <div className="hidden text-xs text-[var(--color-text-secondary)] md:block">
              <span className="font-semibold text-emerald-400">
                {solvesRemaining === Infinity ? "∞" : (solvesRemaining ?? "—")}
              </span>{" "}
              {t("solvesLeftToday")}
            </div>
            <div className="hidden h-5 w-px bg-[var(--color-border)] md:block" />
            <span
              className={`font-mono text-xs font-semibold ${
                plan === "elite"
                  ? "text-amber-400"
                  : plan === "pro"
                    ? "text-[var(--color-ax-yellow)]"
                    : "text-[var(--color-dim)]"
              }`}
            >
              {plan === "elite" ? "ELITE" : plan === "pro" ? "PRO" : "FREE"}
            </span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Checkout toast */}
      {checkoutToast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl px-6 py-3 text-sm font-medium shadow-lg ${
            checkoutToast === "success"
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              : "border border-amber-500/30 bg-amber-500/15 text-amber-400"
          }`}
        >
          <span>
            {t(
              checkoutToast === "success"
                ? "checkoutSuccess"
                : "checkoutCancelled"
            )}
          </span>
          <button
            onClick={() => setCheckoutToast(null)}
            className="ml-2 transition-opacity hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Onboarding modal — shows once for new users */}
      <OnboardingModal />
    </div>
  );
}
