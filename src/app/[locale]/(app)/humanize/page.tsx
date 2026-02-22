import { HumanizerPanel } from '@/components/humanize/panel';
import { useTranslations } from 'next-intl';

export default function HumanizePage() {
  const t = useTranslations('Dashboard.Humanize');

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)]">{t('title')}</h1>
        <p className="text-[var(--color-text-secondary)]">
          {t('description')}
        </p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[500px]">
        <HumanizerPanel />
      </div>
    </div>
  );
}
