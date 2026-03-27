"use client";

import { Building2, CheckCircle, AlertCircle, BookOpen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState, useEffect } from "react";

import { useRouter } from "@/i18n/routing";
import { joinByInviteCode } from "@/lib/actions/invite";
import {
  redeemInviteCode,
  updateMemberSubjects,
} from "@/lib/actions/invite-codes";
import { createClient } from "@/lib/supabase/client";
import {
  type CodeType,
  detectCodeType,
  SUBJECTS,
} from "@/lib/utils/code-utils";

const STORAGE_KEY = "axiom_code_onboarding_dismissed";

type Step = "input" | "subjects" | "done";

export function CodeOnboardingModal() {
  const t = useTranslations("Join");
  const router = useRouter();
  const pathname = usePathname();

  const [show, setShow] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redeem result
  const [resultOrgName, setResultOrgName] = useState("");
  const [resultOrgId, setResultOrgId] = useState("");
  const [resultClassName, setResultClassName] = useState("");

  // Subjects (teacher flow)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const codeType = code.length >= 3 ? detectCodeType(code) : null;

  // ── Decide whether to show ──────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show on /join page
    if (pathname.includes("/join")) return;

    // Don't show if dismissed
    if (localStorage.getItem(STORAGE_KEY) === "true") return;

    const check = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user has ANY org membership
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase.from("org_memberships") as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (count && count > 0) {
          // Already in an org — never show
          localStorage.setItem(STORAGE_KEY, "true");
          return;
        }

        // No memberships → show modal after a short delay
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      } catch {
        // Fail closed — don't show
      }
    };

    check();
  }, [pathname]);

  // ── Dismiss ─────────────────────────────────────────────────
  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    posthog.capture("code_onboarding_dismissed");
    setShow(false);
  };

  // ── Code type label ─────────────────────────────────────────
  const getTypeLabel = (type: CodeType | null): string => {
    if (!type) return t("typeEmpty");
    const labels: Record<CodeType, string> = {
      secretary: t("typeSecretary"),
      gre: t("typeGre"),
      director: t("typeDirector"),
      teacher: t("typeTeacher"),
      owner: t("typeOwner" as "typeSecretary"),
      student: t("typeStudent"),
    };
    return labels[type];
  };

  // ── Handle join ─────────────────────────────────────────────
  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const type = detectCodeType(code);

    if (type === "student" || type === null) {
      const result = await joinByInviteCode(code.trim());
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        posthog.capture("org_joined", {
          method: "code_onboarding_modal",
          type: "student",
        });
        setResultClassName(result.className || "");
        localStorage.setItem(STORAGE_KEY, "true");
        setStep("done");
      }
    } else {
      const result = await redeemInviteCode({ code: code.trim() });
      setLoading(false);
      if ("error" in result) {
        setError(result.error);
      } else {
        posthog.capture("org_joined", {
          method: "code_onboarding_modal",
          type,
        });
        setResultOrgName(result.orgName);
        setResultOrgId(result.orgId);
        localStorage.setItem(STORAGE_KEY, "true");

        if (result.requiresSubjects) {
          setStep("subjects");
        } else {
          setStep("done");
        }
      }
    }
  };

  // ── Handle subjects confirm ─────────────────────────────────
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

  // ── Navigate on done ────────────────────────────────────────
  const handleDoneNavigate = () => {
    const isStudent = !!resultClassName;
    router.push(isStudent ? "/solve" : `/org/${resultOrgId}`);
    setShow(false);
  };

  if (!show) return null;

  // ── RENDER ──────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] shadow-2xl shadow-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-[var(--color-dim)] transition-colors hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ── STEP: INPUT ── */}
          {step === "input" && (
            <div className="px-6 py-8">
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
                  <Building2 className="h-7 w-7 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {t("codeOnboardingWelcome")}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {t("codeOnboardingQuestion")}
                </p>
              </div>

              {/* Code input */}
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-3.5 text-center font-mono text-lg tracking-widest text-[var(--color-text-primary)] transition-colors outline-none focus:border-orange-500/50"
                    placeholder={t("codeOnboardingPaste")}
                    maxLength={20}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    autoFocus
                  />
                  {code.length >= 3 && (
                    <p className="mt-2 text-center text-xs font-medium text-orange-400">
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
                  className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-orange-400 disabled:opacity-40"
                >
                  {loading ? "..." : t("codeOnboardingEnter")}
                </button>
              </div>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--color-border)]" />
                <span className="text-xs text-[var(--color-dim)]">
                  {t("codeOnboardingOr")}
                </span>
                <div className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              {/* Skip */}
              <button
                onClick={dismiss}
                className="w-full text-center text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                <span className="font-medium">{t("codeOnboardingNoCode")}</span>
                <br />
                <span className="text-xs text-[var(--color-dim)]">
                  {t("codeOnboardingIndependent")}
                </span>
              </button>
            </div>
          )}

          {/* ── STEP: SUBJECTS (teacher) ── */}
          {step === "subjects" && (
            <div className="px-6 py-8">
              <div className="mb-6 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-green-400" />
                <h2 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
                  {t("selectSubjects")}
                </h2>
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
                          : "border-[var(--color-border)] bg-[var(--color-bg2)] text-[var(--color-text-secondary)] hover:border-green-500/30 hover:text-[var(--color-text-primary)]"
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
                className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {subjectsLoading
                  ? "..."
                  : `${t("confirmSubjects")} (${selectedSubjects.length})`}
              </button>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === "done" && (
            <div className="px-6 py-8">
              <div className="mb-6 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                <h2 className="mt-3 text-xl font-bold text-green-400">
                  {t("successTitle")}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {resultClassName
                    ? `${t("studentSuccess")} ${resultClassName}`
                    : `${t("roleLinked")} ${resultOrgName}`}
                </p>
              </div>
              <button
                onClick={handleDoneNavigate}
                className="w-full rounded-xl bg-[var(--color-ax-blue)] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                {resultClassName ? t("startStudying") : t("accessPanel")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
