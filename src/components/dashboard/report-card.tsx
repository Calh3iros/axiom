"use client";

import { FileDown, FileSpreadsheet, Printer } from "lucide-react";

export interface ReportItem {
  label: string;
  description: string;
  icon: "pdf" | "spreadsheet" | "print";
  onClick: () => void;
}

const ICONS = {
  pdf: FileDown,
  spreadsheet: FileSpreadsheet,
  print: Printer,
} as const;

const ICON_COLORS = {
  pdf: "text-orange-400",
  spreadsheet: "text-green-400",
  print: "text-blue-400",
} as const;

export function ReportCard({
  title,
  reports,
}: {
  title: string;
  reports: ReportItem[];
}) {
  if (reports.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 print:hidden">
      <div className="mb-3 flex items-center gap-2">
        <FileDown className="h-4.5 w-4.5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {reports.map((r, i) => {
          const Icon = ICONS[r.icon];
          return (
            <button
              key={i}
              onClick={r.onClick}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3 text-center transition-all hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/5 active:scale-[0.98]"
              style={{ minHeight: "80px" }}
            >
              <Icon className={`h-5 w-5 ${ICON_COLORS[r.icon]}`} />
              <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">
                {r.label}
              </span>
              {r.description && (
                <span className="text-[10px] leading-tight text-[var(--color-dim)]">
                  {r.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
