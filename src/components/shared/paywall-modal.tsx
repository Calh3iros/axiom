'use client';

import { X, Zap, Crown, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { STRIPE_PRICES } from '@/lib/stripe/config';
import type { PlanType } from '@/lib/usage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaywallModalProps {
  onClose: () => void;
  reason?: 'word_limit' | 'solve_limit' | 'write_limit' | 'learn_limit';
  currentPlan?: PlanType;
}

// ---------------------------------------------------------------------------
// Plan card data
// ---------------------------------------------------------------------------

interface PlanCard {
  key: PlanType;
  name: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  yearlyPrice: number;
  priceMonthly: string;
  priceYearly: string;
  features: string[];
  accent: string;
  accentBg: string;
  accentGlow: string;
  badge?: string;
}

const PLAN_CARDS: PlanCard[] = [
  {
    key: 'free',
    name: 'Free',
    icon: <Zap className="w-5 h-5" />,
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceMonthly: '',
    priceYearly: '',
    features: [
      '3 solves / day',
      '1 essay / day',
      '500 humanize words / day',
      '2 learn sessions / day',
    ],
    accent: 'text-[var(--color-text-secondary)]',
    accentBg: 'bg-[var(--color-bg2)]',
    accentGlow: '',
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: <Sparkles className="w-5 h-5" />,
    monthlyPrice: 19,
    yearlyPrice: 190,
    priceMonthly: STRIPE_PRICES.PRO_MONTHLY,
    priceYearly: STRIPE_PRICES.PRO_YEARLY,
    features: [
      '50 solves / day',
      '20 essays / day',
      '5 000 humanize words / day',
      '20 learn sessions / day',
      '500 solves / month cap',
    ],
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentGlow: 'shadow-[0_0_40px_rgba(52,211,153,0.08)]',
  },
  {
    key: 'elite',
    name: 'Elite',
    icon: <Crown className="w-5 h-5" />,
    monthlyPrice: 49,
    yearlyPrice: 490,
    priceMonthly: STRIPE_PRICES.ELITE_MONTHLY,
    priceYearly: STRIPE_PRICES.ELITE_YEARLY,
    features: [
      'Unlimited solves / day',
      'Unlimited essays / day',
      'Unlimited humanize words',
      'Unlimited learn sessions',
      'Priority support',
    ],
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentGlow: 'shadow-[0_0_40px_rgba(251,191,36,0.10)]',
    badge: 'Best Value',
  },
];

// ---------------------------------------------------------------------------
// Heading map
// ---------------------------------------------------------------------------

const REASON_HEADING: Record<string, string> = {
  word_limit: 'Word Limit Reached',
  solve_limit: 'Daily Limit Reached',
  write_limit: 'Write Limit Reached',
  learn_limit: 'Learn Limit Reached',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaywallModal({
  onClose,
  reason = 'solve_limit',
  currentPlan = 'free',
}: PaywallModalProps) {
  const [isYearly, setIsYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  const handleCheckout = async (priceId: string, plan: PlanType) => {
    try {
      setLoadingPlan(plan);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) throw new Error('Failed to create checkout session');

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Error initiating checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const planRank: Record<PlanType, number> = { free: 0, pro: 1, elite: 2 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-[var(--color-bg1)] border border-[var(--color-border2)] w-full max-w-[820px] rounded-2xl shadow-2xl overflow-hidden relative"
        style={{ animation: 'paywallIn 0.25s ease-out both' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-[var(--color-dim)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
              {REASON_HEADING[reason] || 'Upgrade Your Plan'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Choose the plan that fits your study style
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-1 mb-6 bg-[var(--color-bg0)] p-1 rounded-xl border border-[var(--color-border)] w-fit mx-auto">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                !isYearly
                  ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-dim)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                isYearly
                  ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-dim)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              Yearly
              <span className="text-emerald-400 text-[10px] font-extrabold">
                Save 17%
              </span>
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLAN_CARDS.map((card) => {
              const isCurrent = card.key === currentPlan;
              const isUpgrade = planRank[card.key] > planRank[currentPlan];
              const isDowngrade = planRank[card.key] < planRank[currentPlan];
              const priceId = isYearly ? card.priceYearly : card.priceMonthly;
              const price = isYearly ? card.yearlyPrice : card.monthlyPrice;
              const isHighlighted = card.key === 'elite';
              const loading = loadingPlan === card.key;

              return (
                <div
                  key={card.key}
                  className={`
                    relative rounded-xl border p-5 flex flex-col transition-all duration-200
                    ${isHighlighted
                      ? `border-amber-500/30 bg-[var(--color-bg1)] ${card.accentGlow}`
                      : card.key === 'pro'
                        ? `border-emerald-500/20 bg-[var(--color-bg1)] ${card.accentGlow}`
                        : 'border-[var(--color-border)] bg-[var(--color-bg0)]'
                    }
                  `}
                >
                  {/* Badge */}
                  {card.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[9px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full whitespace-nowrap">
                      {card.badge}
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`${card.accentBg} ${card.accent} p-1.5 rounded-lg`}>
                      {card.icon}
                    </div>
                    <span className={`font-bold text-sm ${card.accent}`}>
                      {card.name}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-[9px] font-bold tracking-wider uppercase bg-[var(--color-bg2)] text-[var(--color-dim)] px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {card.key === 'free' ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-[var(--color-text-primary)]">$0</span>
                        <span className="text-xs text-[var(--color-dim)]">forever</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-[var(--color-text-primary)]">
                          ${isYearly ? Math.round(price / 12) : price}
                        </span>
                        <span className="text-xs text-[var(--color-dim)]">/mo</span>
                        {isYearly && (
                          <span className="text-[10px] text-[var(--color-dim)] ml-1">
                            (${price}/yr)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 text-xs text-[var(--color-text-secondary)] mb-5 flex-1">
                    {card.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={card.key === 'free' ? 'text-[var(--color-dim)]' : card.accent}>✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {card.key === 'free' ? (
                    <button
                      disabled
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-[var(--color-bg2)] text-[var(--color-dim)] border border-[var(--color-border)] cursor-not-allowed"
                    >
                      {isCurrent ? 'Current Plan' : 'Free Plan'}
                    </button>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-[var(--color-bg2)] text-[var(--color-dim)] border border-[var(--color-border)] cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleCheckout(priceId, card.key)}
                      disabled={loading}
                      className={`
                        w-full py-2.5 text-xs font-extrabold rounded-lg transition-all hover:scale-[1.02]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${card.key === 'elite'
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.25)]'
                        }
                      `}
                    >
                      {loading ? 'Loading...' : `Upgrade to ${card.name}`}
                    </button>
                  ) : isDowngrade ? (
                    <button
                      disabled
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-[var(--color-bg2)] text-[var(--color-dim)] border border-[var(--color-border)] cursor-not-allowed opacity-60"
                    >
                      Included in your plan
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="mt-4 block mx-auto text-xs font-semibold text-[var(--color-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            No thanks, maybe later
          </button>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes paywallIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
