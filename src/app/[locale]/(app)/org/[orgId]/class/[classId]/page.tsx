"use client";

import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Users,
  Trophy,
  BarChart3,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, use, useRef } from "react";

import { TeacherDashboard } from "@/components/dashboard/dashboard-views";
import { ClassRankingTable } from "@/components/rankings/class-ranking-table";
import { StudentReportModal } from "@/components/report/student-report-modal";
import { Link } from "@/i18n/routing";
import { getTeacherDashboard } from "@/lib/actions/dashboard";
import { regenerateInviteCode } from "@/lib/actions/invite";
import { getClassDashboard } from "@/lib/actions/organization";
import { getClassRanking } from "@/lib/actions/rankings";
import { getStudentReport, type StudentReport } from "@/lib/actions/report";
import { exportStudentPdf, exportClassPdf } from "@/lib/export-student-pdf";
import { createClient } from "@/lib/supabase/client";
import { isElevated } from "@/types/roles";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Student {
  user_id: string;
  joined_at: string;
  profiles?: ProfileData;
}

function getDisplayName(s: Student): string {
  if (s.profiles?.full_name) return s.profiles.full_name;
  if (s.profiles?.email) return s.profiles.email.split("@")[0];
  return "User";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; classId: string }>;
}) {
  const { orgId, classId } = use(params);
  const t = useTranslations("Class");
  const tr = useTranslations("Rankings");
  const [data, setData] =
    useState<Awaited<ReturnType<typeof getClassDashboard>>>(null);
  const [ranking, setRanking] =
    useState<Awaited<ReturnType<typeof getClassRanking>>>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashData, setDashData] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRanking, setShowRanking] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [reportModal, setReportModal] = useState<StudentReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDropdown, setReportDropdown] = useState(false);
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tReport = useTranslations("Report");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [res, rankRes, dashRes] = await Promise.all([
      getClassDashboard(classId),
      getClassRanking(classId),
      getTeacherDashboard(classId),
    ]);
    setData(res);
    setRanking(rankRes);
    setDashData(dashRes);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    setLoading(false);
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = async (range: {
    startDate: string;
    endDate: string;
  }) => {
    setDashLoading(true);
    const res = await getTeacherDashboard(classId, range);
    setDashData(res);
    setDashLoading(false);
  };

  const handleCopy = async () => {
    if (!data?.classInfo.invite_code) return;
    await navigator.clipboard.writeText(data.classInfo.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const result = await regenerateInviteCode(classId);
    if (result.inviteCode) {
      await fetchData();
    }
    setRegenerating(false);
  };

  const handleStudentClick = async (userId: string) => {
    setReportLoading(true);
    const report = await getStudentReport(userId, classId);
    setReportLoading(false);
    if (report) setReportModal(report);
  };

  const handleExportPdf = async (report: StudentReport) => {
    await exportStudentPdf(report);
  };

  const handleBulkExport = async () => {
    if (!ranking?.rows) return;
    setGeneratingBulk(true);
    setReportDropdown(false);
    const reports: StudentReport[] = [];
    for (const row of ranking.rows) {
      const r = await getStudentReport(row.user_id, classId);
      if (r) reports.push(r);
    }
    if (reports.length > 0) {
      await exportClassPdf(reports, data?.classInfo?.name || "classe");
    }
    setGeneratingBulk(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
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

  const isManager = ranking?.role ? isElevated(ranking.role) : data.isTeacher;

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link
            href={`/org/${orgId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--color-dim)] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              📚 {data.classInfo.name}
            </h1>
            {/* Report generate dropdown */}
            {isManager && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setReportDropdown(!reportDropdown)}
                  disabled={generatingBulk}
                  className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  {generatingBulk
                    ? tReport("generatingPdf")
                    : tReport("generateReports")}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {reportDropdown && (
                  <div className="absolute top-full right-0 z-20 mt-1 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] p-1 shadow-xl">
                    <button
                      onClick={handleBulkExport}
                      className="w-full rounded px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg2)]"
                    >
                      📄 {tReport("fullClass")}
                    </button>
                    <p className="px-3 py-1.5 text-[10px] text-[var(--color-dim)]">
                      {tReport("individualStudent")}: click name in ranking
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invite Code */}
        {data.isTeacher && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
            <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
              {t("inviteCode")}
            </p>
            <div className="flex items-center gap-4">
              <code className="font-mono text-3xl font-bold tracking-widest text-green-400">
                {data.classInfo.invite_code}
              </code>
              <button
                onClick={handleCopy}
                className="rounded-lg border border-[var(--color-border)] p-2.5 text-[var(--color-dim)] transition-colors hover:text-white"
                title={t("copyCode")}
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-dim)] transition-colors hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
                />
                {t("regenerateCode")}
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-xs text-green-400">{t("codeCopied")}</p>
            )}
          </div>
        )}

        {/* Dashboard (managers only) */}
        {isManager && dashData && (
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
                className="text-xs text-[var(--color-dim)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                {showDashboard ? tr("hide") : tr("show")}
              </button>
            </div>
            {showDashboard && (
              <TeacherDashboard
                data={dashData}
                onPeriodChange={handlePeriodChange}
                loading={dashLoading}
                title={data?.classInfo?.name}
              />
            )}
          </div>
        )}

        {/* Ranking */}
        {ranking && ranking.rows.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {tr("classRanking")}
                </h2>
              </div>
              <button
                onClick={() => setShowRanking(!showRanking)}
                className="text-xs text-[var(--color-dim)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                {showRanking ? tr("hide") : tr("show")}
              </button>
            </div>
            {showRanking && (
              <ClassRankingTable
                rows={ranking.rows}
                currentUserId={currentUserId}
                isManager={isManager}
                onStudentClick={handleStudentClick}
              />
            )}
          </div>
        )}

        {/* Students */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t("students")} ({data.students.length})
            </h2>
          </div>
          {data.students.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-[var(--color-dim)]" />
              <p className="mt-2 text-sm text-[var(--color-dim)]">
                {t("noStudents")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.students.map((s: Student) => {
                const name = getDisplayName(s);
                const avatarUrl = s.profiles?.avatar_url;

                return (
                  <div
                    key={s.user_id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-400">
                          {getInitials(name)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {name}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-dim)]">
                      {new Date(s.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Report loading overlay */}
      {reportLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--color-bg1)] px-6 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <span className="text-sm text-[var(--color-text-primary)]">
              {tReport("generatingPdf")}
            </span>
          </div>
        </div>
      )}

      {/* Student report modal */}
      {reportModal && (
        <StudentReportModal
          report={reportModal}
          onClose={() => setReportModal(null)}
          onExportPdf={handleExportPdf}
        />
      )}
    </>
  );
}
