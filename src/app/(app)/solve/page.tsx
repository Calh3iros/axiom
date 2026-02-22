import { SolveChat } from '@/components/solve/chat';

export default function SolvePage() {
  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
      <header className="flex flex-col gap-1 md:gap-2 shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)]">Homework Solver</h1>
        <p className="text-[var(--color-text-secondary)] text-sm md:text-base">
          Snap a photo or type your question. I'll solve it step-by-step instantly.
        </p>
      </header>

      <div className="flex-1 min-h-[400px] mb-4">
        <SolveChat />
      </div>
    </div>
  );
}
