"use client";

import { Building2, LogIn, ChevronRight, AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { OrgCard } from "@/components/org/org-card";
import { Link } from "@/i18n/routing";
import { deleteOrganization } from "@/lib/actions/admin";
import { getMyOrganizations } from "@/lib/actions/organization";
import { createClient } from "@/lib/supabase/client";

interface OrgData {
  id: string;
  name: string;
  type: string;
  parent_id?: string | null;
  created_at: string;
}

interface Membership {
  role: string;
  org_id: string;
  organizations: OrgData;
}

export default function OrgListPage() {
  const t = useTranslations("Org");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [childOrgs, setChildOrgs] = useState<OrgData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const result = await getMyOrganizations();
    if (Array.isArray(result)) {
      setMemberships(result as Membership[]);
      setChildOrgs([]);
    } else {
      setMemberships((result.memberships || []) as Membership[]);
      setChildOrgs((result.childOrgs || []) as OrgData[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  // Check if user is super_admin
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
      if ((profile as unknown as { is_super_admin?: boolean })?.is_super_admin)
        setIsSuperAdmin(true);
    })();
  }, []);

  const directOrgIds = new Set(memberships.map((m) => m.org_id));

  const handleDeleteClick = (orgId: string, orgName: string) => {
    setDeleteTarget({ id: orgId, name: orgName });
    setConfirmName("");
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || confirmName !== deleteTarget.name) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteOrganization(deleteTarget.id);
      if ("error" in result) {
        setDeleteError(result.error);
        setDeleting(false);
        return;
      }
      setDeleteTarget(null);
      setDeleting(false);
      fetchOrgs();
    } catch {
      setDeleteError("Unexpected error");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-[var(--color-ax-blue)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("title")}
          </h1>
        </div>
        <Link
          href="/join"
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)]"
        >
          <LogIn className="h-4 w-4" />
          Join
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-ax-blue)] border-t-transparent" />
        </div>
      ) : memberships.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-[var(--color-dim)]" />
          <p className="mt-4 text-[var(--color-text-secondary)]">
            {t("noOrgs")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-dim)]">
            {t("joinHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {memberships.map((o) => (
              <OrgCard
                key={o.org_id}
                org={o.organizations}
                role={o.role}
                isSuperAdmin={isSuperAdmin}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>

          {childOrgs.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
                <ChevronRight className="h-4 w-4" />
                {t("childOrgs")} ({childOrgs.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {childOrgs.map((org) => (
                  <Link key={org.id} href={`/org/${org.id}`}>
                    <div className="group cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] p-4 transition-all hover:border-[var(--color-ax-blue)]/30">
                      <div className="flex items-center gap-2">
                        <Building2
                          className={`h-4 w-4 ${org.type === "school" ? "text-blue-400" : org.type === "network" ? "text-purple-400" : "text-orange-400"}`}
                        />
                        <span className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-ax-blue)]">
                          {org.name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-dim)]">
                        {t(
                          `type${org.type
                            .split("_")
                            .map(
                              (w: string) =>
                                w.charAt(0).toUpperCase() + w.slice(1)
                            )
                            .join("")}` as
                            | "typeSchool"
                            | "typeNetwork"
                            | "typeState"
                            | "typePrivateSchool"
                            | "typePrivateNetwork"
                            | "typePublicMunicipal"
                            | "typePublicState"
                        )}
                        {directOrgIds.has(org.id)
                          ? ""
                          : ` · ${t("viaHierarchy")}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-red-500/20 bg-[var(--color-bg1)] p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-400">
                  {t("deleteOrg")}
                </h3>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg p-1 text-[var(--color-dim)] hover:bg-[var(--color-bg2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
              {t("deleteConfirm", { name: deleteTarget.name })}
            </p>
            <p className="mb-4 text-xs text-[var(--color-dim)]">
              {t("deleteWarning")}
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("typeOrgName")}
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg0)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-red-500/50 focus:outline-none"
                placeholder={deleteTarget.name}
                autoFocus
              />
            </div>

            {deleteError && (
              <p className="mb-3 text-xs text-red-400">{deleteError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={confirmName !== deleteTarget.name || deleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-40"
              >
                {deleting ? "..." : t("deletePermanently")}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
