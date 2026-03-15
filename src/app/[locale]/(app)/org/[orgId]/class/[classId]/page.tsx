"use client";

import { ArrowLeft, Copy, Check, RefreshCw, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, use } from "react";

import { Link } from "@/i18n/routing";
import { regenerateInviteCode } from "@/lib/actions/invite";
import { getClassDashboard } from "@/lib/actions/organization";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; classId: string }>;
}) {
  const { orgId, classId } = use(params);
  const t = useTranslations("Class");
  const [data, setData] = useState<Awaited<ReturnType<typeof getClassDashboard>>>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getClassDashboard(classId);
    setData(res);
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
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
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          📚 {data.classInfo.name}
        </h1>
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
              <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              {t("regenerateCode")}
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-xs text-green-400">{t("codeCopied")}</p>
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
            <p className="mt-2 text-sm text-[var(--color-dim)]">{t("noStudents")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.students.map((s: { user_id: string; joined_at: string }) => (
              <div
                key={s.user_id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-400">
                    {s.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-mono text-xs text-[var(--color-dim)]">
                    {s.user_id.slice(0, 8)}…
                  </span>
                </div>
                <span className="text-xs text-[var(--color-dim)]">
                  {new Date(s.joined_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
