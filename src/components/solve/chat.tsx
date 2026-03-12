"use client";

import { useChat } from "@ai-sdk/react";
import { UIMessage, DefaultChatTransport } from "ai";
import {
  Camera,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Share2,
  Download,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { exportAsPDF, exportAsDOCX } from "@/lib/export-utils";

import { Watermark } from "../shared/watermark";

interface SolveChatProps {
  chatId?: string;
  initialMessages?: UIMessage[];
}

export function SolveChat({
  chatId: initialChatId,
  initialMessages = [],
}: SolveChatProps) {
  const [input, setInput] = useState("");
  const [localAttachment, setLocalAttachment] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(
    initialChatId
  );
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const t = useTranslations("Dashboard.Components");

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: activeChatId
        ? { type: "solve", chatId: activeChatId, locale }
        : { type: "solve", locale },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch: async (url: any, options: any) => {
        const res = await fetch(url, options);
        const id = res.headers.get("x-chat-id");
        if (id && !activeChatId) {
          setActiveChatId(id);
          window.history.replaceState({}, "", `/solve/${id}`);
        }
        return res;
      },
    }),
    onError: (err: Error) => console.error("Chat API Error:", err.message),
    onFinish: () => {
      // Micro-rewards!
      const rewards = [
        "🧠 +1 Brain Power!",
        "✅ Nailed it!",
        "🔥 You're on fire!",
        "👏 Great question!",
        "🚀 Concept unlocked!",
      ];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      toast.success(randomReward, { duration: 3000 });
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Camera/file capture — resize to 1024px max for token economy
  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    const maxDim = 1024;
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

    setLocalAttachment(canvas.toDataURL("image/jpeg", 0.85));
  };

  const onSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && !localAttachment) || isLoading) return;

    const files: {
      type: "file";
      mediaType: string;
      filename: string;
      url: string;
    }[] = [];

    if (localAttachment) {
      files.push({
        type: "file",
        mediaType: "image/jpeg",
        filename: "question.jpg",
        url: localAttachment,
      });
    }

    await sendMessage({
      text: input || "What is this? Please solve it step by step.",
      files: files.length > 0 ? files : undefined,
    });

    setInput("");
    setLocalAttachment(null);
  };

  // Helper to extract text from UIMessage parts
  {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  }
  const getMessageText = (message: any): string => {
    if (message.content) return message.content;
    if (message.parts) {
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

  const shareChat = async () => {
    if (!activeChatId) return;
    setIsSharing(true);
    try {
      const res = await fetch("/api/chat/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeChatId }),
      });
      const data = await res.json();
      if (data.shareId) {
        const url = `${window.location.origin}/share/${data.shareId}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url);
        // Temporarily use copiedId state for the Share button feedback too
        setCopiedId("share_success");
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error("Failed to share", err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] shadow-inner">
      {/* Messages Area */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg2)]">
              <Sparkles className="h-8 w-8 text-[var(--color-ax-blue)]" />
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                {t("howCanIHelp")}
              </h2>
              <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
                Paste your homework question or take a clear photo of the
                assignment to get an instant step-by-step solution.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, msgIdx) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "border border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/10 text-[var(--color-text-primary)]"
                    : "border border-[var(--color-border)] bg-[var(--color-bg2)] text-[var(--color-text-primary)]"
                }`}
              >
                {/* Render message parts (text + files) */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(message as any).parts?.map((part: any, i: number) => {
                  if (part.type === "text" && part.text) {
                    return (
                      <div
                        key={i}
                        className="leading-relaxed whitespace-pre-wrap"
                      >
                        {part.text}
                      </div>
                    );
                  }
                  if (
                    part.type === "file" &&
                    part.mediaType?.startsWith("image/")
                  ) {
                    return (
                      <img
                        key={i}
                        src={part.url}
                        alt={t("attachedImage")}
                        className="mb-3 max-w-[200px] rounded-lg border border-[var(--color-border)]"
                      />
                    );
                  }
                  return null;
                })}
                {/* Fallback for messages without parts */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {!(message as any).parts?.length && (
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {getMessageText(message)}
                  </div>
                )}
              </div>

              {/* Copy button for assistant messages */}
              {message.role === "assistant" && (
                <div className="mt-1.5 flex gap-2 self-start">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getMessageText(message));
                      setCopiedId(message.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    <span className="sr-only">{t("copyToClipboard")}</span>
                    {copiedId === message.id ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedId === message.id ? "Copied!" : t("copyBtn")}
                  </button>

                  <button
                    onClick={() =>
                      exportAsPDF(getMessageText(message), "axiom-solve")
                    }
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-dim)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-text-secondary)]"
                    title="Export PDF"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </button>

                  <button
                    onClick={() =>
                      exportAsDOCX(getMessageText(message), "axiom-solve")
                    }
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-dim)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-text-secondary)]"
                    title="Export DOCX"
                  >
                    .docx
                  </button>

                  {/* Share button displays only on the very last assistant message if the chat is saved */}
                  {msgIdx === messages.length - 1 &&
                    activeChatId &&
                    !isLoading && (
                      <button
                        onClick={shareChat}
                        disabled={isSharing}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-dim)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-text-secondary)] disabled:opacity-50"
                        title={t("shareWithClass")}
                      >
                        {isSharing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : copiedId === "share_success" ? (
                          <Check className="h-3 w-3 text-[var(--color-ax-blue)]" />
                        ) : (
                          <Share2 className="h-3 w-3 text-[var(--color-ax-blue)]" />
                        )}
                        <span
                          className={
                            copiedId === "share_success" || shareUrl
                              ? "text-[var(--color-ax-blue)]"
                              : ""
                          }
                        >
                          {copiedId === "share_success"
                            ? "Link Copied!"
                            : t("shareWithClass")}
                        </span>
                      </button>
                    )}
                </div>
              )}

              {/* Follow-up action buttons after AI responses */}
              {message.role === "assistant" &&
                msgIdx === messages.length - 1 &&
                !isLoading && (
                  <div className="mt-3 flex max-w-[85%] flex-wrap gap-2">
                    {[
                      {
                        label: "🤔 Explain simpler",
                        prompt:
                          "Explain the last answer in a simpler way, as if I were 12 years old.",
                      },
                      {
                        label: "🔄 Another method",
                        prompt:
                          "Solve the same problem using a different method or approach.",
                      },
                      {
                        label: "📝 Practice questions",
                        prompt:
                          "Generate 5 similar practice questions for me to try.",
                      },
                      {
                        label: "📚 Theory behind it",
                        prompt:
                          "Explain the underlying theory and concepts behind this problem.",
                      },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => {
                          setInput("");
                          sendMessage({ text: action.prompt });
                        }}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg3)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-ax-blue)]/30 hover:text-[var(--color-ax-blue)]"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))
        )}

        {/* Loading indicator */}
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

      {/* Input Area */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg2)] p-4">
        {localAttachment && (
          <div className="mb-3 flex items-center gap-3">
            <div className="relative inline-block">
              <img
                src={localAttachment}
                alt={t("preview", { defaultMessage: "Preview" })}
                className="h-16 w-16 rounded-lg border border-[var(--color-ax-blue)] object-cover"
              />
              <button
                onClick={() => setLocalAttachment(null)}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
              >
                ×
              </button>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {t("imageAttached")}
            </span>
          </div>
        )}

        <form onSubmit={onSubmitForm} className="relative flex items-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleCapturePhoto}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3 rounded-full p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-ax-blue)]"
            title={t("uploadPhoto")}
          >
            <Camera className="h-5 w-5" />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isLoading ? "Solving..." : "Type or paste your question here..."
            }
            disabled={isLoading}
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg0)] py-3.5 pr-14 pl-12 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-dim)] focus:border-[var(--color-ax-blue)] focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !localAttachment)}
            className="absolute right-2 rounded-full bg-[var(--color-ax-blue)] p-2 text-black transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="ml-0.5 h-5 w-5" />
            )}
          </button>
        </form>
      </div>

      {/* Watermark for free users */}
      <Watermark />
    </div>
  );
}
