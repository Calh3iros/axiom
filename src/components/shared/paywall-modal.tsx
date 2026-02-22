'use client';

import { X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Ensure the keys are set securely in production
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_123');

interface PaywallModalProps {
  onClose: () => void;
  reason: 'word_limit' | 'solve_limit';
}

export function PaywallModal({ onClose, reason }: PaywallModalProps) {
  const handleUpgrade = async () => {
    // Basic redirect to checkout logic. We would hit our API first to create a Stripe session
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch(err) {
      console.error(err);
      alert('Error initiating checkout. Please check the logs.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-bg1)] border border-[var(--color-border2)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-dim)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center pt-12">
          <div className="w-16 h-16 bg-[var(--color-ax-yellow)]/10 text-[var(--color-ax-yellow)] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            ✨
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-2">
            {reason === 'word_limit' ? 'Word Limit Reached' : 'Daily Limit Reached'}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            You've hit the anonymous free limit. Upgrade to <span className="text-[var(--color-ax-yellow)] font-bold">Axiom Pro</span> to conquer your classes without restrictions.
          </p>

          <div className="bg-[var(--color-bg2)] rounded-xl p-4 mb-8 text-left border border-[var(--color-border)]">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-3 text-sm tracking-wide">PRO PLAN INCLUDES:</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--color-ax-green)]">✓</span> Unlimited AI Humanizer
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--color-ax-green)]">✓</span> Unlimited Homework Solving
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--color-ax-green)]">✓</span> Essay Writer & Citations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--color-ax-green)]">✓</span> Panic Mode (Exams)
              </li>
            </ul>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full bg-[var(--color-ax-yellow)] hover:bg-yellow-400 text-black font-extrabold h-12 rounded-full transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(251,191,36,0.3)]"
          >
            Upgrade Now - $9.99/mo
          </button>

          <button onClick={onClose} className="mt-4 text-xs font-semibold text-[var(--color-dim)] hover:text-[var(--color-text-secondary)]">
            No thanks, maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
