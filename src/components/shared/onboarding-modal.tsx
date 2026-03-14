"use client";

import {
  Home,
  PenTool,
  Wand2,
  BookOpen,
  GraduationCap,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "axiom_onboarding_seen";

interface Slide {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  titleKey: string;
  descKey: string;
  emoji: string;
}

const slides: Slide[] = [
  {
    icon: Home,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    titleKey: "solveTitle",
    descKey: "solveDesc",
    emoji: "📸",
  },
  {
    icon: PenTool,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    titleKey: "writeTitle",
    descKey: "writeDesc",
    emoji: "✍️",
  },
  {
    icon: Wand2,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    titleKey: "humanizeTitle",
    descKey: "humanizeDesc",
    emoji: "🪄",
  },
  {
    icon: BookOpen,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    titleKey: "learnTitle",
    descKey: "learnDesc",
    emoji: "🎓",
  },
];

const SCHOOL_YEARS = [
  "middle_school",
  "high_school",
  "university_undergrad",
  "university_grad",
  "self_study",
] as const;

const LEARNING_GOALS = [
  "general",
  "enem",
  "vestibular",
  "sat_act",
  "toefl_ielts",
  "professional",
] as const;

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Languages",
  "Computer Science",
  "Literature",
] as const;

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [schoolYear, setSchoolYear] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const t = useTranslations("Dashboard.Onboarding");

  const totalSteps = slides.length + 1; // 4 info slides + 1 profile slide

  useEffect(() => {
    // Only show if user hasn't seen onboarding
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Small delay so the page loads first
        const timer = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const saveStudentProfile = async () => {
    if (!schoolYear && !learningGoal && selectedSubjects.length === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("student_profiles") as any).upsert(
          {
            id: user.id,
            school_year: schoolYear || null,
            learning_goal: learningGoal || null,
            subjects_of_interest:
              selectedSubjects.length > 0 ? selectedSubjects : [],
            onboarding_completed: true,
          },
          { onConflict: "id" }
        );
      }
    } catch (err) {
      console.error("Failed to save student profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async () => {
    if (step === totalSteps - 1) {
      await saveStudentProfile();
    }
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      await saveStudentProfile();
      setShow(false);
      localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  if (!show) return null;

  const isProfileSlide = step >= slides.length;
  const isLast = step === totalSteps - 1;

  // Render slide content
  const renderSlideContent = () => {
    if (isProfileSlide) {
      // Slide 5: Educational Profile
      return (
        <div className="px-6 py-6">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-400">
                🧠 {t("profileTitle")}
              </h3>
            </div>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t("profileDesc")}
          </p>

          <div className="space-y-3">
            {/* School Year */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("schoolYearLabel")}
              </label>
              <select
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg0)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-ax-blue)]/50 focus:outline-none"
              >
                <option value="">{t("selectOption")}</option>
                {SCHOOL_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {t(`schoolYear_${y}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Learning Goal */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("goalLabel")}
              </label>
              <select
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg0)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-ax-blue)]/50 focus:outline-none"
              >
                <option value="">{t("selectOption")}</option>
                {LEARNING_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {t(`goal_${g}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Subjects */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("subjectsLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      selectedSubjects.includes(s)
                        ? "border border-[var(--color-ax-blue)]/30 bg-[var(--color-ax-blue)]/10 text-[var(--color-ax-blue)]"
                        : "border border-[var(--color-border)] bg-[var(--color-bg0)] text-[var(--color-text-secondary)] hover:border-[var(--color-ax-blue)]/20"
                    }`}
                  >
                    {t(`subject_${s}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Info slides (1-4)
    const current = slides[step];
    const Icon = current.icon;
    return (
      <div className="px-6 py-6">
        <div
          className={`mb-4 flex items-center gap-3 rounded-xl border ${current.borderColor} ${current.bgColor} p-4`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${current.bgColor} ${current.color}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${current.color}`}>
              {current.emoji} {t(current.titleKey)}
            </h3>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {t(current.descKey)}
        </p>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] shadow-2xl shadow-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-[var(--color-dim)] transition-colors hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="border-b border-[var(--color-border)] px-6 pt-6 pb-4">
            <p className="mb-1 font-mono text-xs font-semibold tracking-wider text-[var(--color-ax-blue)] uppercase">
              {t("welcome")}
            </p>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {isProfileSlide ? t("profileHeader") : t("title")}
            </h2>
          </div>

          {/* Slide content */}
          {renderSlideContent()}

          {/* Footer with dots + navigation */}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4">
            {/* Step dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-[var(--color-ax-blue)]"
                      : "w-2 bg-[var(--color-bg3)] hover:bg-[var(--color-dim)]"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("back")}
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-[var(--color-ax-blue)] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-500 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)] disabled:opacity-50"
              >
                {saving ? t("saving") : isLast ? t("getStarted") : t("next")}
                {!isLast && !saving && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
