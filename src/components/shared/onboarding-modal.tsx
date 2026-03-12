"use client";

import {
  Home,
  PenTool,
  Wand2,
  BookOpen,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

const STORAGE_KEY = "axiom_onboarding_seen";

interface Slide {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  titleKey: string;
  descKey: string;
  emoji: string;
}

const slides: Slide[] = [
  {
    icon: Home,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    titleKey: "solveTitle",
    descKey: "solveDesc",
    emoji: "📸",
  },
  {
    icon: PenTool,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    titleKey: "writeTitle",
    descKey: "writeDesc",
    emoji: "✍️",
  },
  {
    icon: Wand2,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    titleKey: "humanizeTitle",
    descKey: "humanizeDesc",
    emoji: "🪄",
  },
  {
    icon: BookOpen,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    titleKey: "learnTitle",
    descKey: "learnDesc",
    emoji: "🎓",
  },
];

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const t = useTranslations("Dashboard.Onboarding");

  useEffect(() => {
    // Only show if user hasn't seen onboarding
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Small delay so the page loads first
        const timer = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const current = slides[step];
  const Icon = current.icon;
  const isLast = step === slides.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] shadow-2xl shadow-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-[var(--color-dim)] transition-colors hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="border-b border-[var(--color-border)] px-6 pt-6 pb-4">
            <p className="mb-1 font-mono text-xs font-semibold tracking-wider text-[var(--color-ax-blue)] uppercase">
              {t("welcome")}
            </p>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {t("title")}
            </h2>
          </div>

          {/* Slide content */}
          <div className="px-6 py-6">
            <div
              className={`mb-4 flex items-center gap-3 rounded-xl border ${current.borderColor} ${current.bgColor} p-4`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${current.bgColor} ${current.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${current.color}`}>
                  {current.emoji} {t(current.titleKey)}
                </h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t(current.descKey)}
            </p>
          </div>

          {/* Footer with dots + navigation */}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4">
            {/* Step dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-[var(--color-ax-blue)]"
                      : "w-2 bg-[var(--color-bg3)] hover:bg-[var(--color-dim)]"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("back")}
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 rounded-lg bg-[var(--color-ax-blue)] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]"
              >
                {isLast ? t("getStarted") : t("next")}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
