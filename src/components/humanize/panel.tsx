'use client';

import { useState } from 'react';
import { ModeSelector } from './mode-selector';
import { Copy, RefreshCw, Sparkles, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { PaywallModal } from '../shared/paywall-modal';
import * as Diff from 'diff';
import { detectAI, type DetectionResult } from '@/lib/ai/detect';
import { useLocale, useTranslations } from 'next-intl';

export function HumanizerPanel() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'academic' | 'casual' | 'pro'>('academic');
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [inputScore, setInputScore] = useState<DetectionResult | null>(null);
  const [outputScore, setOutputScore] = useState<DetectionResult | null>(null);
  const [showSignals, setShowSignals] = useState(false);

  // Word count display
  const MAX_FREE_WORDS = 500;
  const wordCount = input.trim().split(/\s+/).filter(w => w.length > 0).length;
  const locale = useLocale();
  const t = useTranslations('Dashboard.Components');

  const handleHumanize = async () => {
    if (!input) return;

    setLoading(true);
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, mode, locale }),
      });

      if (res.status === 429 || res.status === 402) {
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to humanize');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.text) {
        setOutput(data.text);
        // Run AI detection on both original and humanized text
        setInputScore(detectAI(input));
        setOutputScore(detectAI(data.text));
      }
    } catch (err: any) {
      console.error(err);
      setOutput(`Error: ${err.message || 'Failed to humanize text'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      // Optional: Show toast
    }
  };

  const getDiffRender = () => {
    if (!input || !output) return null;
    if (output.startsWith('Error:')) return output;

    const diffs = Diff.diffWords(input, output);
    return (
      <div className="leading-relaxed whitespace-pre-wrap">
        {diffs.map((part, index) => {
          if (part.removed) return null; // Only show what's in the final output
          if (part.added) {
            return (
              <span key={index} className="bg-green-500/20 text-green-400 rounded-sm px-1 py-0.5 font-medium transition-colors">
                {part.value}
              </span>
            );
          }
          return <span key={index} className="text-[var(--color-text-primary)]">{part.value}</span>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Input Side */}
      <div className="flex flex-col bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl overflow-hidden focus-within:border-[var(--color-ax-blue)] transition-colors">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg2)]">
          <span className="font-semibold text-sm tracking-wide text-[var(--color-text-secondary)] uppercase">{t('input')}</span>
          <span className={`text-xs font-mono ${wordCount > MAX_FREE_WORDS ? 'text-[var(--color-ax-red)] font-bold' : 'text-[var(--color-dim)]'}`}>
            {wordCount} / {MAX_FREE_WORDS} free words
          </span>
        </div>
        <textarea
          className="flex-1 w-full p-6 bg-transparent resize-none outline-none text-[var(--color-text-primary)] placeholder-[var(--color-dim)] leading-relaxed"
          placeholder={t('pasteText')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg2)]">
          <ModeSelector mode={mode} setMode={setMode} />
          <button
            onClick={handleHumanize}
            disabled={loading || !input}
            className="flex items-center gap-2 bg-[var(--color-ax-blue)] hover:bg-blue-400 text-black font-semibold px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Humanizing...' : 'Humanize'}
          </button>
        </div>
      </div>

      {/* Output Side */}
      <div className="flex flex-col bg-[var(--color-bg0)] border border-[var(--color-border2)] rounded-2xl overflow-hidden shadow-inner">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg1)]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-sm tracking-wide text-[var(--color-text-secondary)] uppercase">{t('humanizedResult')}</span>
            {inputScore && outputScore && !output.startsWith('Error:') && (
              <div className="flex items-center gap-2">
                {/* Original score */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-bold ${
                  inputScore.score >= 50
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : inputScore.score >= 25
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                  <ShieldAlert className="w-3 h-3" />
                  <span>Before: {inputScore.score}%</span>
                </div>
                {/* Arrow */}
                <span className="text-[var(--color-dim)] text-xs">→</span>
                {/* Humanized score */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
                  outputScore.score >= 50
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    : outputScore.score >= 25
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>After: {outputScore.score}%</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="text-[var(--color-dim)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:hover:text-[var(--color-dim)]"
            title={t('copyToClipboard')}
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto w-full relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-4">
               {/* Skeleton Loaders */}
               <div className="w-full h-4 bg-[var(--color-bg2)] rounded animate-pulse" />
               <div className="w-5/6 h-4 bg-[var(--color-bg2)] rounded animate-pulse" />
               <div className="w-full h-4 bg-[var(--color-bg2)] rounded animate-pulse" />
               <div className="w-3/4 h-4 bg-[var(--color-bg2)] rounded animate-pulse" />
               <span className="text-[var(--color-dim)] text-sm mt-4 font-mono">{t('applyingImperfections')}</span>
            </div>
          ) : output ? (
            <div className="space-y-4">
              <div className="text-[var(--color-text-primary)]">
                {getDiffRender()}
              </div>

              {/* Signal Breakdown */}
              {outputScore && (
                <div className="border-t border-[var(--color-border)] pt-4">
                  <button
                    onClick={() => setShowSignals(!showSignals)}
                    className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-3"
                  >
                    {showSignals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span className="font-bold uppercase tracking-wider">Detection Signals ({outputScore.signals.length})</span>
                  </button>
                  {showSignals && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {outputScore.signals.map((signal) => {
                        const pct = Math.round(signal.score * 100);
                        const barColor = pct < 25 ? 'bg-green-400' : pct < 50 ? 'bg-yellow-400' : pct < 75 ? 'bg-orange-400' : 'bg-red-400';
                        return (
                          <div key={signal.name} className="bg-[var(--color-bg2)] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">{signal.name}</span>
                              <span className={`text-xs font-mono font-bold ${pct < 25 ? 'text-green-400' : pct < 50 ? 'text-yellow-400' : pct < 75 ? 'text-orange-400' : 'text-red-400'}`}>{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--color-bg0)] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-[var(--color-dim)] mt-1">{signal.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-dim)] text-sm">
              Your humanized text will appear here. Added words will be highlighted.
            </div>
          )}
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="word_limit" />}
    </>
  );
}
