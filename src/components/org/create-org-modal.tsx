"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { createOrganization } from "@/lib/actions/organization";

interface CreateOrgModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateOrgModal({ open, onClose, onCreated }: CreateOrgModalProps) {
  const t = useTranslations("Org");
  const [name, setName] = useState("");
  const [type, setType] = useState<"school" | "network" | "state">("school");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const result = await createOrganization(name.trim(), type);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setName("");
      onCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("createOrg")}
          </h2>
          <button onClick={onClose} className="text-[var(--color-dim)] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
              {t("orgName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-2.5 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ax-blue)]"
              placeholder={t("orgName")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
              {t("orgType")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "school" | "network" | "state")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-2.5 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ax-blue)]"
            >
              <option value="school">{t("typeSchool")}</option>
              <option value="network">{t("typeNetwork")}</option>
              <option value="state">{t("typeState")}</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)]"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-[var(--color-ax-blue)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : t("create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
