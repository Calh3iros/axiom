"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { PricingSection } from "@/components/shared/pricing-section";
import { Link } from "@/i18n/routing";

export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] text-[var(--color-text-primary)]">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg0)]/80 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          AXIOM
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
        </div>
        <div className="hidden items-center gap-8 text-sm text-[var(--color-text-secondary)] md:flex">
          <a
            href="#features"
            className="transition-colors hover:text-[var(--color-text-primary)]"
          >
            {t("nav.features")}
          </a>
          <a
            href="#compare"
            className="transition-colors hover:text-[var(--color-text-primary)]"
          >
            {t("nav.compare")}
          </a>
          <a
            href="#pricing"
            className="transition-colors hover:text-[var(--color-text-primary)]"
          >
            {t("nav.pricing")}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium text-sm transition-colors hidden sm:block"
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-semibold text-sm rounded-lg transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] hidden sm:block"
          >
            {t('nav.startNow')} →
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-24 pb-20 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute top-[-20%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(52,211,153,0.06)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[600px] w-[600px] bg-[radial-gradient(circle,rgba(96,165,250,0.04)_0%,transparent_70%)]" />

        {/* Badge */}
        <div className="mb-8 inline-flex animate-[fadeUp_0.8s_ease_both] items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-4 py-2 text-sm font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t("hero.badge")}
        </div>

        {/* Title */}
        <h1 className="mb-6 max-w-3xl animate-[fadeUp_0.8s_0.1s_ease_both] text-[clamp(40px,7vw,80px)] leading-[1.05] font-extrabold tracking-tight">
          {t("hero.title") || "Stop Waiting. Start Solving."}
        </h1>

        {/* Subtitle */}
        <p className="mb-12 max-w-xl animate-[fadeUp_0.8s_0.2s_ease_both] text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          {t("hero.subtitle")}{" "}
          <strong className="text-[var(--color-text-primary)]">
            {t("hero.allFor")}
          </strong>
        </p>

        {/* CTA */}
        <div className="flex animate-[fadeUp_0.8s_0.3s_ease_both] flex-col gap-4 sm:flex-row">
          <Link
            href="/solve"
            className="rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-[var(--color-bg0)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]"
          >
            {t("hero.ctaFree")}
          </Link>
          <a
            href="#pricing"
            className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg2)] px-8 py-4 text-base font-semibold text-[var(--color-text-secondary)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-text-secondary)]/30"
          >
            {t("hero.seePricing")}
          </a>
        </div>

        {/* Social Proof */}
        <div className="mt-12 flex animate-[fadeUp_0.8s_0.5s_ease_both] flex-col items-center gap-3">
          <div className="flex items-center justify-center -space-x-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-bg0)] bg-[var(--color-bg1)]"
              >
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  alt={t("hero.studentAvatar", {
                    defaultMessage: "Student Avatar",
                  })}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-1 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="h-4 w-4 fill-current text-emerald-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {t("hero.trustedBy")}{" "}
              <strong className="text-[var(--color-text-primary)]">
                10,000+
              </strong>{" "}
              {t("hero.studentsGlobally").split("10,000+")[1]}
            </p>
          </div>
          <p className="mt-2 max-w-sm text-xs text-[var(--color-dim)]">
            {t("hero.freeBadge")}
          </p>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-5 py-24 md:px-10">
        <div className="mb-16 text-center">
          <p className="mb-4 font-mono text-xs font-bold tracking-[3px] text-emerald-400 uppercase">
            {t("features.superpowers")}
          </p>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
            {t("features.title")}
          </h2>
          <p className="mx-auto max-w-lg text-lg text-[var(--color-text-secondary)]">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {/* Solve */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
              📸
            </div>
            <h3 className="mb-3 text-2xl font-bold">
              {t("features.solveTitle")}
            </h3>
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              {t("features.solveDesc")}
            </p>
            <span className="mt-4 inline-block rounded-md bg-emerald-500/8 px-3 py-1 font-mono text-xs font-medium text-emerald-400">
              {t("features.solveBadge")}
            </span>
          </div>

          {/* Write */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/20">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
              ✍️
            </div>
            <h3 className="mb-3 text-2xl font-bold">
              {t("features.writeTitle")}
            </h3>
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              {t("features.writeDesc")}
            </p>
            <span className="mt-4 inline-block rounded-md bg-blue-500/8 px-3 py-1 font-mono text-xs font-medium text-blue-400">
              {t("features.writeBadge")}
            </span>
          </div>

          {/* Humanize */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/20">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-orange-500/10 text-2xl">
              🔄
            </div>
            <h3 className="mb-3 text-2xl font-bold">
              {t("features.humanizeTitle")}
            </h3>
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              {t("features.humanizeDesc")}
            </p>
            <span className="mt-4 inline-block rounded-md bg-orange-500/8 px-3 py-1 font-mono text-xs font-medium text-orange-400">
              {t("features.humanizeBadge")}
            </span>
          </div>

          {/* Learn */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/20">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-purple-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
              🧠
            </div>
            <h3 className="mb-3 text-2xl font-bold">
              {t("features.learnTitle")}
            </h3>
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              {t("features.learnDesc")}
            </p>
            <span className="mt-4 inline-block rounded-md bg-purple-500/8 px-3 py-1 font-mono text-xs font-medium text-purple-400">
              {t("features.learnBadge")}
            </span>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section
        id="compare"
        className="flex flex-col items-center px-5 py-24 md:px-10"
      >
        <p className="mb-4 font-mono text-xs font-bold tracking-[3px] text-emerald-400 uppercase">
          {t("compare.badge")}
        </p>
        <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight md:text-5xl">
          {t("compare.title")}
        </h2>
        <p className="mb-12 max-w-xl text-center text-lg text-[var(--color-text-secondary)]">
          {t("compare.subtitle")}
        </p>

        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-[1fr_50px_1fr] text-sm md:grid-cols-[1fr_80px_1fr]">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] p-4 text-center font-mono text-xs font-bold tracking-wider text-red-400 uppercase">
              {t("compare.oldWay")}
            </div>
            <div className="border-b border-[var(--color-border)] p-4 text-center font-mono text-xs font-bold tracking-wider text-[var(--color-dim)] uppercase">
              {t("compare.vs")}
            </div>
            <div className="border-b border-[var(--color-border)] p-4 text-center font-mono text-xs font-bold tracking-wider text-emerald-400 uppercase">
              {t("compare.axiom")}
            </div>

            {/* Rows */}
            {[
              [t("compare.row1Old"), "⏱", t("compare.row1New")],
              [t("compare.row2Old"), "💬", t("compare.row2New")],
              [t("compare.row3Old"), "💰", t("compare.row3New")],
              [t("compare.row4Old"), "🔄", t("compare.row4New")],
              [t("compare.row5Old"), "📝", t("compare.row5New")],
              [t("compare.row6Old"), "⚡", t("compare.row6New")],
            ].map(([old, icon, newText], i) => (
              <div key={i} className="contents">
                <div className="flex items-center justify-end border-b border-[var(--color-border)] p-4 text-right text-[var(--color-dim)] line-through decoration-red-400/30">
                  {old}
                </div>
                <div className="flex items-center justify-center border-b border-[var(--color-border)] p-4 font-mono text-xs text-[var(--color-dim)]">
                  {icon}
                </div>
                <div className="flex items-center border-b border-[var(--color-border)] p-4 font-medium text-[var(--color-text-primary)]">
                  {newText}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <PricingSection />

      {/* ─── FINAL CTA ─── */}
      <section className="px-5 py-24 text-center">
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-5xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-lg text-[var(--color-text-secondary)]">
          {t("cta.subtitle")}
        </p>
        <Link
          href="/solve"
          className="inline-block rounded-xl bg-emerald-500 px-10 py-4 text-lg font-bold text-[var(--color-bg0)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]"
        >
          {t("cta.btn")}
        </Link>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--color-border)] px-5 py-12 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-lg font-extrabold">
            AXIOM
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="text-sm text-[var(--color-dim)]">{t("footer.copy")}</p>
          <div className="flex gap-6 text-sm text-[var(--color-text-secondary)]">
            <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-[var(--color-text-primary)] transition-colors">{t('footer.terms')}</Link>
            <a href="mailto:mysupport@axiom-solver.com" className="hover:text-[var(--color-text-primary)] transition-colors">mysupport@axiom-solver.com</a>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
