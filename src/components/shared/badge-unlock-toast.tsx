"use client";

import { useEffect, useState } from "react";

type BadgeToastProps = {
  badgeIcon: string;
  badgeName: string;
  onClose: () => void;
};

export function BadgeUnlockToast({
  badgeIcon,
  badgeName,
  onClose,
}: BadgeToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const showTimer = setTimeout(() => setVisible(true), 100);
    // Auto-dismiss after 5 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for animation then remove
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed right-4 top-4 z-[9999] flex items-center gap-3 rounded-xl border border-[var(--color-ax-yellow)]/30 bg-[var(--color-bg1)] px-5 py-3 shadow-lg shadow-[var(--color-ax-yellow)]/10 transition-all duration-300 ${
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-ax-yellow)]/15 text-xl">
        {badgeIcon}
      </div>
      <div>
        <p className="text-[10px] font-bold tracking-wider text-[var(--color-ax-yellow)] uppercase">
          🏆 Badge Unlocked!
        </p>
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          {badgeName}
        </p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-[var(--color-dim)] hover:text-[var(--color-text-primary)]"
      >
        ✕
      </button>
    </div>
  );
}
