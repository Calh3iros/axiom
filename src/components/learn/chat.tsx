"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Loader2, BookOpen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { MarkdownMessage } from "../shared/markdown-message";

export function LearnChat() {
  const [input, setInput] = useState("");
  const locale = useLocale();
  const t = useTranslations("Dashboard.Learn");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { type: "learn", locale },
    }),
    onError: (err: Error) => console.error("Learn Chat Error:", err.message),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const onSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage({ text: input });
    setInput("");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMessageText = (message: any): string => {
    if (typeof message.content === "string") return message.content;
    if (Array.isArray(message.parts)) {
      return (
        message.parts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((p: any) => p.type === "text")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => p.text)
          .join("")
      );
    }
    return "";
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)]">
      {/* Chat Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
            <div className="mb-4 rounded-2xl bg-[var(--color-bg2)] p-4">
              <BookOpen className="h-8 w-8 text-[var(--color-ax-blue)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {t("whatToLearn")}
            </p>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
              {t("askMeAnythingDesc")}
            </p>
            <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
              {[t("sug1"), t("sug2"), t("sug3"), t("sug4")].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage({ text: suggestion })}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg3)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-ax-blue)]/30 hover:text-[var(--color-ax-blue)]"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "border border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/10 text-[var(--color-text-primary)]"
                    : "border border-[var(--color-border)] bg-[var(--color-bg2)] text-[var(--color-text-primary)]"
                }`}
              >
                <MarkdownMessage content={getMessageText(message)} />
              </div>
            </div>
          ))
        )}

        {/* Loading spinner */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-4">
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t("thinking")}</span>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg2)] p-4">
        <form onSubmit={onSubmitForm} className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? t("thinking") : t("inputPlaceholder")}
            disabled={isLoading}
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg0)] py-3.5 pr-14 pl-5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-dim)] focus:border-[var(--color-ax-blue)] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 rounded-full bg-[var(--color-ax-blue)] p-2 text-black transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="ml-0.5 h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
