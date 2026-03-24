"use client";

import { Building2, LogIn, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { OrgCard } from "@/components/org/org-card";
import { Link } from "@/i18n/routing";
import { getMyOrganizations } from "@/lib/actions/organization";

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

  const directOrgIds = new Set(memberships.map((m) => m.org_id));

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
              <OrgCard key={o.org_id} org={o.organizations} role={o.role} />
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
    </div>
  );
}
