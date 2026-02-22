'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations('Language');

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    startTransition(() => {
      router.replace({ pathname }, { locale: nextLocale });
    });
  };

  const currentLocale = (params.locale as string) || 'en';

  return (
    <div className="relative flex items-center group">
      <Globe className="w-4 h-4 text-[var(--color-dim)] group-hover:text-[var(--color-text-primary)] transition-colors absolute left-2 pointer-events-none" />
      <select
        value={currentLocale}
        onChange={handleLocaleChange}
        disabled={isPending}
        className="appearance-none bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs md:text-sm rounded-lg pl-8 pr-6 py-1.5 focus:outline-none focus:border-[var(--color-ax-blue)] hover:border-[var(--color-text-secondary)]/30 transition-all cursor-pointer disabled:opacity-50"
      >
        <option value="en">{t('en', { defaultMessage: 'English' })}</option>
        <option value="pt">{t('pt', { defaultMessage: 'Português' })}</option>
        <option value="es">{t('es', { defaultMessage: 'Español' })}</option>
        <option value="fr">{t('fr', { defaultMessage: 'Français' })}</option>
        <option value="de">{t('de', { defaultMessage: 'Deutsch' })}</option>
        <option value="zh">{t('zh', { defaultMessage: '中文' })}</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--color-dim)]">
        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}
