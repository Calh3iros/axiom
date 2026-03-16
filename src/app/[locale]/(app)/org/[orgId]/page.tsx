"use client";

import { ArrowLeft, Plus, Users, BookOpen, Building2, Trophy, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, use } from "react";

import { DirectorDashboard, SecretaryDashboard } from "@/components/dashboard/dashboard-views";
import { ClassCard } from "@/components/org/class-card";
import { CreateClassModal } from "@/components/org/create-class-modal";
import { MemberList } from "@/components/org/member-list";
import { OrgRankingView } from "@/components/rankings/org-ranking-view";
import { Link, useRouter } from "@/i18n/routing";
import { getDirectorDashboard, getSecretaryDashboard } from "@/lib/actions/dashboard";
import { getOrgDashboard } from "@/lib/actions/organization";
import { getOrgClassRanking } from "@/lib/actions/rankings";

export default function OrgDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const t = useTranslations("Org");
  const tc = useTranslations("Class");
  const tr = useTranslations("Rankings");
  const router = useRouter();
  const [data, setData] = useState<Awaited<ReturnType<typeof getOrgDashboard>>>(null);
  const [orgRanking, setOrgRanking] = useState<Awaited<ReturnType<typeof getOrgClassRanking>>>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashData, setDashData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [secData, setSecData] = useState<any>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [res, rankRes, dirRes, secRes] = await Promise.all([
      getOrgDashboard(orgId),
      getOrgClassRanking(orgId),
      getDirectorDashboard(orgId),
      getSecretaryDashboard(orgId),
    ]);
    setData(res);
    setOrgRanking(rankRes);
    setDashData(dirRes);
    setSecData(secRes);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-ax-blue)] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-[var(--color-dim)]">
        Not found or not authorized.
      </div>
    );
  }

  const canManage = ["teacher", "admin", "director"].includes(data.myRole);
  const isElevated = ["admin", "director", "secretary"].includes(data.myRole);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/org"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--color-dim)] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {data.org.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-dim)]">
          {t(`type${data.org.type.charAt(0).toUpperCase() + data.org.type.slice(1)}` as "typeSchool" | "typeNetwork" | "typeState")}
          {" · "}
          {t(`role${data.myRole.charAt(0).toUpperCase() + data.myRole.slice(1)}` as "roleStudent" | "roleTeacher" | "roleAdmin" | "roleDirector" | "roleSecretary")}
        </p>
      </div>

      {/* Classes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {tc("title")}s ({data.classes.length})
            </h2>
          </div>
          {canManage && (
            <button
              onClick={() => setShowClassModal(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {tc("createClass")}
            </button>
          )}
        </div>
        {data.classes.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--color-dim)]" />
            <p className="mt-2 text-sm text-[var(--color-dim)]">No classes yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.classes.map((cls: { id: string; name: string; invite_code: string; teacher_id: string }) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                orgId={orgId}
                showCode={canManage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dashboard (directors/admins/secretaries) */}
      {isElevated && (dashData || secData) && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Dashboard
              </h2>
            </div>
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="text-xs text-[var(--color-dim)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {showDashboard ? tr("hide") : tr("show")}
            </button>
          </div>
          {showDashboard && (
            <>
              {dashData && <DirectorDashboard data={dashData} onDrillDown={(classId) => router.push(`/org/${orgId}/class/${classId}`)} />}
              {secData && <SecretaryDashboard data={secData} onDrillDown={(id) => router.push(`/org/${id}`)} />}
            </>
          )}
        </div>
      )}

      {/* Org Ranking (director/admin/secretary only) */}
      {isElevated && orgRanking && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {tr("orgRanking")}
            </h2>
          </div>
          <OrgRankingView
            classRows={orgRanking.rows}
            orgId={orgId}
            childOrgRows={orgRanking.childOrgRows}
          />
        </div>
      )}
      {/* Child Orgs (hierarchy) */}
      {data.childOrgs && data.childOrgs.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t("childOrgs")} ({data.childOrgs.length})
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.childOrgs.map((child: { id: string; name: string; type: string }) => (
              <Link key={child.id} href={`/org/${child.id}`}>
                <div className="group cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] p-4 transition-all hover:border-[var(--color-ax-blue)]/30">
                  <div className="flex items-center gap-2">
                    <Building2 className={`h-4 w-4 ${child.type === 'school' ? 'text-blue-400' : child.type === 'network' ? 'text-purple-400' : 'text-orange-400'}`} />
                    <span className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-ax-blue)]">
                      {child.name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-dim)]">
                    {t(`type${child.type.charAt(0).toUpperCase() + child.type.slice(1)}` as "typeSchool" | "typeNetwork" | "typeState")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t("members")} ({data.members.length})
          </h2>
        </div>
        <MemberList members={data.members} />
      </div>

      <CreateClassModal
        open={showClassModal}
        orgId={orgId}
        onClose={() => setShowClassModal(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
