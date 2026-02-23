import { useTranslations } from 'next-intl';

import { WriteEditor } from '@/components/write/editor';

export default function WritePage() {
  const t = useTranslations('Dashboard.Write');

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
      <header className="flex flex-col gap-1 md:gap-2 shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)]">{t('title')}</h1>
        <p className="text-[var(--color-text-secondary)] text-sm md:text-base">
          {t('description')}
        </p>
      </header>

      <div className="flex-1 min-h-[500px]">
        <WriteEditor />
      </div>
    </div>
  );
}
