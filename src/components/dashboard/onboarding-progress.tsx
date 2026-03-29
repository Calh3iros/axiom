"use client";

import { useTranslations } from "next-intl";
import { Rocket } from "lucide-react";

interface OnboardingStep {
  key: string;
  done: boolean;
}

interface OnboardingProgressProps {
  level: "network" | "school";
  steps: OnboardingStep[];
}

export function OnboardingProgress({ level, steps }: OnboardingProgressProps) {
  const t = useTranslations("Org");

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;

  // Hide when all steps are complete
  if (doneCount >= total) return null;

  const pct = Math.round((doneCount / total) * 100);
  const title =
    level === "network"
      ? t("onboardingConfigureNetwork")
      : t("onboardingConfigureSchool");

  return (
    <div className="mb-4 rounded-xl border-2 border-dashed border-orange-500/30 bg-orange-500/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Rocket className="h-5 w-5 text-orange-400" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <span className="text-xs text-[var(--color-dim)]">
          — {t("onboardingStepsComplete", { done: doneCount, total })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {steps.map((step) => {
          const label = t(`onboarding${step.key}` as any);
          const desc = t(`onboarding${step.key}Desc` as any);
          return (
            <div key={step.key} className="flex items-start gap-2">
              <span className="mt-0.5 text-base">
                {step.done ? "✅" : "○"}
              </span>
              <div>
                <span
                  className={`text-sm ${
                    step.done
                      ? "text-[var(--color-dim)] line-through"
                      : "font-medium text-[var(--color-text-primary)]"
                  }`}
                >
                  {label}
                </span>
                {!step.done && desc && (
                  <p className="mt-0.5 text-xs text-[var(--color-dim)]">
                    {desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
