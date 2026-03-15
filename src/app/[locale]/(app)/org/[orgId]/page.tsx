"use client";

import { ArrowLeft, Plus, Users, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, use } from "react";

import { ClassCard } from "@/components/org/class-card";
import { CreateClassModal } from "@/components/org/create-class-modal";
import { MemberList } from "@/components/org/member-list";
import { Link } from "@/i18n/routing";
import { getOrgDashboard } from "@/lib/actions/organization";

export default function OrgDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const t = useTranslations("Org");
  const tc = useTranslations("Class");
  const [data, setData] = useState<Awaited<ReturnType<typeof getOrgDashboard>>>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getOrgDashboard(orgId);
    setData(res);
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
