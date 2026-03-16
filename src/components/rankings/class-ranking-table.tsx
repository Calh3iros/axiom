"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { StudentRankingRow, RankingSortField } from "@/lib/actions/rankings";

interface Props {
  rows: StudentRankingRow[];
  currentUserId: string;
  isManager: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const medals = ["🥇", "🥈", "🥉"];

export function ClassRankingTable({ rows, currentUserId, isManager }: Props) {
  const t = useTranslations("Rankings");
  const [sortBy, setSortBy] = useState<RankingSortField>("problems_solved");

  const sorted = [...rows].sort((a, b) => {
    const av = (a as unknown as Record<string, number>)[sortBy] || 0;
    const bv = (b as unknown as Record<string, number>)[sortBy] || 0;
    return (bv || 0) - (av || 0);
  });

  const effortHeaders: { key: RankingSortField; icon: string; label: string }[] = [
    { key: "problems_solved", icon: "📚", label: t("problemsSolved") },
    { key: "active_usage", icon: "⚡", label: t("activeUsage") },
    { key: "streak_days", icon: "🔥", label: t("streakDays") },
  ];

  const perfHeaders: { key: RankingSortField; icon: string; label: string }[] = isManager
    ? [
        { key: "accuracy", icon: "🎯", label: t("accuracy") },
        { key: "topics_mastered", icon: "⭐", label: t("topicsMastered") },
        { key: "badges_count", icon: "🏆", label: t("badges") },
      ]
    : [];

  const allHeaders = [...effortHeaders, ...perfHeaders];

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-10 text-center">
        <p className="text-sm text-[var(--color-dim)]">{t("noActivity")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-4 py-3 text-xs font-medium text-[var(--color-dim)]">#</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--color-dim)]">
              {t("student")}
            </th>
            {allHeaders.map((h) => (
              <th
                key={h.key}
                onClick={() => setSortBy(h.key)}
                className={`cursor-pointer px-4 py-3 text-center text-xs font-medium transition-colors hover:text-[var(--color-text-primary)] ${
                  sortBy === h.key
                    ? "text-[var(--color-ax-blue)]"
                    : "text-[var(--color-dim)]"
                }`}
              >
                <span className="mr-1">{h.icon}</span>
                <span className="hidden sm:inline">{h.label}</span>
                {sortBy === h.key && " ↓"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const isMe = row.user_id === currentUserId;
            const rank = i + 1;

            return (
              <tr
                key={row.user_id}
                className={`border-b border-[var(--color-border)] last:border-0 transition-colors ${
                  isMe
                    ? "bg-[var(--color-ax-blue)]/5 hover:bg-[var(--color-ax-blue)]/10"
                    : "hover:bg-[var(--color-bg2)]"
                }`}
              >
                <td className="px-4 py-3 text-center">
                  {rank <= 3 ? (
                    <span className="text-lg">{medals[rank - 1]}</span>
                  ) : (
                    <span className="text-xs text-[var(--color-dim)]">{rank}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {row.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ax-blue)]/15 text-[10px] font-bold text-[var(--color-ax-blue)]">
                        {getInitials(row.full_name)}
                      </div>
                    )}
                    <span
                      className={`font-medium ${
                        isMe
                          ? "text-[var(--color-ax-blue)]"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {row.full_name}
                      {isMe && (
                        <span className="ml-1.5 text-[10px] opacity-60">
                          ({t("you")})
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                  {row.problems_solved}
                </td>
                <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                  {row.active_usage}
                </td>
                <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                  {row.streak_days}
                </td>
                {isManager && (
                  <>
                    <td
                      className={`px-4 py-3 text-center font-mono text-sm ${
                        (row.accuracy ?? 0) < 50
                          ? "text-red-400"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {row.accuracy ?? 0}%
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                      {row.topics_mastered ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                      {row.badges_count ?? 0}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
