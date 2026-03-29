"use client";

import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileDown,
  GraduationCap,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, use } from "react";

import {
  DirectorDashboard,
  SecretaryDashboard,
} from "@/components/dashboard/dashboard-views";
import { ClassCard } from "@/components/org/class-card";
import { CreateClassesBatchModal } from "@/components/org/create-class-batch-modal";
import { CreateClassModal } from "@/components/org/create-class-modal";
import { MemberList } from "@/components/org/member-list";
import { OrgRankingView } from "@/components/rankings/org-ranking-view";
import { ReportCard, type ReportItem } from "@/components/dashboard/report-card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { WelcomeBanner } from "@/components/shared/welcome-banner";
import { Link, useRouter } from "@/i18n/routing";
import { updateMemberRole } from "@/lib/actions/coordinator";
import {
  getDirectorDashboard,
  getSecretaryDashboard,
} from "@/lib/actions/dashboard";
import {
  generateInviteCode,
  getOrgInviteCodes,
  regenerateInviteCodeByType,
} from "@/lib/actions/invite-codes";
import { sendInviteEmail } from "@/lib/actions/invite-email";
import { createChildOrg } from "@/lib/actions/network";
import { getOrgDashboard } from "@/lib/actions/organization";
import { getOrgClassRanking } from "@/lib/actions/rankings";
import { exportNetworkCsv, type NetworkCsvRow } from "@/lib/export-network-csv";
import {
  exportNetworkPdf,
  type NetworkPdfData,
} from "@/lib/export-network-pdf";
import { exportSchoolCsv, type SchoolCsvRow } from "@/lib/export-school-csv";
import {
  exportSchoolPdf,
  type SchoolReportData,
} from "@/lib/export-school-pdf";
import {
  canCreateClass as canCreateClassFromRole,
  isElevated as isElevatedRole,
  canManageMembers as canManageMembersRole,
} from "@/types/roles";

export default function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const t = useTranslations("Org");
  const tc = useTranslations("Class");
  const tr = useTranslations("Rankings");
  const router = useRouter();
  const [data, setData] =
    useState<Awaited<ReturnType<typeof getOrgDashboard>>>(null);
  const [orgRanking, setOrgRanking] =
    useState<Awaited<ReturnType<typeof getOrgClassRanking>>>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashData, setDashData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [secData, setSecData] = useState<any>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [dashLoading, setDashLoading] = useState(false);
  const [secLoading, setSecLoading] = useState(false);
  const [expiresWarning, setExpiresWarning] = useState(false);
  const [expiresFormatted, setExpiresFormatted] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Teachers section state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teacherCode, setTeacherCode] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Coordinator code state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coordCode, setCoordCode] = useState<any>(null);
  const [copiedCoordCode, setCopiedCoordCode] = useState(false);
  const [copiedCoordLink, setCopiedCoordLink] = useState(false);
  const [coordCodeLoading, setCoordCodeLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  // Create child org modal state
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolMax, setNewSchoolMax] = useState("");
  const [createSchoolLoading, setCreateSchoolLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [createSchoolResult, setCreateSchoolResult] = useState<any>(null);
  const [copiedDirCode, setCopiedDirCode] = useState(false);

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

    // Pre-compute expiry display
    if (res?.org?.access_expires_at) {
      const exDate = new Date(res.org.access_expires_at);
      setExpiresWarning(exDate.getTime() < Date.now() + 30 * 86400000);
      setExpiresFormatted(exDate.toLocaleDateString("pt-BR"));
    } else {
      setExpiresWarning(false);
      setExpiresFormatted(null);
    }

    // Fetch invite codes for teachers section
    if (res && canManageMembersRole(res.myRole)) {
      const codes = await getOrgInviteCodes(orgId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prf = codes.find((c: any) => c.type === "teacher" && c.is_active);
      setTeacherCode(prf || null);
      const gre = codes.find((c: any) => c.type === "gre" && c.is_active);
      setCoordCode(gre || null);
    }

    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDirPeriodChange = async (range: {
    startDate: string;
    endDate: string;
  }) => {
    setDashLoading(true);
    const res = await getDirectorDashboard(orgId, range);
    setDashData(res);
    setDashLoading(false);
  };

  const handleSecPeriodChange = async (range: {
    startDate: string;
    endDate: string;
  }) => {
    setSecLoading(true);
    const res = await getSecretaryDashboard(orgId, range);
    setSecData(res);
    setSecLoading(false);
  };

  const handleGenerateTeacherCode = async () => {
    setCodeLoading(true);
    const result = await generateInviteCode({ type: "teacher", orgId });
    if ("code" in result) {
      const codes = await getOrgInviteCodes(orgId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prf = codes.find((c: any) => c.type === "teacher" && c.is_active);
      setTeacherCode(prf || null);
    }
    setCodeLoading(false);
  };

  const handleRegenerateCode = async () => {
    if (!teacherCode?.id) return;
    if (!confirm(t("regenerateConfirm"))) return;
    setCodeLoading(true);
    await regenerateInviteCodeByType(teacherCode.id);
    const codes = await getOrgInviteCodes(orgId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prf = codes.find((c: any) => c.type === "teacher" && c.is_active);
    setTeacherCode(prf || null);
    setCodeLoading(false);
  };

  const handleSendInviteEmail = async () => {
    if (!teacherCode?.code || !inviteEmail || !data) return;
    setSendingEmail(true);
    const result = await sendInviteEmail({
      email: inviteEmail,
      code: teacherCode.code,
      orgName: data.org.name || "Axiom",
      senderName: "Equipe", // Could be fetched but we use dummy or localized text
    });
    setSendingEmail(false);
    if ("success" in result) {
      alert(t("inviteSent", { fallback: "Convite enviado com sucesso!" }));
      setInviteEmail("");
    } else {
      alert(t("inviteError", { fallback: "Erro ao enviar convite." }));
    }
  };

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

  const canManage = canCreateClassFromRole(data.myRole);
  const isElevated = isElevatedRole(data.myRole);
  const canMembers = canManageMembersRole(data.myRole);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teachers = data.members.filter(
    (m: any) => m.role === "teacher" || m.role === "coordinator"
  );

  return (
    <div className="space-y-8">
      <WelcomeBanner orgId={orgId} role={data.myRole} />
      {/* Header */}
      <div>
        <Link
          href="/org"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--color-dim)] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        {/* Breadcrumb: Parent > Current */}
        {data.parentName && data.org.parent_id && (
          <Breadcrumb
            items={[
              ...(data.isInherited
                ? [{ label: data.parentName, href: `/org/${data.org.parent_id}` }]
                : [{ label: data.parentName }]),
              { label: data.org.name },
            ]}
          />
        )}
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {data.org.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-dim)]">
          {t(
            `type${data.org.type
              .split("_")
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join("")}` as
              | "typeSchool"
              | "typeNetwork"
              | "typeState"
              | "typePrivateSchool"
              | "typePrivateNetwork"
              | "typePublicMunicipal"
              | "typePublicState"
          )}
          {" · "}
          {t(
            `role${data.myRole.charAt(0).toUpperCase() + data.myRole.slice(1)}` as
              | "roleStudent"
              | "roleTeacher"
              | "roleCoordinator"
              | "roleAdmin"
              | "roleDirector"
              | "roleOwner"
              | "roleSecretary"
          )}
        </p>

        {/* Capacity + Expiry indicators (elevated roles only) */}
        {isElevated && data.org.max_students != null && (
          <div className="mt-2 flex items-center gap-2">
            <Users
              className="h-4 w-4"
              style={{
                color:
                  data.studentCount >= data.org.max_students
                    ? "#ef4444"
                    : data.studentCount >= data.org.max_students * 0.8
                      ? "#f59e0b"
                      : "#22c55e",
              }}
            />
            <span
              className="text-sm font-medium"
              style={{
                color:
                  data.studentCount >= data.org.max_students
                    ? "#ef4444"
                    : data.studentCount >= data.org.max_students * 0.8
                      ? "#f59e0b"
                      : "#94a3b8",
              }}
            >
              {t("students")}: {data.studentCount}/{data.org.max_students}
            </span>
            {data.studentCount >= data.org.max_students && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: "#450a0a", color: "#f87171" }}
              >
                {t("limitReached")}
              </span>
            )}
            {data.studentCount >= data.org.max_students * 0.8 &&
              data.studentCount < data.org.max_students && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "#422006", color: "#fbbf24" }}
                >
                  {t("nearLimit")}
                </span>
              )}
          </div>
        )}
        {isElevated && expiresFormatted && (
          <div
            className="mt-1 flex items-center gap-2 text-sm"
            style={{ color: expiresWarning ? "#f59e0b" : "#64748b" }}
          >
            <span>
              ⏱ {t("expiresAt")}: {expiresFormatted}
            </span>
          </div>
        )}
      </div>

      {/* Classes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {tc("classes")} ({data.classes.length})
            </h2>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              {isElevated && (
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg1)]"
                >
                  <Plus className="h-4 w-4" />
                  {t("batch.title", { fallback: "Criar em Lote" })}
                </button>
              )}
              <button
                onClick={() => setShowClassModal(true)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {tc("createClass")}
              </button>
            </div>
          )}
        </div>
        {data.classes.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--color-dim)]" />
            <p className="mt-2 text-sm text-[var(--color-dim)]">
              No classes yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.classes.map(
              (cls: {
                id: string;
                name: string;
                invite_code: string;
                teacher_id: string;
              }) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  orgId={orgId}
                  showCode={canManage}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* ── Teachers Section (member managers only — not coordinator) ── */}
      {canMembers && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t("teachersTitle")} ({teachers.length})
            </h2>
          </div>

          {/* Teacher Code Card */}
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/5 p-5">
            {teacherCode ? (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wider text-green-400/70 uppercase">
                  {t("teacherCode")}
                </p>
                <div className="flex items-center gap-3">
                  <code className="rounded-lg bg-[var(--color-bg2)] px-4 py-2 font-mono text-xl font-bold tracking-widest text-[var(--color-ax-yellow)]">
                    {teacherCode.code}
                  </code>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(teacherCode.code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="rounded-lg bg-[var(--color-bg2)] p-2 text-[var(--color-dim)] hover:text-white"
                    title={t("copyCode")}
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `https://axiom-solver.com/join?code=${teacherCode.code}`
                      );
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="rounded-lg bg-[var(--color-bg2)] p-2 text-[var(--color-dim)] hover:text-white"
                    title={t("copyLink")}
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleRegenerateCode}
                    disabled={codeLoading}
                    className="rounded-lg bg-[var(--color-bg2)] p-2 text-[var(--color-dim)] hover:text-white disabled:opacity-50"
                    title={t("regenerateCode")}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${codeLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>

                {/* Send by email */}
                <div className="mt-4 flex max-w-sm items-center gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t("inviteEmailPlaceholder", {
                      fallback: "Email do professor...",
                    })}
                    className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-green-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendInviteEmail}
                    disabled={sendingEmail || !inviteEmail}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {sendingEmail
                      ? t("sendingEmail", { fallback: "Enviando..." })
                      : t("sendEmail", { fallback: "Enviar" })}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleGenerateTeacherCode}
                  disabled={codeLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {t("generateTeacherCode")}
                </button>
              </div>
            )}
          </div>

          {/* Coordinator Code Card */}
          <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            {coordCode ? (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wider text-cyan-400/70 uppercase">
                  {t("coordinatorCode")}
                </p>
                <div className="flex items-center gap-3">
                  <code className="rounded-lg bg-[var(--color-bg2)] px-4 py-2 font-mono text-xl font-bold tracking-widest text-cyan-400">
                    {coordCode.code}
                  </code>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(coordCode.code);
                      setCopiedCoordCode(true);
                      setTimeout(() => setCopiedCoordCode(false), 2000);
                    }}
                    className="rounded-lg bg-[var(--color-bg2)] p-2 text-[var(--color-dim)] hover:text-white"
                    title={t("copyCode")}
                  >
                    {copiedCoordCode ? (
                      <Check className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `https://axiom-solver.com/join?code=${coordCode.code}`
                      );
                      setCopiedCoordLink(true);
                      setTimeout(() => setCopiedCoordLink(false), 2000);
                    }}
                    className="rounded-lg bg-[var(--color-bg2)] p-2 text-[var(--color-dim)] hover:text-white"
                    title={t("copyLink")}
                  >
                    {copiedCoordLink ? (
                      <Check className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[var(--color-dim)]">
                  {t("coordinatorCodeInfo")}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={async () => {
                    setCoordCodeLoading(true);
                    const result = await generateInviteCode({
                      type: "gre",
                      orgId,
                    });
                    if ("code" in result) {
                      const codes = await getOrgInviteCodes(orgId);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const gre = codes.find(
                        (c: any) => c.type === "gre" && c.is_active
                      );
                      setCoordCode(gre || null);
                    }
                    setCoordCodeLoading(false);
                  }}
                  disabled={coordCodeLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {t("generateCoordinatorCode")}
                </button>
              </div>
            )}
          </div>

          {/* Teacher List */}
          {teachers.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-8 text-center">
              <GraduationCap className="mx-auto h-8 w-8 text-[var(--color-dim)]" />
              <p className="mt-2 text-sm text-[var(--color-dim)]">
                {t("noTeachers")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {teachers.map((m: any) => {
                const name =
                  m.profiles?.full_name ||
                  m.profiles?.email?.split("@")[0] ||
                  "User";
                const subjects: string[] = m.subjects || [];
                return (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {m.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.profiles.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15 text-xs font-bold text-green-400">
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {name}
                        </span>
                        {m.profiles?.email && (
                          <p className="text-xs text-[var(--color-dim)]">
                            {m.profiles.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {subjects.slice(0, 3).map((s: string) => (
                            <span
                              key={s}
                              className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs text-green-400"
                            >
                              {s}
                            </span>
                          ))}
                          {subjects.length > 3 && (
                            <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-dim)]">
                              +{subjects.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {/* Role badge */}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                            m.role === "coordinator"
                              ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                              : "border-green-500/20 bg-green-500/10 text-green-400"
                          }`}
                        >
                          {m.role === "coordinator"
                            ? t("roleCoordinator")
                            : t("roleTeacher")}
                        </span>
                        {/* Promote/Demote */}
                        <button
                          onClick={async () => {
                            const newRole =
                              m.role === "teacher" ? "coordinator" : "teacher";
                            const action =
                              m.role === "teacher"
                                ? t("promoteToCoordinator")
                                : t("demoteToTeacher");
                            if (!confirm(`${action}: ${name}?`)) return;
                            setRoleUpdating(m.user_id);
                            const result = await updateMemberRole({
                              orgId,
                              userId: m.user_id,
                              newRole: newRole as "teacher" | "coordinator",
                            });
                            setRoleUpdating(null);
                            if ("success" in result) {
                              fetchData();
                            } else {
                              alert(result.error);
                            }
                          }}
                          disabled={roleUpdating === m.user_id}
                          className="rounded p-1 text-[var(--color-dim)] hover:text-cyan-400 disabled:opacity-50"
                          title={
                            m.role === "teacher"
                              ? t("promoteToCoordinator")
                              : t("demoteToTeacher")
                          }
                        >
                          <UserCog
                            className={`h-3.5 w-3.5 ${roleUpdating === m.user_id ? "animate-spin" : ""}`}
                          />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(t("removeConfirm"))) return;
                            const { supabaseAdmin } =
                              await import("@/lib/supabase/admin");
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (supabaseAdmin.from("org_memberships") as any)
                              .delete()
                              .eq("user_id", m.user_id)
                              .eq("org_id", orgId);
                            fetchData();
                          }}
                          className="rounded p-1 text-[var(--color-dim)] hover:text-red-400"
                          title={t("removeTeacher")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dashboard (directors/admins/secretaries/coordinators) */}
      {isElevated && (dashData || secData) && (
        <div>
          {/* Report Card — large export buttons + print */}
          <div className="mb-4">
            <ReportCard
              title={t("reports")}
              reports={(() => {
                const items: ReportItem[] = [];
                // School exports
                if (dashData && !dashData.empty) {
                  items.push({
                    label: t("schoolPdfReport"),
                    description: t("schoolPdfDesc"),
                    icon: "pdf",
                    onClick: () => {
                      const reportData: SchoolReportData = {
                        schoolName: data?.org?.name || "",
                        period: "Ultimos 30 dias",
                        generatedBy: "Axiom",
                        totalStudents: dashData.totalStudents || 0,
                        activeStudents: dashData.active7d || 0,
                        totalSolved: dashData.totalSolved || 0,
                        overallAccuracy: dashData.overallAccuracy || 0,
                        avgStreak: dashData.avgStreak || 0,
                        adoption: dashData.adoption || 0,
                        classComparison: dashData.classComparison || [],
                        weeklyEvolution: dashData.weeklyEvolution || [],
                        engagementAlerts: dashData.engagementAlerts || [],
                        managers:
                          data?.members
                            ?.filter((m: { role: string }) =>
                              [
                                "teacher",
                                "coordinator",
                                "admin",
                                "director",
                                "owner",
                                "secretary",
                              ].includes(m.role)
                            )
                            .map(
                              (m: {
                                role: string;
                                profiles?: {
                                  full_name?: string;
                                  email?: string;
                                };
                              }) => ({
                                name:
                                  m.profiles?.full_name ||
                                  m.profiles?.email?.split("@")[0] ||
                                  "User",
                                role: m.role,
                                email: m.profiles?.email || "",
                              })
                            ) || [],
                      };
                      exportSchoolPdf(reportData);
                    },
                  });
                  items.push({
                    label: t("schoolSpreadsheet"),
                    description: t("schoolSpreadsheetDesc"),
                    icon: "spreadsheet",
                    onClick: () => {
                      const rows: SchoolCsvRow[] = (
                        dashData.classComparison || []
                      ).map(
                        (cls: {
                          className: string;
                          students: number;
                          avgAccuracy: number;
                          avgSolved: number;
                          active7d: number;
                          adoption: number;
                        }) => ({
                          className: cls.className || "",
                          teacherName: "",
                          studentName: "",
                          studentEmail: "",
                          exercises: cls.avgSolved || 0,
                          accuracy: cls.avgAccuracy || 0,
                          streak: 0,
                          lastActive: "",
                        })
                      );
                      exportSchoolCsv(rows, data?.org?.name || "escola");
                    },
                  });
                }
                // Network exports
                if (secData && !secData.empty) {
                  items.push({
                    label: t("networkPdfReport"),
                    description: t("networkPdfDesc"),
                    icon: "pdf",
                    onClick: () => {
                      const pdfData: NetworkPdfData = {
                        networkName: data?.org?.name || "",
                        schoolCount: secData.schoolCount || 0,
                        kpis: secData.kpis || {
                          totalStudents: 0,
                          activeStudents: 0,
                          totalTeachers: 0,
                          totalClasses: 0,
                          avgAccuracy: 0,
                          totalExercises: 0,
                          avgStreak: 0,
                          adoption: 0,
                        },
                        schoolComparison: (
                          secData.schoolComparison || []
                        ).map(
                          (s: {
                            orgName: string;
                            students: number;
                            active7d: number;
                            teachers: number;
                            classes: number;
                            avgAccuracy: number;
                            adoption: number;
                            avgStreak: number;
                            score: number;
                            status: string;
                          }) => ({
                            orgName: s.orgName,
                            students: s.students,
                            active7d: s.active7d,
                            teachers: s.teachers,
                            classes: s.classes,
                            avgAccuracy: s.avgAccuracy,
                            adoption: s.adoption,
                            avgStreak: s.avgStreak,
                            score: s.score,
                            status: s.status,
                          })
                        ),
                        alerts: secData.alerts || [],
                        weeklyEvolution: secData.weeklyEvolution || [],
                        period: "Ultimos 30 dias",
                      };
                      exportNetworkPdf(pdfData);
                    },
                  });
                  items.push({
                    label: t("networkSpreadsheet"),
                    description: t("networkSpreadsheetDesc"),
                    icon: "spreadsheet",
                    onClick: () => {
                      const rows: NetworkCsvRow[] = (
                        secData.schoolComparison || []
                      ).map(
                        (s: {
                          orgName: string;
                          students: number;
                          active7d: number;
                          teachers: number;
                          classes: number;
                          avgAccuracy: number;
                          adoption: number;
                          avgStreak: number;
                          score: number;
                          status: string;
                        }) => ({
                          schoolName: s.orgName,
                          students: s.students,
                          active7d: s.active7d,
                          teachers: s.teachers,
                          classes: s.classes,
                          avgAccuracy: s.avgAccuracy,
                          adoption: s.adoption,
                          avgStreak: s.avgStreak,
                          score: s.score,
                          status: s.status,
                        })
                      );
                      exportNetworkCsv(rows, data?.org?.name || "rede");
                    },
                  });
                }
                // Print — always available
                items.push({
                  label: t("printDashboard"),
                  description: t("printDashboardDesc"),
                  icon: "print",
                  onClick: () => window.print(),
                });
                return items;
              })()}
            />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Dashboard
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="text-xs text-[var(--color-dim)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                {showDashboard ? tr("hide") : tr("show")}
              </button>
            </div>
          </div>
          {showDashboard && (
            <>
              {dashData && (
                <DirectorDashboard
                  data={dashData}
                  onDrillDown={(classId) =>
                    router.push(`/org/${orgId}/class/${classId}`)
                  }
                  onPeriodChange={handleDirPeriodChange}
                  loading={dashLoading}
                  title={data?.org?.name}
                />
              )}
              {secData && (
                <SecretaryDashboard
                  data={secData}
                  onDrillDown={(id) => router.push(`/org/${id}`)}
                  onPeriodChange={handleSecPeriodChange}
                  loading={secLoading}
                  title={data?.org?.name}
                />
              )}
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
      {(data.childOrgs?.length > 0 ||
        (canMembers &&
          [
            "network",
            "private_network",
            "public_municipal",
            "public_state",
            "state",
          ].includes(data.org?.type))) && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t("childOrgs")} ({data.childOrgs?.length || 0})
              </h2>
            </div>
            {canMembers && (
              <button
                onClick={() => {
                  setShowCreateSchool(true);
                  setCreateSchoolResult(null);
                  setNewSchoolName("");
                  setNewSchoolMax("");
                }}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />+ Nova Escola
              </button>
            )}
          </div>
          {data.childOrgs && data.childOrgs.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.childOrgs.map(
                (child: { id: string; name: string; type: string }) => (
                  <Link key={child.id} href={`/org/${child.id}`}>
                    <div className="group cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] p-4 transition-all hover:border-[var(--color-ax-blue)]/30">
                      <div className="flex items-center gap-2">
                        <Building2
                          className={`h-4 w-4 ${child.type === "school" || child.type === "private_school" ? "text-blue-400" : child.type === "network" || child.type === "private_network" ? "text-purple-400" : "text-orange-400"}`}
                        />
                        <span className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-ax-blue)]">
                          {child.name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-dim)]">
                        {t(
                          `type${child.type
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
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
          {(!data.childOrgs || data.childOrgs.length === 0) && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-10 text-center">
              <Building2 className="mx-auto h-8 w-8 text-[var(--color-dim)]" />
              <p className="mt-2 text-sm text-[var(--color-dim)]">
                Nenhuma escola vinculada. Clique &ldquo;+ Nova Escola&rdquo;
                para criar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create School Modal */}
      {showCreateSchool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowCreateSchool(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {createSchoolResult && "orgId" in createSchoolResult ? (
              <div className="text-center">
                <Check className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-3 text-lg font-bold text-[var(--color-text-primary)]">
                  Escola criada!
                </h3>
                <p className="mt-2 text-sm text-[var(--color-dim)]">
                  Código do Diretor:
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <code className="rounded-lg bg-[var(--color-bg1)] px-4 py-2 font-mono text-xl font-bold tracking-widest text-[var(--color-ax-yellow)]">
                    {createSchoolResult.directorCode}
                  </code>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        createSchoolResult.directorCode
                      );
                      setCopiedDirCode(true);
                      setTimeout(() => setCopiedDirCode(false), 2000);
                    }}
                    className="rounded-lg bg-[var(--color-bg1)] p-2 text-[var(--color-dim)] hover:text-white"
                  >
                    {copiedDirCode ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-3 text-xs text-[var(--color-dim)]">
                  Envie este código para o diretor da escola se vincular.
                </p>
                <button
                  onClick={() => {
                    setShowCreateSchool(false);
                    fetchData();
                  }}
                  className="mt-4 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Criar Nova Escola
                </h3>
                <p className="mt-1 text-sm text-[var(--color-dim)]">
                  A escola será vinculada à rede {data.org?.name}.
                </p>
                {createSchoolResult && "error" in createSchoolResult && (
                  <p className="mt-2 text-sm text-red-400">
                    {createSchoolResult.error}
                  </p>
                )}
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="Nome da escola"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-dim)] focus:border-orange-500 focus:outline-none"
                    autoFocus
                  />
                  <input
                    type="number"
                    value={newSchoolMax}
                    onChange={(e) => setNewSchoolMax(e.target.value)}
                    placeholder="Limite de alunos (opcional)"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-dim)] focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowCreateSchool(false)}
                    className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-dim)] hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!newSchoolName.trim()) return;
                      setCreateSchoolLoading(true);
                      const result = await createChildOrg({
                        parentOrgId: orgId,
                        name: newSchoolName.trim(),
                        maxStudents: newSchoolMax
                          ? parseInt(newSchoolMax)
                          : undefined,
                      });
                      setCreateSchoolResult(result);
                      setCreateSchoolLoading(false);
                    }}
                    disabled={createSchoolLoading || !newSchoolName.trim()}
                    className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {createSchoolLoading ? "Criando..." : "Criar Escola"}
                  </button>
                </div>
              </>
            )}
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

      <CreateClassesBatchModal
        orgId={orgId}
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onCreated={fetchData}
        t={t}
      />
    </div>
  );
}
