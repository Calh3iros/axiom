import { HumanizerPanel } from '@/components/humanize/panel';

export default function HumanizePage() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)]">AI Humanizer</h1>
        <p className="text-[var(--color-text-secondary)]">
          Rewrite AI-generated text to sound naturally human. Bypass detectors with a single click.
        </p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[500px]">
        <HumanizerPanel />
      </div>
    </div>
  );
}
