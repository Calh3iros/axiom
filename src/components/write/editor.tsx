'use client';

import { useState, useCallback } from 'react';
import {
  FileText, Expand, Quote, Wand2, CheckCircle, Loader2, Copy, Trash2, BookMarked
} from 'lucide-react';
import { useLocale } from 'next-intl';

type WriteAction = 'outline' | 'expand' | 'cite' | 'humanize' | 'conclude';

const actions: { key: WriteAction; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'outline', label: 'Outline', icon: FileText, description: 'Generate essay structure' },
  { key: 'expand', label: 'Expand', icon: Expand, description: 'Develop paragraphs' },
  { key: 'cite', label: 'Cite', icon: Quote, description: 'Add APA citations' },
  { key: 'humanize', label: 'Humanize', icon: Wand2, description: 'Sound more natural' },
  { key: 'conclude', label: 'Conclude', icon: CheckCircle, description: 'Write conclusion' },
];

export function WriteEditor() {
  const [content, setContent] = useState('');
  const [output, setOutput] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<WriteAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'citations'>('output');
  const locale = useLocale();

  const handleAction = useCallback(async (action: WriteAction) => {
    if (!content.trim() || loading) return;

    setActiveAction(action);
    setLoading(true);

    if (action === 'cite') {
      setActiveTab('citations');
    } else {
      setActiveTab('output');
      setOutput('');
    }

    try {
      const res = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content, context: content, locale }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let result = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });

          if (action === 'cite') {
            // We'll just show the streaming result as the 'newest citation' temporarily
            // but we really want to append it to the citations list when exactly done.
            // For now, let's just keep it in output, then on finish, move it.
            setOutput(result);
          } else {
            setOutput(result);
          }
        }

        if (action === 'cite') {
          setCitations(prev => [...prev, result]);
          setOutput(''); // clear output since it's now in citations
        }
      }
    } catch (err: any) {
      console.error('Write Error:', err);
      if (action !== 'cite') {
        setOutput(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }, [content, loading]);

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  const handleUseOutput = () => {
    setContent((prev) => prev + '\n\n' + output);
    setOutput('');
  };

  const handleUseCitation = (cit: string) => {
    setContent((prev) => prev + '\n' + cit);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* AI Toolbar */}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.key;
          return (
            <button
              key={action.key}
              onClick={() => handleAction(action.key)}
              disabled={loading || !content.trim()}
              title={action.description}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                border
                ${isActive
                  ? 'bg-[var(--color-ax-blue)]/15 border-[var(--color-ax-blue)]/30 text-[var(--color-ax-blue)]'
                  : 'bg-[var(--color-bg2)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg3)] hover:text-[var(--color-text-primary)]'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Editor Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[400px]">
        {/* Input Editor */}
        <div className="flex flex-col bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider uppercase">Your Text</span>
            <button
              onClick={() => setContent('')}
              className="text-[var(--color-dim)] hover:text-red-400 transition-colors p-1"
              title="Clear"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your essay topic, paragraph, or text here..."
            className="flex-1 p-4 bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-dim)] resize-none focus:outline-none text-sm leading-relaxed"
          />
          <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-dim)]">
            {content.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Output & Citations Panel */}
        <div className="flex flex-col bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl overflow-hidden">
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg2)]">
            <button
              onClick={() => setActiveTab('output')}
              className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-colors border-b-2 ${
                activeTab === 'output'
                  ? 'border-[var(--color-ax-blue)] text-[var(--color-ax-blue)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              AI Output
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-colors border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'citations'
                  ? 'border-[var(--color-ax-blue)] text-[var(--color-ax-blue)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              Citations ({citations.length})
            </button>
          </div>

          <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between min-h-[48px]">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider uppercase">
              {loading && activeTab === 'output' ? 'Generating...' : ''}
              {loading && activeTab === 'citations' ? 'Finding Sources...' : ''}
            </span>
            {activeTab === 'output' && output && (
              <div className="flex gap-1">
                <button
                  onClick={handleCopyOutput}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-ax-blue)] transition-colors p-1.5 rounded hover:bg-[var(--color-bg3)]"
                  title="Copy output"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleUseOutput}
                  className="px-3 py-1 text-xs font-medium bg-[var(--color-ax-blue)]/10 text-[var(--color-ax-blue)] border border-[var(--color-ax-blue)]/20 rounded-lg hover:bg-[var(--color-ax-blue)]/20 transition-colors"
                >
                  Use ↓
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'output' && (
              output ? (
                <div className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                  {output}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--color-dim)] text-sm text-center">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--color-ax-blue)]" />
                      <span>Writing...</span>
                    </div>
                  ) : (
                    <p>Select an action from the toolbar to generate content.</p>
                  )}
                </div>
              )
            )}

            {activeTab === 'citations' && (
              <div className="space-y-4">
                {/* Streaming Citation */}
                {loading && activeAction === 'cite' && output && (
                  <div className="p-4 bg-[var(--color-ax-blue)]/5 border border-[var(--color-ax-blue)]/20 rounded-xl relative opacity-70">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-ax-blue)] absolute top-4 right-4" />
                    <p className="text-sm leading-relaxed pr-8 whitespace-pre-wrap">{output}</p>
                  </div>
                )}

                {/* Saved Citations */}
                {citations.length === 0 && !loading && (
                   <div className="h-full flex flex-col items-center justify-center text-[var(--color-dim)] text-sm text-center mt-12 opacity-60">
                     <BookMarked className="w-8 h-8 mb-3" />
                     <p>No citations yet.</p>
                     <p className="max-w-[200px] mt-1">Select text and click "Cite" to generate sources.</p>
                   </div>
                )}

                {citations.map((cit, idx) => (
                  <div key={idx} className="p-4 bg-[var(--color-bg0)] border border-[var(--color-border)] rounded-xl relative group hover:border-[var(--color-border2)] transition-colors">
                    <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{cit}</p>
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                         onClick={() => navigator.clipboard.writeText(cit)}
                         className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                         title="Copy"
                       >
                         <Copy className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => handleUseCitation(cit)}
                         className="px-3 py-1 text-xs font-medium bg-[var(--color-bg2)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg3)] transition-colors"
                       >
                         Insert
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
