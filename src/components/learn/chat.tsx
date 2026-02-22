'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Loader2, BookOpen } from 'lucide-react';
import { useState } from 'react';

export function LearnChat() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { type: 'learn' },
    }),
    onError: (err: Error) => console.error('Learn Chat Error:', err.message),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const onSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage({ text: input });
    setInput('');
  };

  const getMessageText = (message: any): string => {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full border border-[var(--color-border2)] rounded-2xl overflow-hidden bg-[var(--color-bg1)]">

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <div className="p-4 rounded-2xl bg-[var(--color-bg2)] mb-4">
              <BookOpen className="w-8 h-8 text-[var(--color-ax-blue)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">What do you want to learn?</p>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mt-2">
              Ask me anything — &quot;Teach me derivatives from scratch&quot;, &quot;Explain photosynthesis&quot;, or &quot;Help me understand recursion&quot;.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-md">
              {[
                'Teach me calculus basics',
                'Explain DNA replication',
                'How does recursion work?',
                'Prep me for my physics exam',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage({ text: suggestion })}
                  className="px-3 py-1.5 text-xs bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-full text-[var(--color-text-secondary)] hover:border-[var(--color-ax-blue)]/30 hover:text-[var(--color-ax-blue)] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-[var(--color-ax-blue)]/10 border border-[var(--color-ax-blue)]/20 text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg2)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {getMessageText(message)}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading spinner */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl p-4 bg-[var(--color-bg2)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg2)]">
        <form onSubmit={onSubmitForm} className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Thinking..." : 'Ask me anything... "Teach me about..."'}
            disabled={isLoading}
            className="w-full bg-[var(--color-bg0)] border border-[var(--color-border)] rounded-full py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:border-[var(--color-ax-blue)] text-[var(--color-text-primary)] placeholder-[var(--color-dim)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-[var(--color-ax-blue)] text-black rounded-full hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
