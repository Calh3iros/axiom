"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  User,
  Crown,
  CreditCard,
  Mail,
  Calendar,
  Loader2,
  ExternalLink,
  Shield,
  Trash2,
  Lock,
  Check,
  Headphones,
  FileText,
  BookOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  plan: "free" | "pro" | "elite";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  badges: string[] | null;
};

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const t = useTranslations("Dashboard.Settings");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = (await supabase
          .from("profiles")
          .select(
            "plan, stripe_customer_id, stripe_subscription_id, created_at, badges"
          )
          .eq("id", user.id)
          .single()) as { data: Profile | null };
        setProfile(data);
      }
      setLoading(false);
    });
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create portal session");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Error opening subscription management. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const [isYearly, setIsYearly] = useState(false);

  const handleUpgrade = async () => {
    try {
      const { STRIPE_PRICES } = await import("@/lib/stripe/config");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: isYearly
            ? STRIPE_PRICES.PRO_YEARLY
            : STRIPE_PRICES.PRO_MONTHLY,
          locale: window.location.pathname.split("/")[1] || "en",
        }),
      });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Error initiating checkout. Please try again.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordSuccess(false), 5000);
      }
    } catch {
      setPasswordError("An unexpected error occurred.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const isEmailProvider = user?.app_metadata?.provider === "email";
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-ax-blue)]" />
      </div>
    );
  }

  const isPro = profile?.plan === "pro" || profile?.plan === "elite";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {t("description")}
        </p>
      </header>

      {/* ── Profile Card ── */}
      <div className="rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6">
        <div className="mb-6 flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-14 w-14 rounded-full border-2 border-[var(--color-border)]"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--color-ax-blue)]/25 bg-[var(--color-ax-blue)]/15">
              <User className="h-6 w-6 text-[var(--color-ax-blue)]" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              {displayName}
            </h2>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-4">
            <div className="mb-1 flex items-center gap-2 font-mono text-xs tracking-wider text-[var(--color-dim)] uppercase">
              <Calendar className="h-3.5 w-3.5" />
              {t("memberSince")}
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {memberSince}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-4">
            <div className="mb-1 flex items-center gap-2 font-mono text-xs tracking-wider text-[var(--color-dim)] uppercase">
              <Shield className="h-3.5 w-3.5" />
              {t("authProvider")}
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">
              {user?.app_metadata?.provider || "Email"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Achievements Card ── */}
      <div className="rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
            🏆 {t("achievements")}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t("achievementsDesc")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Badge 1: 1-Week Scholar */}
          <div
            className={`flex flex-col items-center justify-center rounded-xl border p-4 ${
              profile?.badges?.includes("1_week_scholar")
                ? "border-[var(--color-ax-yellow)]/20 bg-[var(--color-ax-yellow)]/10"
                : "border-[var(--color-border)] bg-[var(--color-bg0)] opacity-60 grayscale"
            }`}
          >
            <div
              className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                profile?.badges?.includes("1_week_scholar")
                  ? "bg-[var(--color-ax-yellow)]/20 text-[var(--color-ax-yellow)]"
                  : "bg-[var(--color-bg2)] text-[var(--color-dim)]"
              }`}
            >
              🔥
            </div>
            <p className="text-center text-sm font-bold text-[var(--color-text-primary)]">
              {t("scholar7")}
            </p>
            <p className="mt-1 text-center text-[10px] text-[var(--color-text-secondary)]">
              {t("scholar7Desc")}
            </p>
          </div>

          {/* Badge 2: Monthly Master */}
          <div
            className={`flex flex-col items-center justify-center rounded-xl border p-4 ${
              profile?.badges?.includes("monthly_master")
                ? "border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/10"
                : "border-[var(--color-border)] bg-[var(--color-bg0)] opacity-60 grayscale"
            }`}
          >
            <div
              className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                profile?.badges?.includes("monthly_master")
                  ? "bg-[var(--color-ax-blue)]/20 text-[var(--color-ax-blue)]"
                  : "bg-[var(--color-bg2)] text-[var(--color-dim)]"
              }`}
            >
              🎖️
            </div>
            <p className="text-center text-sm font-bold text-[var(--color-text-primary)]">
              {t("master30")}
            </p>
            <p className="mt-1 text-center text-[10px] text-[var(--color-text-secondary)]">
              {t("master30Desc")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Plan Card ── */}
      <div
        className={`rounded-2xl border bg-[var(--color-bg1)] p-6 ${
          isPro
            ? "border-[var(--color-ax-yellow)]/30 shadow-[0_0_40px_rgba(250,204,21,0.05)]"
            : "border-[var(--color-border2)]"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isPro
                  ? "border border-[var(--color-ax-yellow)]/20 bg-[var(--color-ax-yellow)]/10"
                  : "border border-[var(--color-border)] bg-[var(--color-bg2)]"
              }`}
            >
              <Crown
                className={`h-5 w-5 ${isPro ? "text-[var(--color-ax-yellow)]" : "text-[var(--color-dim)]"}`}
              />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)]">
                {isPro ? t("planPro") : t("planFree")}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isPro ? t("planProDesc") : t("planFreeDesc")}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 font-mono text-xs font-bold ${
              isPro
                ? "border border-[var(--color-ax-yellow)]/20 bg-[var(--color-ax-yellow)]/10 text-[var(--color-ax-yellow)]"
                : "border border-[var(--color-border)] bg-[var(--color-bg2)] text-[var(--color-dim)]"
            }`}
          >
            {isPro ? "PRO ✨" : "FREE"}
          </span>
        </div>

        {isPro ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-1 font-mono text-xs tracking-wider text-[var(--color-dim)] uppercase">
                    {t("billing")}
                  </p>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {t("managedViaStripe")}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-xs tracking-wider text-[var(--color-dim)] uppercase">
                    {t("status")}
                  </p>
                  <p className="font-semibold text-orange-400">
                    {t("active")}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg2)] py-3 font-semibold text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-bg3)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {portalLoading ? t("opening") : t("manageSubscription")}
              {!portalLoading && <ExternalLink className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="mx-auto flex w-full max-w-[280px] items-center justify-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-2">
              <button
                onClick={() => setIsYearly(false)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${!isYearly ? "bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-dim)]"}`}
              >
                {t("monthly")}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${isYearly ? "bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-dim)]"}`}
              >
                {t("yearly")}{" "}
                <span className="ml-1 text-[var(--color-ax-green)]">-30%</span>
              </button>
            </div>
            <button
              onClick={handleUpgrade}
              className="w-full rounded-xl bg-[var(--color-ax-yellow)] py-3 font-bold text-black transition-all hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
            >
              {t("upgradeToProPricing")}
              {isYearly ? "$16/mo" : "$19/mo"}
            </button>
          </div>
        )}
      </div>

      {/* ── Change Password (email users only) ── */}
      {isEmailProvider && (
        <div className="rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/10">
              <Lock className="h-5 w-5 text-[var(--color-ax-blue)]" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)]">
                {t("changePassword")}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t("changePasswordDesc")}
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label
                htmlFor="newPassword"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                {t("newPassword")}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-dim)] focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="confirmNewPassword"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                {t("confirmNewPassword")}
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-dim)] focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40 focus:outline-none"
              />
            </div>

            {passwordError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-400">
                <Check className="h-4 w-4" />
                {t("passwordUpdated")}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ax-blue)] py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("updatePassword")}
            </button>
          </form>
        </div>
      )}

      {/* ── Help & Support ── */}
      <div className="rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
            <Headphones className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)]">
              {t("helpSupport")}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {t("helpSupportDesc")}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <a
            href="mailto:mysupport@axiom-solver.com"
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-3 text-sm text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-ax-blue)]/30 hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
          >
            <Mail className="h-4 w-4 text-[var(--color-ax-blue)]" />
            <span className="flex-1">{t("emailSupport")}</span>
            <span className="font-mono text-xs text-[var(--color-dim)]">
              mysupport@axiom-solver.com
            </span>
          </a>
          <Link
            href="/privacy"
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-3 text-sm text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-ax-blue)]/30 hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
          >
            <FileText className="h-4 w-4 text-[var(--color-dim)]" />
            <span className="flex-1">{t("privacyPolicy")}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--color-dim)]" />
          </Link>
          <Link
            href="/terms"
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-3 text-sm text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-ax-blue)]/30 hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
          >
            <BookOpen className="h-4 w-4 text-[var(--color-dim)]" />
            <span className="flex-1">{t("termsOfService")}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--color-dim)]" />
          </Link>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="rounded-2xl border border-red-500/20 bg-[var(--color-bg1)] p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-red-500/10 p-2">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
        </div>

        {!deleteConfirm ? (
          <div>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="rounded-xl border border-red-500/30 px-6 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10"
            >
              Delete my account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-400">
              Are you absolutely sure? All your data, usage history, and
              subscription will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    const res = await fetch("/api/account/delete", {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    } else {
                      alert("Failed to delete account. Please try again.");
                    }
                  } catch {
                    alert("Error deleting account.");
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] px-6 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
