import { WriteEditor } from '@/components/write/editor';

export default function WritePage() {
  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
      <header className="flex flex-col gap-1 md:gap-2 shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)]">Essay Writer</h1>
        <p className="text-[var(--color-text-secondary)] text-sm md:text-base">
          AI-powered writing assistant. Generate outlines, expand ideas, add citations, and more.
        </p>
      </header>

      <div className="flex-1 min-h-[500px]">
        <WriteEditor />
      </div>
    </div>
  );
}
