'use client';

interface ModeSelectorProps {
  mode: 'academic' | 'casual' | 'pro';
  setMode: (mode: 'academic' | 'casual' | 'pro') => void;
}

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  const modes = [
    { value: 'academic', label: 'Academic' },
    { value: 'casual', label: 'Casual' },
    { value: 'pro', label: 'Professional' },
  ] as const;

  return (
    <div className="flex bg-[var(--color-bg1)] p-1 rounded-full border border-[var(--color-border)] shadow-sm">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
            mode === m.value
              ? 'bg-[var(--color-ax-blue)] text-black shadow-md'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg3)]'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
