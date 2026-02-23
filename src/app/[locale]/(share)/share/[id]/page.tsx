import { createClient } from '@supabase/supabase-js';
import { Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/routing';

// Because this is a Next.js Server Component that fetches data, we define it carefully:
export default async function SharedChatPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to resolve Next.js dynamic routing correctly
  const { id } = await params;
  const t = await getTranslations('Dashboard.Share');

  // We must use a separate client (anon) or admin to read, since the user might not be logged in.
  // We'll just construct a basic supabase client for the public table read.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Find the chat by share_id
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('id, title, created_at')
    .eq('share_id', id)
    .eq('is_shared', true)
    .single();

  if (chatError || !chat) {
    return (
      <div className="min-h-screen bg-[var(--color-bg1)] flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-12 h-12 text-[var(--color-ax-blue)] mb-4" />
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">{t('chatNotFound')}</h1>
        <p className="text-[var(--color-text-secondary)]">{t('invalidLink')}</p>
        <Link href="/" className="mt-6 px-6 py-2 bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-full text-sm font-medium hover:text-[var(--color-ax-blue)] transition-colors">
          {t('returnHome', { defaultMessage: 'Return to Axiom' })}
        </Link>
      </div>
    );
  }

  // 2. Fetch the messages
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true });

  const msgs = messages || [];

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] flex flex-col font-sans">
      {/* Read-Only Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg1)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-bg2)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-ax-blue)]/50 transition-colors">
              <Sparkles className="w-4 h-4 text-[var(--color-ax-blue)]" />
            </div>
            <span className="font-bold text-lg tracking-tight select-none">
              AXIOM<span className="text-[var(--color-ax-blue)]">.</span>
            </span>
          </Link>

          <Link
            href="/solve"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-text-primary)] text-[var(--color-bg0)] text-sm font-medium rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-[var(--color-text-secondary)] hover:scale-105 transition-all"
          >
            {t('tryFree', { defaultMessage: 'Try Free' })}
          </Link>
        </div>
      </header>

      {/* Main Content (Chat History) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8 p-6 rounded-2xl bg-[var(--color-ax-blue)]/5 border border-[var(--color-ax-blue)]/10 flex flex-col items-center text-center">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            {t('sharedSolution', { defaultMessage: 'Shared Solution:' })} {chat.title || t('untitledChat', { defaultMessage: 'Untitled Session' })}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('snapshotDesc', { defaultMessage: 'This is a read-only snapshot of a conversation solved by Axiom AI.' })}
          </p>
        </div>

        <div className="space-y-6">
          {msgs.map((message, idx) => (
            <div key={idx} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 md:p-6 ${
                  message.role === 'user'
                    ? 'bg-[var(--color-ax-blue)]/10 border border-[var(--color-ax-blue)]/20 text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg1)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="w-full bg-[var(--color-bg1)] border-t border-[var(--color-border)] py-12 px-6 flex flex-col justify-center items-center text-center mt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-ax-blue)]/10 border border-[var(--color-ax-blue)]/20 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-[var(--color-ax-blue)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t('solvedBy')}</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">{t('stopWaiting', { defaultMessage: 'Stop waiting. Start solving.' })}</h2>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
          {t('joinThousands', { defaultMessage: 'Join thousands of students getting instant, step-by-step solutions to their hardest questions.' })}
        </p>
        <Link
          href="/solve"
          className="px-8 py-3 bg-[var(--color-ax-blue)] text-white font-semibold rounded-full hover:bg-blue-500 hover:scale-105 transition-all outline-none focus:ring-2 focus:ring-[var(--color-ax-blue)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg0)]"
        >
          {t('createFree', { defaultMessage: 'Create your free account' })}
        </Link>
      </footer>
    </div>
  );
}
