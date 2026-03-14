"use client";

import * as Diff from "diff";
import {
  Copy,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { detectAI, type DetectionResult } from "@/lib/ai/detect";

import { PaywallModal } from "../shared/paywall-modal";
import { Watermark } from "../shared/watermark";

import { ModeSelector } from "./mode-selector";

export function HumanizerPanel() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"academic" | "casual" | "pro">("academic");
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [inputScore, setInputScore] = useState<DetectionResult | null>(null);
  const [outputScore, setOutputScore] = useState<DetectionResult | null>(null);
  const [showSignals, setShowSignals] = useState(false);

  // Word count display
  const MAX_FREE_WORDS = 500;
  const wordCount = input
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const locale = useLocale();
  const t = useTranslations("Dashboard.Components");

  const handleHumanize = async () => {
    if (!input) return;

    setLoading(true);
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, mode, locale }),
      });

      if (res.status === 429 || res.status === 402) {
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to humanize");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.text) {
        setOutput(data.text);
        // Run AI detection on both original and humanized text
        setInputScore(detectAI(input));
        setOutputScore(detectAI(data.text));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setOutput(`Error: ${err.message || "Failed to humanize text"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      // Optional: Show toast
    }
  };

  const getDiffRender = () => {
    if (!input || !output) return null;
    if (output.startsWith("Error:")) return output;

    const diffs = Diff.diffWords(input, output);
    return (
      <div className="leading-relaxed whitespace-pre-wrap">
        {diffs.map((part, index) => {
          if (part.removed) return null; // Only show what's in the final output
          if (part.added) {
            return (
              <span
                key={index}
                className="rounded-sm bg-green-500/20 px-1 py-0.5 font-medium text-green-400 transition-colors"
              >
                {part.value}
              </span>
            );
          }
          return (
            <span key={index} className="text-[var(--color-text-primary)]">
              {part.value}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Input Side */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] transition-colors focus-within:border-[var(--color-ax-blue)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg2)] p-4">
          <span className="text-sm font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
            {t("input")}
          </span>
          <span
            className={`font-mono text-xs ${wordCount > MAX_FREE_WORDS ? "font-bold text-[var(--color-ax-red)]" : "text-[var(--color-dim)]"}`}
          >
            {wordCount} / {MAX_FREE_WORDS} free words
          </span>
        </div>
        <textarea
          className="w-full flex-1 resize-none bg-transparent p-6 leading-relaxed text-[var(--color-text-primary)] placeholder-[var(--color-dim)] outline-none"
          placeholder={t("pasteText")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg2)] p-4">
          <ModeSelector mode={mode} setMode={setMode} />
          <button
            onClick={handleHumanize}
            disabled={loading || !input}
            className="flex items-center gap-2 rounded-full bg-[var(--color-ax-blue)] px-6 py-2.5 font-semibold text-black transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Humanizing..." : "Humanize"}
          </button>
        </div>
      </div>

      {/* Output Side */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg0)] shadow-inner">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg1)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              {t("humanizedResult")}
            </span>
            {inputScore && outputScore && !output.startsWith("Error:") && (
              <div className="flex items-center gap-2">
                {/* Original score */}
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold ${
                    inputScore.score >= 50
                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                      : inputScore.score >= 25
                        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                        : "border-green-500/20 bg-green-500/10 text-green-400"
                  }`}
                >
                  <ShieldAlert className="h-3 w-3" />
                  <span>Before: {inputScore.score}%</span>
                </div>
                {/* Arrow */}
                <span className="text-xs text-[var(--color-dim)]">→</span>
                {/* Humanized score */}
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                    outputScore.score >= 50
                      ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
                      : outputScore.score >= 25
                        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                        : "border-green-500/20 bg-green-500/10 text-green-400"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>After: {outputScore.score}%</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="text-[var(--color-dim)] transition-colors hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:hover:text-[var(--color-dim)]"
            title={t("copyToClipboard")}
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
        <div className="relative w-full flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8">
              {/* Skeleton Loaders */}
              <div className="h-4 w-full animate-pulse rounded bg-[var(--color-bg2)]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-bg2)]" />
              <div className="h-4 w-full animate-pulse rounded bg-[var(--color-bg2)]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-bg2)]" />
              <span className="mt-4 font-mono text-sm text-[var(--color-dim)]">
                {t("applyingImperfections")}
              </span>
            </div>
          ) : output ? (
            <div className="space-y-4">
              <div className="text-[var(--color-text-primary)]">
                {getDiffRender()}
              </div>

              {/* Signal Breakdown */}
              {outputScore && (
                <div className="border-t border-[var(--color-border)] pt-4">
                  <button
                    onClick={() => setShowSignals(!showSignals)}
                    className="mb-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    {showSignals ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    <span className="font-bold tracking-wider uppercase">
                      Detection Signals ({outputScore.signals.length})
                    </span>
                  </button>
                  {showSignals && (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {outputScore.signals.map((signal) => {
                        const pct = Math.round(signal.score * 100);
                        const barColor =
                          pct < 25
                            ? "bg-green-400"
                            : pct < 50
                              ? "bg-yellow-400"
                              : pct < 75
                                ? "bg-orange-400"
                                : "bg-red-400";
                        return (
                          <div
                            key={signal.name}
                            className="rounded-lg bg-[var(--color-bg2)] p-3"
                          >
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                {signal.name}
                              </span>
                              <span
                                className={`font-mono text-xs font-bold ${pct < 25 ? "text-green-400" : pct < 50 ? "text-yellow-400" : pct < 75 ? "text-orange-400" : "text-red-400"}`}
                              >
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg0)]">
                              <div
                                className={`h-full rounded-full transition-all ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-[var(--color-dim)]">
                              {signal.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-dim)]">
              Your humanized text will appear here. Added words will be
              highlighted.
            </div>
          )}
        </div>
      </div>

      {/* Watermark for free users */}
      <Watermark />

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          reason="word_limit"
        />
      )}
    </>
  );
}
