'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { AlertTriangle, Loader2, BookOpen, HelpCircle, Lightbulb, Clock, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

type PanicResult = {
  summary: string;
  questions: { question: string; answer: string }[];
  flashcards: { front: string; back: string }[];
  study_plan: string;
};

export default function PanicModePage() {
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const t = useTranslations('Dashboard.Panic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PanicResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'questions' | 'flashcards' | 'plan'>('summary');
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const handlePanicMode = async () => {
    if (!subject.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/learn/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, chapter }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setResult(data);
      setActiveTab('summary');
      setFlippedCards(new Set());
    } catch (err: any) {
      console.error('Panic Mode Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlashcard = (i: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const tabs = [
    { key: 'summary' as const, label: t('tabSummary'), icon: BookOpen, desc: '1-page key concepts' },
    { key: 'questions' as const, label: t('tabQA'), icon: HelpCircle, desc: '10 likely questions' },
    { key: 'flashcards' as const, label: t('tabFlashcards'), icon: Lightbulb, desc: 'Quick memorization' },
    { key: 'plan' as const, label: t('tabPlan'), icon: Clock, desc: '2-hour guided plan' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] text-[var(--color-text-primary)]">
      {/* Header with dramatic styling */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(239,68,68,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-6">
          {/* Back link */}
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backBtn')}
          </Link>

          {/* Title area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/8 border border-red-500/20 rounded-full mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-red-400 text-xs font-bold tracking-wider uppercase">{t('emergencyActive', { defaultMessage: 'EMERGENCY MODE ACTIVE' })}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              🚨 {t('title')}
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-lg mx-auto">
              {t('description')}
            </p>
          </div>

          {/* Input area — dramatic card */}
          <div className="bg-[var(--color-bg1)] border border-red-500/15 rounded-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.05)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('subjectPlaceholder')}
                className="bg-[var(--color-bg0)] border border-[var(--color-border)] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-400/50 text-[var(--color-text-primary)] placeholder-[var(--color-dim)]"
              />
              <input
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder={t('chapterPlaceholder')}
                className="bg-[var(--color-bg0)] border border-[var(--color-border)] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-400/50 text-[var(--color-text-primary)] placeholder-[var(--color-dim)]"
              />
            </div>

            <button
              onClick={handlePanicMode}
              disabled={!subject.trim() || loading}
              className="group relative w-full overflow-hidden"
            >
              {/* Button glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl" />

              <div className="relative flex items-center justify-center gap-3 py-4 text-white font-extrabold text-base tracking-wide disabled:opacity-40">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('generating')}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <span>{t('activateBtn')}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          {/* Tab cards — horizontal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                      : 'bg-[var(--color-bg1)] border-[var(--color-border)] hover:border-[var(--color-border2)]'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-red-400' : 'text-[var(--color-dim)]'}`} />
                  <p className={`text-sm font-bold ${isActive ? 'text-red-400' : 'text-[var(--color-text-primary)]'}`}>{tab.label}</p>
                  <p className="text-xs text-[var(--color-dim)] mt-0.5">{tab.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="bg-[var(--color-bg1)] border border-[var(--color-border)] rounded-2xl p-6 min-h-[400px]">
            {activeTab === 'summary' && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-red-400" /> Key Concepts Summary
                </h3>
                <div className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-red-400" /> Most Likely Exam Questions
                </h3>
                <div className="space-y-4">
                  {result.questions.map((q, i) => (
                    <div key={i} className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-xl p-4">
                      <p className="text-sm font-bold text-[var(--color-text-primary)] mb-2">
                        <span className="text-red-400 font-mono mr-2">Q{i + 1}.</span>
                        {q.question}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pl-8">
                        {q.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-red-400" /> Quick Memorization Cards
                </h3>
                <p className="text-xs text-[var(--color-dim)] mb-4">{t('clickToFlip', { defaultMessage: 'Click a card to flip it' })}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.flashcards.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => toggleFlashcard(i)}
                      className={`bg-[var(--color-bg2)] border rounded-xl p-5 text-left transition-all min-h-[120px] flex items-center justify-center ${
                        flippedCards.has(i)
                          ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.08)]'
                          : 'border-[var(--color-border)] hover:border-red-400/20'
                      }`}
                    >
                      <p className="text-sm text-center leading-relaxed">
                        {flippedCards.has(i) ? (
                          <span className="text-red-400">{card.back}</span>
                        ) : (
                          <span className="text-[var(--color-text-primary)] font-medium">{card.front}</span>
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-400" /> 2-Hour Study Plan
                </h3>
                <div className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                  {result.study_plan}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
