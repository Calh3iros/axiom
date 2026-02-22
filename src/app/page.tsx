'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] text-[var(--color-text-primary)]">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-6 md:px-10 flex items-center justify-between bg-[var(--color-bg0)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          AXIOM<span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--color-text-secondary)]">
          <a href="#features" className="hover:text-[var(--color-text-primary)] transition-colors">Features</a>
          <a href="#compare" className="hover:text-[var(--color-text-primary)] transition-colors">Compare</a>
          <a href="#pricing" className="hover:text-[var(--color-text-primary)] transition-colors">Pricing</a>
        </div>
        <Link
          href="/solve"
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-semibold text-sm rounded-lg transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]"
        >
          Try Free →
        </Link>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(52,211,153,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(96,165,250,0.04)_0%,transparent_70%)] pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/15 rounded-full text-emerald-400 text-sm font-medium mb-8 animate-[fadeUp_0.8s_ease_both]">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Your AI study companion is here
        </div>

        {/* Title */}
        <h1 className="text-[clamp(40px,7vw,80px)] font-extrabold leading-[1.05] tracking-tight max-w-3xl mb-6 animate-[fadeUp_0.8s_0.1s_ease_both]">
          Solve anything in{' '}
          <span className="text-emerald-400 relative">
            5 seconds
            <span className="absolute bottom-1 left-0 right-0 h-[3px] bg-emerald-400/40 rounded" />
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-xl mb-12 leading-relaxed animate-[fadeUp_0.8s_0.2s_ease_both]">
          Snap a photo of any homework question. Get step-by-step solutions instantly.
          Write essays. Humanize AI text. Study for exams. <strong className="text-[var(--color-text-primary)]">All for $9.99/month.</strong>
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 animate-[fadeUp_0.8s_0.3s_ease_both]">
          <Link
            href="/solve"
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-bold text-base rounded-xl transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:-translate-y-0.5"
          >
            📸 Try Free — No signup needed
          </Link>
          <a
            href="#pricing"
            className="px-8 py-4 bg-[var(--color-bg2)] border border-[var(--color-border2)] text-[var(--color-text-secondary)] font-semibold text-base rounded-xl transition-all hover:border-[var(--color-text-secondary)]/30 hover:-translate-y-0.5"
          >
            See Pricing
          </a>
        </div>

        {/* Proof */}
        <p className="mt-10 text-sm text-[var(--color-dim)] animate-[fadeUp_0.8s_0.5s_ease_both]">
          ✨ Free tier — <strong className="text-[var(--color-text-secondary)]">no credit card</strong>, no signup. Start solving instantly.
        </p>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-5 md:px-10">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[3px] uppercase text-emerald-400 mb-4 font-mono">4 SUPERPOWERS</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Everything a student needs</h2>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-lg mx-auto">Homework solver, essay writer, text humanizer, and exam tutor — all in one app.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {/* Solve */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl mb-5">📸</div>
            <h3 className="text-2xl font-bold mb-3">Solve</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">Photo or text → step-by-step solution in 5 seconds. Ask follow-ups, get alternative methods, generate practice questions.</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-emerald-500/8 text-emerald-400 rounded-md">INSTANT ANSWERS</span>
          </div>

          {/* Write */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-blue-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl mb-5">✍️</div>
            <h3 className="text-2xl font-bold mb-3">Write</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">Outline → draft → citations → polish. AI-powered essay writer with APA citations and academic tone built in.</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-blue-500/8 text-blue-400 rounded-md">FULL ESSAYS</span>
          </div>

          {/* Humanize */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-orange-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl mb-5">🔄</div>
            <h3 className="text-2xl font-bold mb-3">Humanize</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">Paste any AI-generated text → get natural, human-sounding output. Three modes: Academic, Casual, Professional.</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-orange-500/8 text-orange-400 rounded-md">UNDETECTABLE</span>
          </div>

          {/* Learn */}
          <div className="group bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-purple-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-13 h-13 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl mb-5">🧠</div>
            <h3 className="text-2xl font-bold mb-3">Learn</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">Panic Mode: enter subject → get a 1-page summary, 10 exam questions, flashcards, and a 2-hour study plan. Instantly.</p>
            <span className="inline-block mt-4 px-3 py-1 text-xs font-mono font-medium bg-purple-500/8 text-purple-400 rounded-md">🚨 PANIC MODE</span>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section id="compare" className="py-24 px-5 md:px-10 flex flex-col items-center">
        <p className="text-xs font-bold tracking-[3px] uppercase text-emerald-400 mb-4 font-mono">WHY AXIOM</p>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center mb-4">The old way vs. the Axiom way</h2>
        <p className="text-[var(--color-text-secondary)] text-lg text-center max-w-xl mb-12">Students deserve instant, interactive help. Not static answers behind a paywall.</p>

        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-[1fr_50px_1fr] md:grid-cols-[1fr_80px_1fr] text-sm">
            {/* Header */}
            <div className="p-4 text-center font-mono text-xs font-bold tracking-wider uppercase text-red-400 border-b border-[var(--color-border)]">OLD WAY</div>
            <div className="p-4 text-center font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-dim)] border-b border-[var(--color-border)]">VS</div>
            <div className="p-4 text-center font-mono text-xs font-bold tracking-wider uppercase text-emerald-400 border-b border-[var(--color-border)]">AXIOM</div>

            {/* Rows */}
            {[
              ['Wait 30min-2h for answers', '⏱', 'Answer in 5 seconds'],
              ['Static text, no follow-ups', '💬', 'Interactive chat with follow-ups'],
              ['$20+/month for basic access', '💰', '$9.99/month — everything included'],
              ['Can\'t explain differently', '🔄', '"Explain like I\'m 12" works'],
              ['No practice questions', '📝', 'Generate unlimited exercises'],
              ['Outdated, human-dependent', '⚡', 'Built on cutting-edge AI'],
            ].map(([old, icon, newText], i) => (
              <div key={i} className="contents">
                <div className="p-4 flex items-center justify-end text-right text-[var(--color-dim)] line-through decoration-red-400/30 border-b border-[var(--color-border)]">{old}</div>
                <div className="p-4 flex items-center justify-center text-[var(--color-dim)] font-mono text-xs border-b border-[var(--color-border)]">{icon}</div>
                <div className="p-4 flex items-center text-[var(--color-text-primary)] font-medium border-b border-[var(--color-border)]">{newText}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 px-5 md:px-10">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[3px] uppercase text-emerald-400 mb-4 font-mono">PRICING</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Less than 2 coffees a month</h2>
          <p className="text-[var(--color-text-secondary)] text-lg">Premium AI study tools. No limits. No waiting.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-5 max-w-3xl mx-auto">
          {/* Free */}
          <div className="flex-1 bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-8">
            <p className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-dim)] mb-4">FREE</p>
            <p className="text-5xl font-extrabold mb-1"><span className="text-2xl text-[var(--color-text-secondary)] align-top">$</span>0</p>
            <p className="text-sm text-[var(--color-dim)] mb-7">forever, no signup</p>
            <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              {['5 questions solved per day', '500 words humanized per day', '3 essay actions per day', '2 Panic Mode generations per day'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 py-2 border-b border-[var(--color-border)] last:border-0">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/solve"
              className="mt-8 block w-full py-3 text-center bg-[var(--color-bg3)] border border-[var(--color-border2)] text-[var(--color-text-secondary)] font-semibold rounded-xl hover:bg-[var(--color-bg2)] transition-colors"
            >
              Start Free
            </Link>
          </div>

          {/* Pro */}
          <div className="flex-1 bg-[var(--color-bg1)] border border-emerald-500/30 rounded-2xl p-8 relative shadow-[0_0_60px_rgba(52,211,153,0.08)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-[var(--color-bg0)] font-mono text-[10px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full whitespace-nowrap">
              MOST POPULAR
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-dim)]">PRO</p>
              <div className="flex items-center gap-2 bg-[var(--color-bg0)] p-1 rounded-lg border border-[var(--color-border)]">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!isYearly ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-dim)]'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${isYearly ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-dim)]'}`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <p className="text-5xl font-extrabold mb-1">
              <span className="text-2xl text-[var(--color-text-secondary)] align-top">$</span>
              {isYearly ? '6' : '9'}
              <span className="text-3xl">{isYearly ? '.99' : '.99'}</span>
            </p>
            <p className="text-sm text-[var(--color-dim)] mb-7">
              {isYearly ? 'per month, billed annually' : 'per month, cancel anytime'}
            </p>
            <ul className="space-y-3 text-sm text-[var(--color-text-primary)]">
              {['Unlimited solves — any subject', 'Unlimited essay writing', 'Unlimited humanizer', 'Unlimited Panic Mode', 'Saved history & progress', 'Priority AI (fastest model)'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 py-2 border-b border-[var(--color-border)] last:border-0">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                try {
                  const { STRIPE_PRICES } = await import('@/lib/stripe/config');
                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ priceId: isYearly ? STRIPE_PRICES.YEARLY : STRIPE_PRICES.MONTHLY }),
                  });
                  if (!res.ok) throw new Error('Failed to create checkout session');
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                } catch (err) {
                  // If unauthorized, redirect to login
                  window.location.href = '/auth/login?returnTo=/settings';
                }
              }}
              className="mt-8 block w-full py-3 text-center bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            >
              Get Pro →
            </button>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-5 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Stop waiting. Start solving.</h2>
        <p className="text-[var(--color-text-secondary)] text-lg max-w-lg mx-auto mb-10">
          Your next homework is due in hours. Axiom solves it in seconds. Free. No signup.
        </p>
        <Link
          href="/solve"
          className="inline-block px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-[var(--color-bg0)] font-bold text-lg rounded-xl transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:-translate-y-0.5"
        >
          📸 Solve your first question — free
        </Link>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 px-5 md:px-10 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-extrabold text-lg">
            AXIOM<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="text-sm text-[var(--color-dim)]">© 2026 Axiom. Study smarter.</p>
          <div className="flex gap-6 text-sm text-[var(--color-text-secondary)]">
            <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--color-text-primary)] transition-colors">Terms</Link>
            <a href="mailto:support@axiom.study" className="hover:text-[var(--color-text-primary)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
