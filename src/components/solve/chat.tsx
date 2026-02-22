'use client';

import { useChat } from '@ai-sdk/react';
import { Camera, Send, Loader2, Sparkles, Copy, Check, Share2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { UIMessage, DefaultChatTransport } from 'ai';

interface SolveChatProps {
  chatId?: string;
  initialMessages?: UIMessage[];
}

export function SolveChat({ chatId: initialChatId, initialMessages = [] }: SolveChatProps) {
  const [input, setInput] = useState('');
  const [localAttachment, setLocalAttachment] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(initialChatId);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const t = useTranslations('Dashboard.Components');

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: activeChatId ? { type: 'solve', chatId: activeChatId, locale } : { type: 'solve', locale },
      fetch: async (url: any, options: any) => {
        const res = await fetch(url, options);
        const id = res.headers.get('x-chat-id');
        if (id && !activeChatId) {
          setActiveChatId(id);
          window.history.replaceState({}, '', `/solve/${id}`);
        }
        return res;
      }
    }),
    onError: (err: Error) => console.error('Chat API Error:', err.message),
    onFinish: () => {
      // Micro-rewards!
      const rewards = [
        "🧠 +1 Brain Power!",
        "✅ Nailed it!",
        "🔥 You're on fire!",
        "👏 Great question!",
        "🚀 Concept unlocked!"
      ];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      toast.success(randomReward, { duration: 3000 });
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Camera/file capture — resize to 1024px max for token economy
  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    const maxDim = 1024;
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);

    setLocalAttachment(canvas.toDataURL('image/jpeg', 0.85));
  };

  const onSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && !localAttachment) || isLoading) return;

    const files: { type: 'file'; mediaType: string; filename: string; url: string }[] = [];

    if (localAttachment) {
      files.push({
        type: 'file',
        mediaType: 'image/jpeg',
        filename: 'question.jpg',
        url: localAttachment,
      });
    }

    await sendMessage({
      text: input || 'What is this? Please solve it step by step.',
      files: files.length > 0 ? files : undefined,
    });

    setInput('');
    setLocalAttachment(null);
  };

  // Helper to extract text from UIMessage parts
  const getMessageText = (message: any): string => {
    if (message.content) return message.content;
    if (message.parts) {
      return message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    return '';
  };

  const shareChat = async () => {
    if (!activeChatId) return;
    setIsSharing(true);
    try {
      const res = await fetch('/api/chat/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeChatId })
      });
      const data = await res.json();
      if (data.shareId) {
        const url = `${window.location.origin}/share/${data.shareId}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url);
        // Temporarily use copiedId state for the Share button feedback too
        setCopiedId('share_success');
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to share', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl overflow-hidden shadow-inner relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg2)] border border-[var(--color-border)] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[var(--color-ax-blue)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{t('howCanIHelp')}</h2>
              <p className="text-[var(--color-text-secondary)] text-sm max-w-sm">
                Paste your homework question or take a clear photo of the assignment to get an instant step-by-step solution.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, msgIdx) => (
            <div key={message.id} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-[var(--color-ax-blue)]/10 border border-[var(--color-ax-blue)]/20 text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg2)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                }`}
              >
                {/* Render message parts (text + files) */}
                {(message as any).parts?.map((part: any, i: number) => {
                  if (part.type === 'text' && part.text) {
                    return (
                      <div key={i} className="whitespace-pre-wrap leading-relaxed">
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                    return (
                      <img
                        key={i}
                        src={part.url}
                        alt={t('attachedImage')}
                        className="max-w-[200px] mb-3 rounded-lg border border-[var(--color-border)]"
                      />
                    );
                  }
                  return null;
                })}
                {/* Fallback for messages without parts */}
                {!(message as any).parts?.length && (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {getMessageText(message)}
                  </div>
                )}
              </div>

              {/* Copy button for assistant messages */}
              {message.role === 'assistant' && (
                <div className="mt-1.5 self-start flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getMessageText(message));
                      setCopiedId(message.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    <span className="sr-only">{t('copyToClipboard')}</span>
                    {copiedId === message.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === message.id ? 'Copied!' : t('copyBtn')}
                  </button>

                  {/* Share button displays only on the very last assistant message if the chat is saved */}
                  {msgIdx === messages.length - 1 && activeChatId && !isLoading && (
                    <button
                      onClick={shareChat}
                      disabled={isSharing}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--color-dim)] hover:text-[var(--color-text-secondary)] transition-colors rounded-md hover:bg-[var(--color-bg3)] disabled:opacity-50"
                      title={t('shareWithClass')}
                    >
                      {isSharing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : copiedId === 'share_success' ? (
                        <Check className="w-3 h-3 text-[var(--color-ax-blue)]" />
                      ) : (
                        <Share2 className="w-3 h-3 text-[var(--color-ax-blue)]" />
                      )}
                      <span className={copiedId === 'share_success' || shareUrl ? "text-[var(--color-ax-blue)]" : ""}>
                        {copiedId === 'share_success' ? 'Link Copied!' : t('shareWithClass')}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Follow-up action buttons after AI responses */}
              {message.role === 'assistant' && msgIdx === messages.length - 1 && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-3 max-w-[85%]">
                  {[
                    { label: '🤔 Explain simpler', prompt: 'Explain the last answer in a simpler way, as if I were 12 years old.' },
                    { label: '🔄 Another method', prompt: 'Solve the same problem using a different method or approach.' },
                    { label: '📝 Practice questions', prompt: 'Generate 5 similar practice questions for me to try.' },
                    { label: '📚 Theory behind it', prompt: 'Explain the underlying theory and concepts behind this problem.' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        setInput('');
                        sendMessage({ text: action.prompt });
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-ax-blue)]/30 hover:text-[var(--color-ax-blue)] transition-all"
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
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl p-4 bg-[var(--color-bg2)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t('thinking')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg2)]">
        {localAttachment && (
          <div className="mb-3 flex items-center gap-3">
            <div className="relative inline-block">
              <img src={localAttachment} alt={t('preview', { defaultMessage: 'Preview' })} className="h-16 w-16 object-cover rounded-lg border border-[var(--color-ax-blue)]" />
              <button
                onClick={() => setLocalAttachment(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">{t('imageAttached')}</span>
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
            className="absolute left-3 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-ax-blue)] transition-colors rounded-full hover:bg-[var(--color-bg3)]"
            title={t('uploadPhoto')}
          >
            <Camera className="w-5 h-5" />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Solving..." : "Type or paste your question here..."}
            disabled={isLoading}
            className="w-full bg-[var(--color-bg0)] border border-[var(--color-border)] rounded-full py-3.5 pl-12 pr-14 text-sm focus:outline-none focus:border-[var(--color-ax-blue)] text-[var(--color-text-primary)] placeholder-[var(--color-dim)] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !localAttachment)}
            className="absolute right-2 p-2 bg-[var(--color-ax-blue)] text-black rounded-full hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
