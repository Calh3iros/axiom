"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { getStreakCalendar } from "@/lib/actions/profile";

export function StreakCalendar() {
  const t = useTranslations("Dashboard.Map");
  const [days, setDays] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStreakCalendar()
      .then(setDays)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-28 animate-pulse rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)]" />
    );
  }

  if (days.length === 0) return null;

  // Color levels based on interaction count
  const getColor = (count: number): string => {
    if (count === 0) return "var(--color-bg2)";
    if (count <= 2) return "#22c55e33"; // green 20%
    if (count <= 5) return "#22c55e77"; // green 47%
    return "#22c55ecc"; // green 80%
  };

  // Group by weeks (columns) — 7 rows x N cols
  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];

  // Pad start to align with weekdays
  const firstDay = new Date(days[0].date).getDay();
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: "", count: -1 }); // placeholder
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Month labels
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIdx) => {
    for (const day of week) {
      if (day.date) {
        const month = new Date(day.date).getMonth();
        if (month !== lastMonth) {
          lastMonth = month;
          months.push({
            label: new Date(day.date).toLocaleDateString(undefined, {
              month: "short",
            }),
            col: weekIdx,
          });
        }
        break;
      }
    }
  });

  return (
    <div className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4">
      <h3 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
        📅 {t("streakCalendar")}
      </h3>

      {/* Month labels */}
      <div
        className="mb-1 flex gap-[3px] text-[9px] text-[var(--color-dim)]"
        style={{
          paddingLeft: "18px",
        }}
      >
        {months.map((m, i) => (
          <span
            key={i}
            style={{
              position: "relative",
              left: `${m.col * 15}px`,
            }}
            className="absolute"
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="mt-5 flex gap-[3px] overflow-x-auto">
        {/* Day labels */}
        <div className="flex shrink-0 flex-col gap-[3px] text-[9px] text-[var(--color-dim)]">
          <span className="flex h-[12px] items-center">&nbsp;</span>
          <span className="flex h-[12px] items-center">M</span>
          <span className="flex h-[12px] items-center">&nbsp;</span>
          <span className="flex h-[12px] items-center">W</span>
          <span className="flex h-[12px] items-center">&nbsp;</span>
          <span className="flex h-[12px] items-center">F</span>
          <span className="flex h-[12px] items-center">&nbsp;</span>
        </div>

        {/* Grid */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="h-[12px] w-[12px] rounded-[2px] transition-colors"
                style={{
                  backgroundColor:
                    day.count < 0 ? "transparent" : getColor(day.count),
                }}
                title={
                  day.date
                    ? `${day.date}: ${day.count} ${day.count === 1 ? "interaction" : "interactions"}`
                    : ""
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[9px] text-[var(--color-dim)]">
        <span>{t("calendarLess")}</span>
        {[0, 1, 3, 6].map((n) => (
          <div
            key={n}
            className="h-[10px] w-[10px] rounded-[2px]"
            style={{ backgroundColor: getColor(n) }}
          />
        ))}
        <span>{t("calendarMore")}</span>
      </div>
    </div>
  );
}
