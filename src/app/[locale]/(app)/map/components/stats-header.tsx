"use client";

import { Award, Brain, CheckCircle, Rocket, Target, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

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
  totalCorrect: _totalCorrect,
  accuracy,
  topicsCount,
  streak,
  badgesUnlocked,
  badgesTotal,
}: StatsHeaderProps) {
  const t = useTranslations("Dashboard.Map");

  // Empty state: no exercises solved yet
  if (totalSolved === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-ax-blue)]/20 bg-gradient-to-r from-[var(--color-ax-blue)]/5 via-[var(--color-bg1)] to-orange-500/5 p-6">
        <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-ax-blue)]/10 text-[var(--color-ax-blue)]">
            <Rocket className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              {t("emptyStatsTitle")}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {t("emptyStatsDesc")}
            </p>
          </div>
          <Link
            href="/solve"
            className="shrink-0 rounded-full bg-[var(--color-ax-blue)] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]"
          >
            {t("emptyStatsCta")}
          </Link>
        </div>
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[var(--color-ax-blue)]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-500/5 blur-3xl" />
      </div>
    );
  }

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
