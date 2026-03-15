"use client";

import { X, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { createClass } from "@/lib/actions/organization";

interface CreateClassModalProps {
  open: boolean;
  orgId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClassModal({ open, orgId, onClose, onCreated }: CreateClassModalProps) {
  const t = useTranslations("Class");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const result = await createClass(orgId, name.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.inviteCode) {
      setInviteCode(result.inviteCode);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    setName("");
    setInviteCode("");
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("createClass")}
          </h2>
          <button onClick={handleDone} className="text-[var(--color-dim)] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {inviteCode ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("inviteCode")}:
            </p>
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <code className="flex-1 text-center font-mono text-2xl font-bold tracking-widest text-green-400">
                {inviteCode}
              </code>
              <button
                onClick={handleCopy}
                className="rounded-lg p-2 text-[var(--color-dim)] transition-colors hover:text-white"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-center text-xs text-green-400">{t("codeCopied")}</p>
            )}
            <button
              onClick={handleDone}
              className="w-full rounded-lg bg-[var(--color-ax-blue)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              OK
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                {t("className")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-2.5 text-[var(--color-text-primary)] outline-none focus:border-green-500"
                placeholder={t("className")}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : t("createClass")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
