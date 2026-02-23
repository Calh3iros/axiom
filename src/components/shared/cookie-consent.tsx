'use client';

import { useState, useEffect } from 'react';

/**
 * LGPD/GDPR cookie consent banner.
 * Stores consent in localStorage. Only shows once.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{ animation: 'cookieSlide 0.3s ease-out both' }}
    >
      <div className="max-w-2xl mx-auto bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            We use essential cookies for authentication and analytics to improve your experience.
            By continuing, you agree to our{' '}
            <a href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--color-bg2)] border border-[var(--color-border)] text-[var(--color-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
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
