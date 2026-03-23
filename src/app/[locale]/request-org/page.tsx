"use client";

import { Building2, Send, Loader2, Check, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/routing";
import { requestOrganization } from "@/lib/actions/organization";
import { type OrgType } from "@/types/roles";

export default function RequestOrgPage() {
  const t = useTranslations("RequestOrg");

  const [form, setForm] = useState({
    name: "",
    type: "school" as OrgType,
    institution_id: "",
    requested_by_name: "",
    requested_by_role: "",
    requested_by_email: "",
    requested_by_phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestOrganization(form);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg0)] p-6">
        <div className="w-full max-w-lg rounded-2xl border border-green-500/20 bg-[var(--color-bg1)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            {t("successTitle")}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {t("successDesc")}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-ax-blue)] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg0)] p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-ax-blue)]/20 bg-[var(--color-ax-blue)]/10">
            <Building2 className="h-7 w-7 text-[var(--color-ax-blue)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6"
        >
          {/* Institution Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("institutionName")} *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all outline-none focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40"
                placeholder={t("institutionNamePlaceholder")}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("orgType")} *
              </label>
              <select
                required
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ax-blue)]/50"
              >
                <option value="school">{t("typeSchool")}</option>
                <option value="network">{t("typeNetwork")}</option>
                <option value="state">{t("typeState")}</option>
                <option value="private_school">
                  {t("typePrivateSchool" as "typeSchool")}
                </option>
                <option value="private_network">
                  {t("typePrivateNetwork" as "typeNetwork")}
                </option>
                <option value="public_municipal">
                  {t("typePublicMunicipal" as "typeState")}
                </option>
                <option value="public_state">
                  {t("typePublicState" as "typeState")}
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("institutionId")} *
              </label>
              <input
                type="text"
                required
                value={form.institution_id}
                onChange={(e) => update("institution_id", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all outline-none focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40"
                placeholder={t("institutionIdPlaceholder")}
              />
            </div>
          </div>

          {/* Requester Info */}
          <hr className="border-[var(--color-border)]" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("requesterName")} *
              </label>
              <input
                type="text"
                required
                value={form.requested_by_name}
                onChange={(e) => update("requested_by_name", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all outline-none focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("requesterRole")} *
              </label>
              <select
                required
                value={form.requested_by_role}
                onChange={(e) => update("requested_by_role", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ax-blue)]/50"
              >
                <option value="">{t("selectRole")}</option>
                <option value="director">{t("roleDirector")}</option>
                <option value="coordinator">{t("roleCoordinator")}</option>
                <option value="secretary">{t("roleSecretary")}</option>
                <option value="other">{t("roleOther")}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("requesterEmail")} *
              </label>
              <input
                type="email"
                required
                value={form.requested_by_email}
                onChange={(e) => update("requested_by_email", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all outline-none focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40"
                placeholder="email@institution.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("requesterPhone")} *
              </label>
              <input
                type="tel"
                required
                value={form.requested_by_phone}
                onChange={(e) => update("requested_by_phone", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all outline-none focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40"
                placeholder="+55 (11) 99999-9999"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("message")}
            </label>
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg0)] px-4 py-3 text-[var(--color-text-primary)] transition-all outline-none focus:border-[var(--color-ax-blue)]/50 focus:ring-2 focus:ring-[var(--color-ax-blue)]/40"
              placeholder={t("messagePlaceholder")}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ax-blue)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("submit")}
          </button>

          <p className="text-center text-xs text-[var(--color-dim)]">
            {t("disclaimer")}
          </p>
        </form>
      </div>
    </div>
  );
}
