"use client";

import { UIMessage } from "ai";
import { Loader2, MessageSquare, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { SolveChat } from "@/components/solve/chat";
import { getChats, getChatMessages, deleteChat } from "@/lib/actions/chat";

export default function SolvePage() {
  const [chats, setChats] = useState<
    { id: string; title: string | null; updated_at: string }[]
  >([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(
    undefined
  );
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile primarily
  const t = useTranslations("Dashboard.Solve");

  const loadChats = async () => {
    const data = await getChats();
    setChats(data);
  };

  // Initial chat loading - standard data-fetching pattern

  useEffect(() => {
    getChats().then(setChats);
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
    loadChats();
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    // Instant delete — no confirmation
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(undefined);
      setInitialMessages([]);
    }
    await deleteChat(chatId);
  };

  return (
    <div className="relative flex h-full gap-6">
      {/* History Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-30 flex w-72 transform flex-col border-l border-[var(--color-border2)] bg-[var(--color-bg1)] transition-transform duration-300 md:relative md:z-auto md:w-64 md:translate-x-0 md:border-r md:border-l-0 md:bg-transparent ${isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} `}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="font-bold text-[var(--color-text-primary)]">
            {t("chatHistory")}
          </h2>
        </div>

        <div className="p-4 pb-2">
          <button
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ax-blue)] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-orange-400"
          >
            <Plus className="h-4 w-4" /> {t("newSolve")}
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {chats.length === 0 ? (
            <p className="mt-4 text-center text-sm text-[var(--color-dim)]">
              {t("noRecentChats")}
            </p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                  selectedChatId === chat.id
                    ? "border border-[var(--color-border2)] bg-[var(--color-bg2)]"
                    : "border border-transparent hover:bg-[var(--color-bg2)]/50"
                }`}
              >
                <MessageSquare
                  className={`mt-0.5 h-4 w-4 shrink-0 ${selectedChatId === chat.id ? "text-[var(--color-ax-blue)]" : "text-[var(--color-dim)]"}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${selectedChatId === chat.id ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}
                  >
                    {chat.title || t("untitledChat")}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--color-dim)]">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="shrink-0 rounded-md p-1 text-[var(--color-dim)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                  title="Delete"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}

      {/* Main Chat Area */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="mb-4 flex shrink-0 items-center justify-between md:mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] md:text-3xl">
              {t("title")}
            </h1>
            <p className="hidden text-sm text-[var(--color-text-secondary)] sm:block md:text-base">
              {t("description")}
            </p>
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] p-2 text-[var(--color-text-secondary)] md:hidden"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </header>

        <div className="relative mb-4 min-h-[400px] flex-1">
          {loadingHistory ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-ax-blue)]" />
            </div>
          ) : (
            <SolveChat
              key={selectedChatId || "new"}
              chatId={selectedChatId}
              initialMessages={initialMessages}
            />
          )}
        </div>
      </div>
    </div>
  );
}
