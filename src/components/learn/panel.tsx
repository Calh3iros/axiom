'use client';

import { AlertTriangle, BookOpen, Loader2, HelpCircle, Lightbulb, Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

type PanicResult = {
  summary: string;
  questions: { question: string; answer: string }[];
  flashcards: { front: string; back: string }[];
  study_plan: string;
};

export function LearnPanel() {
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PanicResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'questions' | 'flashcards' | 'plan'>('summary');
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const locale = useLocale();
  const t = useTranslations('Dashboard.Panic');

  const handlePanicMode = async () => {
    if (!subject.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/learn/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, chapter, locale }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }

      const data = await res.json();
      setResult(data);
      setActiveTab('summary');
      setFlippedCards(new Set());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Panic Mode Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlashcard = (index: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const tabs = [
    { key: 'summary' as const, label: t('tabSummary'), icon: BookOpen },
    { key: 'questions' as const, label: t('tabQA'), icon: HelpCircle },
    { key: 'flashcards' as const, label: t('tabFlashcards'), icon: Lightbulb },
    { key: 'plan' as const, label: t('tabPlan'), icon: Clock },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Panic Mode Input */}
      <div className="bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t('title')}</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('description')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('subjectPlaceholder')}
            className="bg-[var(--color-bg0)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ax-blue)] text-[var(--color-text-primary)] placeholder-[var(--color-dim)]"
          />
          <input
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder={t('chapterPlaceholder')}
            className="bg-[var(--color-bg0)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ax-blue)] text-[var(--color-text-primary)] placeholder-[var(--color-dim)]"
          />
        </div>

        <button
          onClick={handlePanicMode}
          disabled={!subject.trim() || loading}
          className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-bold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('generating')}
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              {t('activateBtn')}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="flex-1 bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl overflow-hidden flex flex-col">
          {/* Tab Bar */}
          <div className="flex border-b border-[var(--color-border)] overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === tab.key
                      ? 'border-[var(--color-ax-blue)] text-[var(--color-ax-blue)]'
                      : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'summary' && (
              <div className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                {result.summary}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                {result.questions.map((q, i) => (
                  <div key={i} className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-xl p-4">
                    <p className="text-sm font-bold text-[var(--color-text-primary)] mb-2">
                      <span className="text-[var(--color-ax-blue)] mr-2">Q{i + 1}.</span>
                      {q.question}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pl-6">
                      {q.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="md:col-span-2 text-center mb-2">
                  <span className="text-xs font-medium text-[var(--color-dim)] bg-[var(--color-bg2)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                    👉 {t('clickToFlip', { defaultMessage: 'Click a card to flip it' })}
                  </span>
                </div>
                {result.flashcards.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => toggleFlashcard(i)}
                    className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-xl p-5 text-left transition-all hover:border-[var(--color-ax-blue)]/30 min-h-[120px] flex items-center justify-center"
                  >
                    <p className="text-sm text-center leading-relaxed">
                      {flippedCards.has(i) ? (
                        <span className="text-[var(--color-ax-blue)]">{card.back}</span>
                      ) : (
                        <span className="text-[var(--color-text-primary)] font-medium">{card.front}</span>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                {result.study_plan}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
