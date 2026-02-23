'use client';

import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * Subtle "Powered by Axiom" watermark shown only to free-tier users.
 * Placed at the bottom of AI output panels (solve, write, humanize).
 * Paid users never see this.
 */
export function Watermark() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Anonymous → always show
          if (!cancelled) setShow(true);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single() as { data: { plan: string } | null };

        const plan = (profile as { plan?: string } | null)?.plan ?? 'free';
        if (!cancelled && (plan === 'free' || !plan)) {
          setShow(true);
        }
      } catch {
        // On error, don't show watermark
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-[var(--color-dim)] select-none opacity-60">
      <span>Powered by</span>
      <span className="font-bold tracking-tight">AXIOM</span>
      <span className="text-[var(--color-dim)]">·</span>
      <a
        href="/settings"
        className="inline-flex items-center gap-1 text-amber-500/70 hover:text-amber-400 transition-colors"
      >
        <Crown className="w-3 h-3" />
        <span className="font-semibold">Remove watermark</span>
      </a>
    </div>
  );
}
