"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export interface DateRange {
  startDate: string;   // ISO date: YYYY-MM-DD
  endDate: string;
}

export type PeriodPreset = "7d" | "30d" | "90d" | "180d" | "year" | "custom";

function getPresetRange(preset: PeriodPreset): DateRange {
  const now = new Date();
  const end = now.toISOString().split("T")[0];

  switch (preset) {
    case "7d":
      return { startDate: new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0], endDate: end };
    case "30d":
      return { startDate: new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0], endDate: end };
    case "90d":
      return { startDate: new Date(now.getTime() - 90 * 86400000).toISOString().split("T")[0], endDate: end };
    case "180d":
      return { startDate: new Date(now.getTime() - 180 * 86400000).toISOString().split("T")[0], endDate: end };
    case "year": {
      const year = now.getFullYear();
      return { startDate: `${year}-02-01`, endDate: `${year}-12-31` };
    }
    default:
      return { startDate: new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0], endDate: end };
  }
}

export function usePeriod(defaultPreset: PeriodPreset = "30d") {
  const [preset, setPreset] = useState<PeriodPreset>(defaultPreset);
  const [range, setRange] = useState<DateRange>(getPresetRange(defaultPreset));

  const changePreset = (p: PeriodPreset) => {
    setPreset(p);
    if (p !== "custom") setRange(getPresetRange(p));
  };

  const changeCustomRange = (r: DateRange) => {
    setPreset("custom");
    setRange(r);
  };

  return { preset, range, changePreset, changeCustomRange };
}

export function PeriodSelector({
  preset,
  range,
  onPresetChange,
  onCustomChange,
}: {
  preset: PeriodPreset;
  range: DateRange;
  onPresetChange: (p: PeriodPreset) => void;
  onCustomChange: (r: DateRange) => void;
}) {
  const t = useTranslations("Dashboard");
  const [showCustom, setShowCustom] = useState(preset === "custom");

  const presets: { key: PeriodPreset; label: string }[] = [
    { key: "7d", label: t("period.7d") },
    { key: "30d", label: t("period.30d") },
    { key: "90d", label: t("period.90d") },
    { key: "180d", label: t("period.180d") },
    { key: "year", label: t("period.year") },
    { key: "custom", label: t("period.custom") },
  ];

  return (
    <div className="period-selector">
      <Calendar style={{ width: 16, height: 16, color: "#64748b" }} />
      <div className="period-btns">
        {presets.map((p) => (
          <button
            key={p.key}
            className={`period-btn ${preset === p.key ? "active" : ""}`}
            onClick={() => {
              if (p.key === "custom") {
                setShowCustom(true);
                onPresetChange("custom");
              } else {
                setShowCustom(false);
                onPresetChange(p.key);
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="period-custom">
          <input
            type="date"
            value={range.startDate}
            onChange={(e) => onCustomChange({ ...range, startDate: e.target.value })}
            className="period-date"
          />
          <span style={{ color: "#64748b" }}>→</span>
          <input
            type="date"
            value={range.endDate}
            onChange={(e) => onCustomChange({ ...range, endDate: e.target.value })}
            className="period-date"
          />
        </div>
      )}
      <style>{`
        .period-selector { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .period-btns { display: flex; gap: 4px; flex-wrap: wrap; }
        .period-btn { padding: 6px 14px; border: 1px solid var(--color-border, #1e1e2e); border-radius: 8px; background: transparent; color: #94a3b8; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .period-btn:hover { background: var(--color-bg1, #12121a); color: #e2e8f0; }
        .period-btn.active { background: #312e81; color: #c7d2fe; border-color: #4f46e5; }
        .period-custom { display: flex; align-items: center; gap: 8px; }
        .period-date { padding: 6px 10px; background: var(--color-bg1, #12121a); border: 1px solid var(--color-border, #1e1e2e); border-radius: 8px; color: #e2e8f0; font-size: 12px; outline: none; }
        .period-date:focus { border-color: #818cf8; }
      `}</style>
    </div>
  );
}
