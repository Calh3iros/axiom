"use client";

import { LogIn, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/routing";
import { joinByInviteCode } from "@/lib/actions/invite";

export default function JoinPage() {
  const t = useTranslations("Join");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    const result = await joinByInviteCode(code.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.className || t("success"));
      setTimeout(() => router.push("/org"), 1500);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <LogIn className="mx-auto h-10 w-10 text-[var(--color-ax-blue)]" />
          <h1 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
            {t("title")}
          </h1>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase())}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-3 text-center font-mono text-lg tracking-widest text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ax-blue)]"
            placeholder={t("placeholder")}
            maxLength={12}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {t("error")}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2.5 text-sm text-green-400">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {t("success")} — {success}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || !code.trim() || !!success}
            className="w-full rounded-lg bg-[var(--color-ax-blue)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("joining") : t("submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
