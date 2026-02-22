import { Link } from '@/i18n/routing';
import { LearnChat } from '@/components/learn/chat';
import { useTranslations } from 'next-intl';

export default function LearnPage() {
  const t = useTranslations('Dashboard.Learn');
  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-4 shrink-0">
        <header className="flex flex-col gap-1 md:gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)]">{t('title')}</h1>
          <p className="text-[var(--color-text-secondary)] text-sm md:text-base">
            {t('description')}
          </p>
        </header>

        {/* ── THE NUCLEAR BUTTON ── */}
        <Link
          href="/panic"
          className="group relative shrink-0"
        >
          {/* Outer glow ring — pulses */}
          <div className="absolute -inset-2 rounded-2xl bg-red-500/20 blur-xl group-hover:bg-red-500/30 transition-all duration-500 animate-pulse" />

          {/* Button body */}
          <div className="relative flex items-center gap-2.5 px-5 py-3 bg-gradient-to-b from-red-600 to-red-700 border-2 border-red-500/50 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_50px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] group-hover:from-red-500 group-hover:to-red-600 group-hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
            {/* Indicator light */}
            <div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)] animate-pulse" />
            <span className="text-white font-extrabold text-sm tracking-wide whitespace-nowrap">
              {t('panicBtn')}
            </span>
          </div>

          {/* Bottom glow reflection */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-red-500/20 blur-md rounded-full" />
        </Link>
      </div>

      <div className="flex-1 min-h-0">
        <LearnChat />
      </div>
    </div>
  );
}
