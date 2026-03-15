"use client";

import { Award, Brain, CheckCircle, Target, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

type StatsHeaderProps = {
  totalSolved: number;
  totalCorrect: number;
  accuracy: number;
  topicsCount: number;
  streak: number;
  badgesUnlocked: number;
  badgesTotal: number;
};

export function StatsHeader({
  totalSolved,
  totalCorrect,
  accuracy,
  topicsCount,
  streak,
  badgesUnlocked,
  badgesTotal,
}: StatsHeaderProps) {
  const t = useTranslations("Dashboard.Map");

  const stats = [
    {
      icon: Target,
      label: t("statsSolved"),
      value: totalSolved,
      color: "var(--color-ax-blue)",
    },
    {
      icon: CheckCircle,
      label: t("statsAccuracy"),
      value: `${accuracy}%`,
      color: "#22c55e",
    },
    {
      icon: Brain,
      label: t("statsTopics"),
      value: topicsCount,
      color: "#a855f7",
    },
    {
      icon: Zap,
      label: t("statsStreak"),
      value: `🔥 ${streak}`,
      color: "#f59e0b",
    },
    {
      icon: Award,
      label: t("statsBadges"),
      value: `${badgesUnlocked}/${badgesTotal}`,
      color: "#ec4899",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4 transition-colors hover:border-[var(--color-border)]"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${stat.color}15` }}
          >
            <stat.icon
              className="h-5 w-5"
              style={{ color: stat.color }}
            />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {stat.value}
            </p>
            <p className="text-[10px] font-medium tracking-wider text-[var(--color-dim)] uppercase">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
