"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { PricingSection } from "@/components/shared/pricing-section";
import { Link } from "@/i18n/routing";

export default function PricingPage() {
  const t = useTranslations("Landing");

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] text-[var(--color-text-primary)]">
      {/* Nav */}
      <nav className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg0)]/80 px-6 backdrop-blur-xl md:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          AXIOM
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            {t("nav.login") || "Login"}
          </Link>
          <Link
            href="/solve"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[var(--color-bg0)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]"
          >
            {t("cta.btn").split("—")[0].trim()} →
          </Link>
        </div>
      </nav>

      {/* Pricing */}
      <div className="pt-24">
        <PricingSection />
      </div>
    </div>
  );
}
