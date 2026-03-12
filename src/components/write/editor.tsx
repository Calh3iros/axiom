"use client";

import {
  FileText,
  Expand,
  Quote,
  Wand2,
  CheckCircle,
  Loader2,
  Copy,
  Trash2,
  BookMarked,
  Download,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useCallback } from "react";

import { exportAsPDF, exportAsDOCX } from "@/lib/export-utils";

import { Watermark } from "../shared/watermark";

type WriteAction = "outline" | "expand" | "cite" | "humanize" | "conclude";

const actions: {
  key: WriteAction;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    key: "outline",
    label: "Outline",
    icon: FileText,
    description: "Generate essay structure",
  },
  {
    key: "expand",
    label: "Expand",
    icon: Expand,
    description: "Develop paragraphs",
  },
  { key: "cite", label: "Cite", icon: Quote, description: "Add APA citations" },
  {
    key: "humanize",
    label: "Humanize",
    icon: Wand2,
    description: "Sound more natural",
  },
  {
    key: "conclude",
    label: "Conclude",
    icon: CheckCircle,
    description: "Write conclusion",
  },
];

export function WriteEditor() {
  const [content, setContent] = useState("");
  const [output, setOutput] = useState("");
  const [citations, setCitations] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<WriteAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "citations">("output");
  const locale = useLocale();
  const t = useTranslations("Dashboard.Components");

  const handleAction = useCallback(
    async (action: WriteAction) => {
      if (!content.trim() || loading) return;

      setActiveAction(action);
      setLoading(true);

      if (action === "cite") {
        setActiveTab("citations");
      } else {
        setActiveTab("output");
        setOutput("");
      }

      try {
        const res = await fetch("/api/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, content, context: content, locale }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to generate");
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let result = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });

            if (action === "cite") {
              // We'll just show the streaming result as the 'newest citation' temporarily
              // but we really want to append it to the citations list when exactly done.
              // For now, let's just keep it in output, then on finish, move it.
              setOutput(result);
            } else {
              setOutput(result);
            }
          }

          if (action === "cite") {
            setCitations((prev) => [...prev, result]);
            setOutput(""); // clear output since it's now in citations
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Write Error:", err);
        if (action !== "cite") {
          setOutput(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
        setActiveAction(null);
      }
    },
    [content, loading, locale]
  );

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  const handleUseOutput = () => {
    setContent((prev) => prev + "\n\n" + output);
    setOutput("");
  };

  const handleUseCitation = (cit: string) => {
    setContent((prev) => prev + "\n" + cit);
  };

  return (
    <div className="flex h-full flex-col space-y-4">
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
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "border-[var(--color-ax-blue)]/30 bg-[var(--color-ax-blue)]/15 text-[var(--color-ax-blue)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg3)] hover:text-[var(--color-text-primary)]"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Editor Split View */}
      <div className="grid min-h-[400px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input Editor */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="text-xs font-bold tracking-wider text-[var(--color-text-secondary)] uppercase">
              {t("yourText")}
            </span>
            <button
              onClick={() => setContent("")}
              className="p-1 text-[var(--color-dim)] transition-colors hover:text-red-400"
              title={t("clearBtn")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("pasteEssayTopic")}
            className="flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed text-[var(--color-text-primary)] placeholder-[var(--color-dim)] focus:outline-none"
          />
          <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-dim)]">
            {content.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Output & Citations Panel */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)]">
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg2)]">
            <button
              onClick={() => setActiveTab("output")}
              className={`flex-1 border-b-2 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${
                activeTab === "output"
                  ? "border-[var(--color-ax-blue)] text-[var(--color-ax-blue)]"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              AI Output
            </button>
            <button
              onClick={() => setActiveTab("citations")}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${
                activeTab === "citations"
                  ? "border-[var(--color-ax-blue)] text-[var(--color-ax-blue)]"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <BookMarked className="h-4 w-4" />
              Citations ({citations.length})
            </button>
          </div>

          <div className="flex min-h-[48px] items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
            <span className="text-xs font-bold tracking-wider text-[var(--color-text-secondary)] uppercase">
              {loading && activeTab === "output" ? "Generating..." : ""}
              {loading && activeTab === "citations" ? "Finding Sources..." : ""}
            </span>
            {activeTab === "output" && output && (
              <div className="flex gap-1">
                <button
                  onClick={handleCopyOutput}
                  className="rounded p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-ax-blue)]"
                  title={t("copyOutput")}
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => exportAsPDF(output, "axiom-write")}
                  className="rounded p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-ax-blue)]"
                  title="Export PDF"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => exportAsDOCX(output, "axiom-write")}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg3)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  .docx
                </button>
                <button
                  onClick={handleUseOutput}
                  className="rounded-lg border border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/10 px-3 py-1 text-xs font-medium text-[var(--color-ax-blue)] transition-colors hover:bg-[var(--color-ax-blue)]/20"
                >
                  Use ↓
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "output" &&
              (output ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-text-primary)]">
                  {output}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-sm text-[var(--color-dim)]">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--color-ax-blue)]" />
                      <span>{t("writing")}</span>
                    </div>
                  ) : (
                    <p>{t("selectAction")}</p>
                  )}
                </div>
              ))}

            {activeTab === "citations" && (
              <div className="space-y-4">
                {/* Streaming Citation */}
                {loading && activeAction === "cite" && output && (
                  <div className="relative rounded-xl border border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/5 p-4 opacity-70">
                    <Loader2 className="absolute top-4 right-4 h-4 w-4 animate-spin text-[var(--color-ax-blue)]" />
                    <p className="pr-8 text-sm leading-relaxed whitespace-pre-wrap">
                      {output}
                    </p>
                  </div>
                )}

                {/* Saved Citations */}
                {citations.length === 0 && !loading && (
                  <div className="mt-12 flex h-full flex-col items-center justify-center text-center text-sm text-[var(--color-dim)] opacity-60">
                    <BookMarked className="mb-3 h-8 w-8" />
                    <p>{t("noCitations")}</p>
                    <p className="mt-1 max-w-[200px]">{t("selectToCite")}</p>
                  </div>
                )}

                {citations.map((cit, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] p-4 transition-colors hover:border-[var(--color-border2)]"
                  >
                    <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {cit}
                    </p>
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => navigator.clipboard.writeText(cit)}
                        className="p-1.5 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        title={t("copyBtn")}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUseCitation(cit)}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg3)]"
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

      {/* Watermark for free users */}
      <Watermark />
    </div>
  );
}
