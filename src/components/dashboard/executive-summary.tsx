"use client";

import { useTranslations } from "next-intl";

interface ExecutiveSummaryProps {
  level: "network" | "school" | "class";
  totalStudents: number;
  activeStudents: number;
  avgAccuracy: number;
  adoption: number;
  schoolCount?: number;
  inactiveCount?: number;
  lowAdoptionSchools?: number;
}

export function ExecutiveSummary({
  level,
  totalStudents,
  activeStudents,
  avgAccuracy,
  adoption,
  schoolCount,
  inactiveCount,
  lowAdoptionSchools,
}: ExecutiveSummaryProps) {
  const t = useTranslations("Dashboard");

  // Don't show if there's literally nothing
  if (totalStudents === 0 && level !== "network") return null;

  const lines: string[] = [];

  // Determine border color
  const borderColor =
    adoption >= 70 ? "#22c55e" : adoption >= 40 ? "#f59e0b" : "#ef4444";

  // Line 1: Status overview
  if (level === "network") {
    if (totalStudents === 0) {
      lines.push(t("summaryNoStudents"));
    } else if (schoolCount != null) {
      lines.push(
        t("summaryNetworkOverview", {
          schools: schoolCount,
          total: totalStudents,
          active: activeStudents,
        })
      );
    }
  } else if (level === "school") {
    if (totalStudents === 0) {
      lines.push(t("summaryNoStudents"));
    } else {
      lines.push(
        t("summarySchoolActive", {
          active: activeStudents,
          total: totalStudents,
        })
      );
    }
  } else {
    lines.push(
      t("summaryClassActive", {
        active: activeStudents,
        total: totalStudents,
      })
    );
  }

  // Line 2: Adoption status (if there are students)
  if (totalStudents > 0) {
    if (adoption >= 70) {
      lines.push(
        t("summaryGoodAdoption", {
          active: activeStudents,
          total: totalStudents,
        })
      );
    } else if (adoption >= 40) {
      lines.push(t("summaryModerateAdoption"));
    } else {
      lines.push(t("summaryLowAdoption"));
    }
  }

  // Line 3: Performance (if there are students with accuracy data)
  if (totalStudents > 0 && avgAccuracy > 0) {
    if (avgAccuracy >= 70) {
      lines.push(t("summaryGoodPerformance", { accuracy: avgAccuracy }));
    } else if (avgAccuracy >= 50) {
      lines.push(t("summaryModeratePerformance", { accuracy: avgAccuracy }));
    } else {
      lines.push(t("summaryLowPerformance", { accuracy: avgAccuracy }));
    }
  }

  // Line 4: Highlights
  if (inactiveCount && inactiveCount > 0) {
    lines.push(t("summaryInactiveCount", { count: inactiveCount }));
  }
  if (lowAdoptionSchools && lowAdoptionSchools > 0) {
    lines.push(t("summaryLowAdoptionSchools", { count: lowAdoptionSchools }));
  }

  if (lines.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="max-w-prose space-y-1">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
