"use client";

import { useState } from "react";

import { Link } from "@/i18n/routing";

/**
 * LGPD/GDPR cookie consent banner.
 * Stores consent in localStorage. Only shows once.
 */
export function CookieConsent() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("cookie-consent");
  });

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-50 p-4 md:p-6"
      style={{ animation: "cookieSlide 0.3s ease-out both" }}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-5 shadow-2xl sm:flex-row sm:items-center">
        <div className="flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            We use essential cookies for authentication and analytics to improve
            your experience. By continuing, you agree to our{" "}
            <Link href="/privacy" className="text-orange-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={decline}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-2 text-xs font-bold text-[var(--color-dim)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-orange-400"
          >
            Accept
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
