"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  getUserBadges,
  type BadgeCatalogItem,
  type UserBadge,
} from "@/lib/actions/badges";

export function BadgeGrid() {
  const t = useTranslations("Badges");
  const [catalog, setCatalog] = useState<BadgeCatalogItem[]>([]);
  const [unlocked, setUnlocked] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserBadges()
      .then(({ catalog: c, unlocked: u }) => {
        setCatalog(c);
        setUnlocked(u);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)]"
          />
        ))}
      </div>
    );
  }

  if (catalog.length === 0) return null;

  const unlockedIds = new Set(unlocked.map((u) => u.badge_id));

  // Helper to get translated name/desc from i18n key like "Badges.firstSolve.name"
  const getBadgeText = (key: string): string => {
    try {
      // key format: "Badges.firstSolve.name" → t("firstSolve.name") under Badges namespace
      const parts = key.split(".");
      if (parts.length >= 3) {
        return t(`${parts[1]}.${parts[2]}`);
      }
      return key;
    } catch {
      // Fallback: return the key stripped of namespace
      return key.split(".").pop() || key;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {catalog.map((badge) => {
        const isUnlocked = unlockedIds.has(badge.id);
        const unlockedData = unlocked.find((u) => u.badge_id === badge.id);
        const unlockedDate = unlockedData
          ? new Date(unlockedData.unlocked_at).toLocaleDateString()
          : null;

        return (
          <div
            key={badge.id}
            className={`group relative flex flex-col items-center justify-center rounded-xl border p-4 transition-all duration-200 ${
              isUnlocked
                ? "border-[var(--color-ax-yellow)]/30 bg-[var(--color-ax-yellow)]/5 hover:border-[var(--color-ax-yellow)]/50 hover:bg-[var(--color-ax-yellow)]/10"
                : "border-[var(--color-border)] bg-[var(--color-bg0)] opacity-50 grayscale"
            }`}
            title={
              isUnlocked && unlockedDate
                ? `${getBadgeText(badge.description_key)} — ${unlockedDate}`
                : getBadgeText(badge.description_key)
            }
          >
            {/* Glow effect for unlocked badges */}
            {isUnlocked && (
              <div className="absolute inset-0 rounded-xl bg-[var(--color-ax-yellow)]/5 opacity-0 transition-opacity group-hover:opacity-100" />
            )}

            <div
              className={`relative mb-2 flex h-12 w-12 items-center justify-center rounded-full text-xl transition-transform group-hover:scale-110 ${
                isUnlocked
                  ? "bg-[var(--color-ax-yellow)]/15"
                  : "bg-[var(--color-bg2)]"
              }`}
            >
              {badge.icon}
            </div>

            <p
              className={`relative text-center text-xs font-bold ${
                isUnlocked
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-dim)]"
              }`}
            >
              {getBadgeText(badge.name_key)}
            </p>

            {isUnlocked && unlockedDate && (
              <p className="relative mt-0.5 text-center text-[9px] text-[var(--color-ax-yellow)]">
                ✓ {unlockedDate}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
