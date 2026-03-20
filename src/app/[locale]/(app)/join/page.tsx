"use client";

import { Building2, CheckCircle, AlertCircle, GraduationCap, BookOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState, useCallback } from "react";

import { useRouter } from "@/i18n/routing";
import { joinByInviteCode } from "@/lib/actions/invite";
import { redeemInviteCode, updateMemberSubjects } from "@/lib/actions/invite-codes";

type CodeType = "secretary" | "gre" | "director" | "teacher" | "student";

function detectCodeType(code: string): CodeType | null {
  const upper = code.toUpperCase().trim();
  if (upper.startsWith("SEC-")) return "secretary";
  if (upper.startsWith("GRE-")) return "gre";
  if (upper.startsWith("DIR-")) return "director";
  if (upper.startsWith("PRF-")) return "teacher";
  if (upper.length >= 4) return "student";
  return null;
}

const SUBJECTS = [
  "Português", "Matemática", "História", "Geografia",
  "Ciências", "Física", "Química", "Biologia",
  "Inglês", "Espanhol", "Ed. Física", "Artes",
  "Filosofia", "Sociologia", "Redação", "Literatura",
  "Ensino Religioso", "Ed. Musical",
];

type Step = "input" | "subjects" | "done";

export default function JoinPage() {
  const t = useTranslations("Join");
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCode = searchParams.get("code") || "";
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("input");

  // Redeem result state
  const [resultRole, setResultRole] = useState("");
  const [resultOrgName, setResultOrgName] = useState("");
  const [resultOrgId, setResultOrgId] = useState("");
  const [resultClassName, setResultClassName] = useState("");

  // Subjects state (teacher flow)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const codeType = code.length >= 3 ? detectCodeType(code) : null;

  const getTypeLabel = useCallback(
    (type: CodeType | null): string => {
      if (!type) return t("typeEmpty");
      const labels: Record<CodeType, string> = {
        secretary: t("typeSecretary"),
        gre: t("typeGre"),
        director: t("typeDirector"),
        teacher: t("typeTeacher"),
        student: t("typeStudent"),
      };
      return labels[type];
    },
    [t]
  );

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const type = detectCodeType(code);

    if (type === "student" || type === null) {
      // Student flow (existing behavior)
      const result = await joinByInviteCode(code.trim());
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        posthog.capture("org_joined", { method: "invite_code", type: "student" });
        setResultClassName(result.className || "");
        setStep("done");
        setTimeout(() => router.push("/solve"), 2000);
      }
    } else {
      // Invite code flow (secretary/gre/director/teacher)
      const result = await redeemInviteCode({ code: code.trim() });
      setLoading(false);
      if ("error" in result) {
        setError(result.error);
      } else {
        posthog.capture("org_joined", { method: "invite_code", type });
        setResultRole(result.role);
        setResultOrgName(result.orgName);
        setResultOrgId(result.orgId);

        if (result.requiresSubjects) {
          setStep("subjects");
        } else {
          setStep("done");
        }
      }
    }
  };

  const handleConfirmSubjects = async () => {
    if (selectedSubjects.length === 0) return;
    setSubjectsLoading(true);
    const result = await updateMemberSubjects(resultOrgId, selectedSubjects);
    setSubjectsLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setStep("done");
    }
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev: string[]) =>
      prev.includes(sub)
        ? prev.filter((s: string) => s !== sub)
        : prev.length < 15
          ? [...prev, sub]
          : prev
    );
  };

  // ── INPUT STEP ──────────────────────────────────────────────
  if (step === "input") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[var(--color-ax-blue)]" />
            <h1 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {t("subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-3 text-center font-mono text-lg tracking-widest text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ax-blue)]"
                placeholder={t("placeholder")}
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                autoFocus
              />
              {code.length >= 3 && (
                <p className="mt-2 text-center text-xs font-medium text-[var(--color-ax-blue)]">
                  {getTypeLabel(codeType)}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={loading || !code.trim()}
              className="w-full rounded-lg bg-[var(--color-ax-blue)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? t("joining") : t("submit")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUBJECTS STEP (teacher only) ────────────────────────────
  if (step === "subjects") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-green-400" />
            <h1 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
              {t("selectSubjects")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {t("subjectsSubtitle")}
            </p>
            <p className="mt-1 text-xs text-green-400">
              ✅ {t("linkedAs")} {resultOrgName}
            </p>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {SUBJECTS.map((sub) => {
              const selected = selectedSubjects.includes(sub);
              return (
                <button
                  key={sub}
                  onClick={() => toggleSubject(sub)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selected
                      ? "border-green-500/40 bg-green-500/15 text-green-400"
                      : "border-[var(--color-border)] bg-[var(--color-bg2)] text-[var(--color-text-secondary)] hover:border-[var(--color-ax-blue)]/30 hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleConfirmSubjects}
            disabled={subjectsLoading || selectedSubjects.length === 0}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {subjectsLoading
              ? t("joining")
              : `${t("confirmSubjects")} (${selectedSubjects.length})`}
          </button>
        </div>
      </div>
    );
  }

  // ── DONE STEP ───────────────────────────────────────────────
  const isStudent = !!resultClassName;
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-green-400" />
          <h1 className="mt-3 text-xl font-bold text-green-400">
            {t("successTitle")}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {isStudent
              ? `${t("studentSuccess")} ${resultClassName}`
              : `${t("roleLinked")} ${resultOrgName}`}
          </p>
          {!isStudent && resultRole && (
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              <GraduationCap className="mr-1 inline h-3 w-3" />
              {resultRole}
            </p>
          )}
        </div>
        <button
          onClick={() =>
            router.push(isStudent ? "/solve" : `/org/${resultOrgId}`)
          }
          className="w-full rounded-lg bg-[var(--color-ax-blue)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {isStudent ? t("startStudying") : t("accessPanel")}
        </button>
      </div>
    </div>
  );
}
