"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/routing";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const t = useTranslations("Landing");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: "pro" | "elite") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval: isYearly ? "yearly" : "monthly",
          locale,
        }),
      });
      const data = await res.json();
      if (data.url) {
        router.push(data.url);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="px-5 py-24 md:px-10">
      <div className="mb-16 text-center">
        <p className="mb-4 font-mono text-xs font-bold tracking-[3px] text-emerald-400 uppercase">
          {t("pricing.badge")}
        </p>
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
          {t("pricing.title")}
        </h2>
        <p className="text-lg text-[var(--color-text-secondary)]">
          {t("pricing.subtitle")}
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8">
          <p className="mb-4 font-mono text-xs font-bold tracking-wider text-[var(--color-dim)] uppercase">
            {t("pricing.freeTitle")}
          </p>
          <p className="mb-1 text-5xl font-extrabold">
            <span className="align-top text-2xl text-[var(--color-text-secondary)]">
              $
            </span>
            0
          </p>
          <p className="mb-7 text-sm text-[var(--color-dim)]">
            {t("pricing.foreverNoSignup")}
          </p>
          <ul className="flex-1 space-y-3 text-sm text-[var(--color-text-secondary)]">
            {(t.raw("pricing.freeFeatures") as string[]).map(
              (item: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-2 border-b border-[var(--color-border)] py-2 last:border-0"
                >
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              )
            )}
          </ul>
          <Link
            href="/solve"
            className="mt-8 block w-full rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg3)] py-3 text-center font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)]"
          >
            {t("pricing.startFree")}
          </Link>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col rounded-2xl border border-emerald-500/30 bg-[var(--color-bg1)] p-8 shadow-[0_0_60px_rgba(52,211,153,0.08)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1.5 font-mono text-[10px] font-bold tracking-wider whitespace-nowrap text-[var(--color-bg0)] uppercase">
            {t("pricing.mostPopular")}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-xs font-bold tracking-wider text-[var(--color-dim)] uppercase">
              {t("pricing.proTitle")}
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg0)] p-1">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-md px-3 py-1 text-[10px] font-bold transition-all ${!isYearly ? "bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-dim)]"}`}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-md px-3 py-1 text-[10px] font-bold transition-all ${isYearly ? "bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-dim)]"}`}
              >
                {t("pricing.yearly")}
              </button>
            </div>
          </div>

          <p className="mb-1 text-5xl font-extrabold">
            <span className="align-top text-2xl text-[var(--color-text-secondary)]">
              $
            </span>
            {isYearly ? Math.round(190 / 12) : 19}
          </p>
          <p className="mb-7 text-sm text-[var(--color-dim)]">
            {isYearly
              ? t("pricing.billedAnnually")
              : t("pricing.cancelAnytime")}
          </p>
          <ul className="flex-1 space-y-3 text-sm text-[var(--color-text-primary)]">
            {(t.raw("pricing.proFeatures") as string[]).map(
              (item: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-2 border-b border-[var(--color-border)] py-2 last:border-0"
                >
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              )
            )}
          </ul>
          <button
            onClick={() => handleCheckout("pro")}
            disabled={loading === "pro"}
            className="mt-8 block w-full rounded-xl bg-emerald-500 py-3 text-center font-bold text-[var(--color-bg0)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
          >
            {loading === "pro" ? "Processing..." : t("pricing.getPro")}
          </button>
        </div>

        {/* Elite */}
        <div className="relative flex flex-col rounded-2xl border border-amber-500/30 bg-[var(--color-bg1)] p-8 shadow-[0_0_60px_rgba(251,191,36,0.06)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1.5 font-mono text-[10px] font-bold tracking-wider whitespace-nowrap text-[var(--color-bg0)] uppercase">
            {t("pricing.bestValue")}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-xs font-bold tracking-wider text-amber-400 uppercase">
              {t("pricing.eliteTitle")}
            </p>
          </div>

          <p className="mb-1 text-5xl font-extrabold">
            <span className="align-top text-2xl text-[var(--color-text-secondary)]">
              $
            </span>
            {isYearly ? Math.round(490 / 12) : 49}
          </p>
          <p className="mb-7 text-sm text-[var(--color-dim)]">
            {isYearly
              ? t("pricing.billedAnnually")
              : t("pricing.cancelAnytime")}
          </p>
          <ul className="flex-1 space-y-3 text-sm text-[var(--color-text-primary)]">
            {(t.raw("pricing.eliteFeatures") as string[]).map(
              (item: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-2 border-b border-[var(--color-border)] py-2 last:border-0"
                >
                  <span className="mt-0.5 text-amber-400">✓</span>
                  {item}
                </li>
              )
            )}
          </ul>
          <button
            onClick={() => handleCheckout("elite")}
            disabled={loading === "elite"}
            className="mt-8 block w-full rounded-xl bg-amber-500 py-3 text-center font-bold text-[var(--color-bg0)] transition-all hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50"
          >
            {loading === "elite" ? "Processing..." : t("pricing.getElite")}
          </button>
        </div>
      </div>
    </section>
  );
}
