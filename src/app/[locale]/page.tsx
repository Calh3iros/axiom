'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Link } from '@/i18n/routing';

export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const t = useTranslations('Landing');

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] text-[var(--color-text-primary)]">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-6 md:px-10 flex items-center justify-between bg-[var(--color-bg0)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          AXIOM<span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--color-text-secondary)]">
          <a href="#features" className="hover:text-[var(--color-text-primary)] transition-colors">{t('nav.features')}</a>
          <a href="#compare" className="hover:text-[var(--color-text-primary)] transition-colors">{t('nav.compare')}</a>
          <a href="#pricing" className="hover:text-[var(--color-text-primary)] transition-colors">{t('nav.pricing')}</a>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/solve"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-semibold text-sm rounded-lg transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] hidden sm:block"
          >
            {t('cta.btn').split('—')[0].trim()} →
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(52,211,153,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(96,165,250,0.04)_0%,transparent_70%)] pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/15 rounded-full text-emerald-400 text-sm font-medium mb-8 animate-[fadeUp_0.8s_ease_both]">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          {t('hero.badge')}
        </div>

        {/* Title */}
        <h1 className="text-[clamp(40px,7vw,80px)] font-extrabold leading-[1.05] tracking-tight max-w-3xl mb-6 animate-[fadeUp_0.8s_0.1s_ease_both]">
          {t('hero.title') || 'Stop Waiting. Start Solving.'}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-xl mb-12 leading-relaxed animate-[fadeUp_0.8s_0.2s_ease_both]">
          {t('hero.subtitle')} <strong className="text-[var(--color-text-primary)]">{t('hero.allFor')}</strong>
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 animate-[fadeUp_0.8s_0.3s_ease_both]">
          <Link
            href="/solve"
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-bold text-base rounded-xl transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:-translate-y-0.5"
          >
            {t('hero.ctaFree')}
          </Link>
          <a
            href="#pricing"
            className="px-8 py-4 bg-[var(--color-bg2)] border border-[var(--color-border2)] text-[var(--color-text-secondary)] font-semibold text-base rounded-xl transition-all hover:border-[var(--color-text-secondary)]/30 hover:-translate-y-0.5"
          >
            {t('hero.seePricing')}
          </a>
        </div>

        {/* Social Proof */}
        <div className="mt-12 flex flex-col items-center gap-3 animate-[fadeUp_0.8s_0.5s_ease_both]">
          <div className="flex items-center justify-center -space-x-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--color-bg0)] overflow-hidden bg-[var(--color-bg1)] flex items-center justify-center">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={t('hero.studentAvatar', { defaultMessage: 'Student Avatar' })} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <div className="flex gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-emerald-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {t('hero.trustedBy')} <strong className="text-[var(--color-text-primary)]">10,000+</strong> {t('hero.studentsGlobally').split('10,000+')[1]}
            </p>
          </div>
          <p className="mt-2 text-xs text-[var(--color-dim)] max-w-sm">
            {t('hero.freeBadge')}
          </p>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-5 md:px-10">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[3px] uppercase text-emerald-400 mb-4 font-mono">{t('features.superpowers')}</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{t('features.title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-lg mx-auto">{t('features.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {/* Solve */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl mb-5">📸</div>
            <h3 className="text-2xl font-bold mb-3">{t('features.solveTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">{t('features.solveDesc')}</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-emerald-500/8 text-emerald-400 rounded-md">{t('features.solveBadge')}</span>
          </div>

          {/* Write */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-blue-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl mb-5">✍️</div>
            <h3 className="text-2xl font-bold mb-3">{t('features.writeTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">{t('features.writeDesc')}</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-blue-500/8 text-blue-400 rounded-md">{t('features.writeBadge')}</span>
          </div>

          {/* Humanize */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-orange-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl mb-5">🔄</div>
            <h3 className="text-2xl font-bold mb-3">{t('features.humanizeTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">{t('features.humanizeDesc')}</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-orange-500/8 text-orange-400 rounded-md">{t('features.humanizeBadge')}</span>
          </div>

          {/* Learn */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-purple-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl mb-5">🧠</div>
            <h3 className="text-2xl font-bold mb-3">{t('features.learnTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">{t('features.learnDesc')}</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-purple-500/8 text-purple-400 rounded-md">{t('features.learnBadge')}</span>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section id="compare" className="py-24 px-5 md:px-10 flex flex-col items-center">
        <p className="text-xs font-bold tracking-[3px] uppercase text-emerald-400 mb-4 font-mono">{t('compare.badge')}</p>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center mb-4">{t('compare.title')}</h2>
        <p className="text-[var(--color-text-secondary)] text-lg text-center max-w-xl mb-12">{t('compare.subtitle')}</p>

        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-[1fr_50px_1fr] md:grid-cols-[1fr_80px_1fr] text-sm">
            {/* Header */}
            <div className="p-4 text-center font-mono text-xs font-bold tracking-wider uppercase text-red-400 border-b border-[var(--color-border)]">{t('compare.oldWay')}</div>
            <div className="p-4 text-center font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-dim)] border-b border-[var(--color-border)]">{t('compare.vs')}</div>
            <div className="p-4 text-center font-mono text-xs font-bold tracking-wider uppercase text-emerald-400 border-b border-[var(--color-border)]">{t('compare.axiom')}</div>

            {/* Rows */}
            {[
              [t('compare.row1Old'), '⏱', t('compare.row1New')],
              [t('compare.row2Old'), '💬', t('compare.row2New')],
              [t('compare.row3Old'), '💰', t('compare.row3New')],
              [t('compare.row4Old'), '🔄', t('compare.row4New')],
              [t('compare.row5Old'), '📝', t('compare.row5New')],
              [t('compare.row6Old'), '⚡', t('compare.row6New')],
            ].map(([old, icon, newText], i) => (
              <div key={i} className="contents">
                <div className="p-4 flex items-center justify-end text-right text-[var(--color-dim)] line-through decoration-red-400/30 border-b border-[var(--color-border)]">{old}</div>
                <div className="p-4 flex items-center justify-center text-[var(--color-dim)] font-mono text-xs border-b border-[var(--color-border)]">{icon}</div>
                <div className="p-4 flex items-center text-[var(--color-text-primary)] font-medium border-b border-[var(--color-border)]">{newText}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 px-5 md:px-10">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[3px] uppercase text-emerald-400 mb-4 font-mono">{t('pricing.badge')}</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{t('pricing.title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-lg">{t('pricing.subtitle')}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-5 max-w-3xl mx-auto">
          {/* Free */}
          <div className="flex-1 bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8">
            <p className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-dim)] mb-4">{t('pricing.freeTitle')}</p>
            <p className="text-5xl font-extrabold mb-1"><span className="text-2xl text-[var(--color-text-secondary)] align-top">$</span>0</p>
            <p className="text-sm text-[var(--color-dim)] mb-7">{t('pricing.foreverNoSignup')}</p>
            <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              {(t.raw('pricing.freeFeatures') as string[]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 py-2 border-b border-[var(--color-border)] last:border-0">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/solve"
              className="mt-8 block w-full py-3 text-center bg-[var(--color-bg3)] border border-[var(--color-border2)] text-[var(--color-text-secondary)] font-semibold rounded-xl hover:bg-[var(--color-bg2)] transition-colors"
            >
              {t('pricing.startFree')}
            </Link>
          </div>

          {/* Pro */}
          <div className="flex-1 bg-[var(--color-bg1)] border border-emerald-500/30 rounded-2xl p-8 relative shadow-[0_0_60px_rgba(52,211,153,0.08)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-[var(--color-bg0)] font-mono text-[10px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full whitespace-nowrap">
              {t('pricing.mostPopular')}
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-dim)]">{t('pricing.proTitle')}</p>
              <div className="flex items-center gap-2 bg-[var(--color-bg0)] p-1 rounded-lg border border-[var(--color-border)]">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!isYearly ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-dim)]'}`}
                >
                  {t('pricing.monthly')}
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${isYearly ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-dim)]'}`}
                >
                  {t('pricing.yearly')}
                </button>
              </div>
            </div>

            <p className="text-5xl font-extrabold mb-1">
              <span className="text-2xl text-[var(--color-text-secondary)] align-top">$</span>
              {isYearly ? '6' : '9'}
              <span className="text-3xl">{isYearly ? '.99' : '.99'}</span>
            </p>
            <p className="text-sm text-[var(--color-dim)] mb-7">
              {isYearly ? t('pricing.billedAnnually') : t('pricing.cancelAnytime')}
            </p>
            <ul className="space-y-3 text-sm text-[var(--color-text-primary)]">
              {(t.raw('pricing.proFeatures') as string[]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 py-2 border-b border-[var(--color-border)] last:border-0">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                try {
                  const { STRIPE_PRICES } = await import('@/lib/stripe/config');
                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ priceId: isYearly ? STRIPE_PRICES.YEARLY : STRIPE_PRICES.MONTHLY }),
                  });
                  if (!res.ok) throw new Error('Failed to create checkout session');
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                } catch {
                  // If unauthorized, redirect to login
                  window.location.href = '/auth/login?returnTo=/settings';
                }
              }}
              className="mt-8 block w-full py-3 text-center bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            >
              {t('pricing.getPro')}
            </button>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-5 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">{t('cta.title')}</h2>
        <p className="text-[var(--color-text-secondary)] text-lg max-w-lg mx-auto mb-10">
          {t('cta.subtitle')}
        </p>
        <Link
          href="/solve"
          className="inline-block px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-bold text-lg rounded-xl transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:-translate-y-0.5"
        >
          {t('cta.btn')}
        </Link>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 px-5 md:px-10 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-extrabold text-lg">
            AXIOM<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="text-sm text-[var(--color-dim)]">{t('footer.copy')}</p>
          <div className="flex gap-6 text-sm text-[var(--color-text-secondary)]">
            <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-[var(--color-text-primary)] transition-colors">{t('footer.terms')}</Link>
            <a href="mailto:support@axiom.study" className="hover:text-[var(--color-text-primary)] transition-colors">{t('footer.contact')}</a>
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
