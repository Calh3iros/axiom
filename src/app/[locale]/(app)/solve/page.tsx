'use client';

import { SolveChat } from '@/components/solve/chat';
import { getChats, getChatMessages } from '@/lib/actions/chat';
import { useEffect, useState } from 'react';
import { UIMessage } from 'ai';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SolvePage() {
  const [chats, setChats] = useState<{ id: string; title: string | null; updated_at: string }[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile primarily
  const t = useTranslations('Dashboard.Solve');

  const loadChats = async () => {
    const data = await getChats();
    setChats(data);
  };

  useEffect(() => {
    loadChats();
  }, []);

  const handleSelectChat = async (id: string) => {
    if (selectedChatId === id) return;
    setLoadingHistory(true);
    setSelectedChatId(id);
    const msgs = await getChatMessages(id);
    setInitialMessages(msgs);
    setIsSidebarOpen(false);
    setLoadingHistory(false);
  };

  const startNewChat = () => {
    setSelectedChatId(undefined);
    setInitialMessages([]);
    setIsSidebarOpen(false);
    // Refresh chats to ensure the latest list is shown if we just saved one
    loadChats();
  };

  return (
    <div className="flex h-full gap-6 relative">
      {/* History Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-30 w-72 bg-[var(--color-bg1)] border-l border-[var(--color-border2)] flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 md:border-l-0 md:border-r md:bg-transparent md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-bold text-[var(--color-text-primary)]">{t('chatHistory')}</h2>
        </div>

        <div className="p-4 pb-2">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 justify-center py-2.5 px-4 bg-[var(--color-ax-blue)] text-black rounded-xl font-semibold text-sm hover:bg-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('newSolve')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.length === 0 ? (
            <p className="text-sm text-[var(--color-dim)] text-center mt-4">{t('noRecentChats')}</p>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${
                  selectedChatId === chat.id
                    ? 'bg-[var(--color-bg2)] border border-[var(--color-border2)]'
                    : 'hover:bg-[var(--color-bg2)]/50 border border-transparent'
                }`}
              >
                <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${selectedChatId === chat.id ? 'text-[var(--color-ax-blue)]' : 'text-[var(--color-dim)]'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${selectedChatId === chat.id ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                    {chat.title || t('untitledChat')}
                  </p>
                  <p className="text-[10px] text-[var(--color-dim)] mt-1">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden" />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="flex items-center justify-between shrink-0 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)]">{t('title')}</h1>
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base hidden sm:block">
              {t('description')}
            </p>
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)]"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-[400px] mb-4 relative">
          {loadingHistory ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-ax-blue)]" />
            </div>
          ) : (
            <SolveChat key={selectedChatId || 'new'} chatId={selectedChatId} initialMessages={initialMessages} />
          )}
        </div>
      </div>
    </div>
  );
}
