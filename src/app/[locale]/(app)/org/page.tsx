"use client";

import { Building2, Plus, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { CreateOrgModal } from "@/components/org/create-org-modal";
import { OrgCard } from "@/components/org/org-card";
import { Link } from "@/i18n/routing";
import { getMyOrganizations } from "@/lib/actions/organization";

export default function OrgListPage() {
  const t = useTranslations("Org");
  const [orgs, setOrgs] = useState<
    { role: string; org_id: string; organizations: { id: string; name: string; type: string; created_at: string } }[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const data = await getMyOrganizations();
    setOrgs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-[var(--color-ax-blue)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("title")}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/join"
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)]"
          >
            <LogIn className="h-4 w-4" />
            Join
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-ax-blue)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t("createOrg")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-ax-blue)] border-t-transparent" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-[var(--color-dim)]" />
          <p className="mt-4 text-[var(--color-text-secondary)]">{t("noOrgs")}</p>
          <p className="mt-1 text-sm text-[var(--color-dim)]">{t("joinHint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orgs.map((o) => (
            <OrgCard
              key={o.org_id}
              org={o.organizations}
              role={o.role}
            />
          ))}
        </div>
      )}

      <CreateOrgModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchOrgs}
      />
    </div>
  );
}
