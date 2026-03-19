"use client";

import { X, FileDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import type { StudentReport } from "@/lib/actions/report";

interface Props {
  report: StudentReport;
  onClose: () => void;
  onExportPdf?: (report: StudentReport) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function Stars({ level }: { level: number }) {
  return (
    <span className="text-[11px] tracking-wide">
      {"★".repeat(level)}
      {"☆".repeat(5 - level)}
    </span>
  );
}

function MasteryBar({ percent }: { percent: number }) {
  let color = "bg-red-400";
  if (percent >= 40) color = "bg-yellow-400";
  if (percent >= 70) color = "bg-orange-400";
  if (percent >= 90) color = "bg-[var(--color-ax-blue)]";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg2)]">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.max(2, percent)}%` }}
      />
    </div>
  );
}

export function StudentReportModal({ report, onClose, onExportPdf }: Props) {
  const t = useTranslations("Report");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const TrendIcon = report?.activity.trend === "improving"
    ? TrendingUp
    : report?.activity.trend === "declining"
      ? TrendingDown
      : Minus;

  const trendLabel = report?.activity.trend === "improving"
    ? t("improving")
    : report?.activity.trend === "declining"
      ? t("declining")
      : t("stable");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm md:items-center md:p-8">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg0)] shadow-2xl">
        {/* Close + Export */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-[var(--color-border)] bg-[var(--color-bg0)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("title")}
          </h2>
          <div className="flex items-center gap-2">
            {report && onExportPdf && (
              <button
                onClick={() => onExportPdf(report)}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-ax-orange)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
              >
                <FileDown className="h-3.5 w-3.5" />
                {t("exportPdf")}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--color-dim)] transition-colors hover:bg-[var(--color-bg2)] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Header — Student info */}
              <div className="flex items-center gap-4">
                {report.student.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={report.student.avatar_url}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-ax-blue)]/15 text-lg font-bold text-[var(--color-ax-blue)]">
                    {getInitials(report.student.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {report.student.name}
                  </h3>
                  <p className="text-sm text-[var(--color-dim)]">
                    {report.class.name} · {report.class.org_name}
                  </p>
                  <p className="text-xs text-[var(--color-dim)]">
                    {t("memberSince")} {new Date(report.stats.member_since).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Section 1 — Summary Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: t("totalSolved"), value: report.stats.total_solved, icon: "📚" },
                  { label: t("accuracy"), value: `${report.stats.accuracy_percent}%`, icon: "🎯" },
                  { label: t("streak"), value: `${report.stats.current_streak}`, icon: "🔥" },
                  { label: t("badges"), value: report.stats.badges_count, icon: "🏅" },
                  { label: t("activeDays30d"), value: report.activity.days_active_30d, icon: "📅" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-3 text-center"
                  >
                    <span className="text-lg">{card.icon}</span>
                    <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
                      {card.value}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-dim)]">
                      {card.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Section 2 — Knowledge Map */}
              {report.subjects.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    🧠 {t("knowledgeMap")}
                  </h4>
                  {report.subjects.map((subject) => (
                    <div
                      key={subject.name}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {subject.name}
                        </span>
                        <span className="text-xs text-[var(--color-dim)]">
                          {t("avgMastery")}: {subject.avg_mastery}% · {subject.topics_mastered}/{subject.total_topics} {t("mastered")}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {subject.topics.map((topic) => (
                          <div key={topic.name}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                {topic.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <Stars level={topic.level} />
                                <span className="text-[10px] text-[var(--color-dim)]">
                                  {topic.correct_count}✓ {topic.incorrect_count}✗
                                </span>
                                <span className="text-[10px] font-bold text-[var(--color-dim)]">
                                  {topic.mastery_percent}%
                                </span>
                              </div>
                            </div>
                            <MasteryBar percent={topic.mastery_percent} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section 3 — Strengths & Weaknesses */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <h4 className="mb-2 text-sm font-bold text-green-400">
                    ✅ {t("strengths")}
                  </h4>
                  {report.strengths.length > 0 ? (
                    <ul className="space-y-1">
                      {report.strengths.slice(0, 8).map((s) => (
                        <li key={s} className="text-xs text-[var(--color-text-secondary)]">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[var(--color-dim)] italic">{t("noStrengthsYet")}</p>
                  )}
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <h4 className="mb-2 text-sm font-bold text-red-400">
                    ⚠️ {t("weaknesses")}
                  </h4>
                  {report.weaknesses.length > 0 ? (
                    <ul className="space-y-1">
                      {report.weaknesses.slice(0, 8).map((w) => (
                        <li key={w} className="text-xs text-[var(--color-text-secondary)]">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[var(--color-dim)] italic">{t("noWeaknesses")}</p>
                  )}
                </div>
              </div>

              {/* Section 4 — Activity */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-4">
                <h4 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
                  📊 {t("recentActivity")}
                </h4>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendIcon className={`h-4 w-4 ${
                      report.activity.trend === "improving" ? "text-green-400" :
                      report.activity.trend === "declining" ? "text-red-400" : "text-yellow-400"
                    }`} />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {t("trend")}: <strong>{trendLabel}</strong>
                    </span>
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {report.activity.exercises_30d} {t("exercisesIn30d")}
                  </span>
                </div>
                {/* Module usage bars */}
                <div className="mt-4 space-y-2">
                  {[
                    { label: "Solve", value: report.usage.solves, color: "bg-blue-500" },
                    { label: "Write", value: report.usage.writes, color: "bg-purple-500" },
                    { label: "Humanize", value: report.usage.humanizes, color: "bg-pink-500" },
                    { label: "Learn", value: report.usage.learns, color: "bg-green-500" },
                  ].map((mod) => {
                    const maxUsage = Math.max(report.usage.solves, report.usage.writes, report.usage.humanizes, report.usage.learns, 1);
                    return (
                      <div key={mod.label} className="flex items-center gap-3">
                        <span className="w-16 text-right text-[10px] font-medium text-[var(--color-dim)]">
                          {mod.label}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg2)]">
                          <div
                            className={`h-full rounded-full ${mod.color}`}
                            style={{ width: `${(mod.value / maxUsage) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-[10px] font-mono text-[var(--color-dim)]">
                          {mod.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 5 — Badges */}
              {report.badges.length > 0 && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-4">
                  <h4 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
                    🏆 {t("badgesEarned")}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {report.badges.map((badge) => (
                      <div
                        key={badge.name}
                        className="flex flex-col items-center gap-1 rounded-lg bg-[var(--color-bg2)] p-2"
                      >
                        <span className="text-xl">{badge.icon}</span>
                        <span className="text-center text-[9px] font-medium text-[var(--color-text-secondary)]">
                          {badge.name}
                        </span>
                        <span className="text-[8px] text-[var(--color-dim)]">
                          {new Date(badge.unlocked_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
