import { Sparkles, Brain, Award, Hash, Share2 } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { BadgeGrid } from "@/components/shared/badge-grid";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

import { StatsHeader } from "./components/stats-header";
import { StreakCalendar } from "./components/streak-calendar";

export const metadata = {
  title: "Dashboard | Axiom",
  description: "Track your learning progress and mastery across subjects.",
};

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard.Map");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all data in parallel
  const [topicsRes, profileRes, spRes, badgesRes, catalogRes] =
    await Promise.all([
      supabase
        .from("knowledge_map")
        .select("*")
        .eq("user_id", user.id)
        .order("subject", { ascending: true })
        .order("mastery_score", { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase
        .from("profiles")
        .select("current_streak, is_profile_public")
        .eq("id", user.id)
        .single() as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase
        .from("student_profiles")
        .select("total_problems_solved, total_correct")
        .eq("id", user.id)
        .single() as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase
        .from("badges_catalog")
        .select("id") as any),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topicList = (topicsRes.data as any[]) || [];
  const streak = profileRes?.data?.current_streak || 0;
  const isPublic = profileRes?.data?.is_profile_public || false;
  const totalSolved = spRes?.data?.total_problems_solved || 0;
  const totalCorrect = spRes?.data?.total_correct || 0;
  const accuracy =
    totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  const badgesUnlocked = badgesRes?.data?.length || 0;
  const badgesTotal = catalogRes?.data?.length || 0;

  // Group topics by subject
  const groupedList = topicList.reduce(
    (acc, curr) => {
      if (!acc[curr.subject]) acc[curr.subject] = [];
      acc[curr.subject].push(curr);
      return acc;
    },
    {} as Record<string, typeof topicList>
  );

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-3xl">
            <Brain className="h-8 w-8 text-[var(--color-ax-blue)]" />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {t("description")}
          </p>
        </div>
        {isPublic && (
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <Share2 className="h-3.5 w-3.5" />
            {t("viewPublicProfile")}
          </Link>
        )}
      </div>

      {/* Stats */}
      <StatsHeader
        totalSolved={totalSolved}
        totalCorrect={totalCorrect}
        accuracy={accuracy}
        topicsCount={topicList.length}
        streak={streak}
        badgesUnlocked={badgesUnlocked}
        badgesTotal={badgesTotal}
      />

      {/* Streak Calendar */}
      <StreakCalendar />

      {/* Badges */}
      <div className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4">
        <h3 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
          🏆 {t("badgesSection")}
        </h3>
        <BadgeGrid />
      </div>

      {/* Topics by Subject */}
      {topicList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg2)]">
            <Sparkles className="h-8 w-8 text-[var(--color-ax-blue)]" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">
            {t("noData")}
          </h2>
          <p className="mb-6 max-w-md text-[var(--color-text-secondary)]">
            {t("noDataDesc")}
          </p>
          <Link
            href="/solve"
            className="rounded-full bg-[var(--color-ax-blue)] px-6 py-2.5 font-semibold text-black transition-colors hover:bg-orange-400"
          >
            {t("startSolving")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Object.entries(groupedList).map(([subject, items]) => (
            <div
              key={subject}
              className="rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6 shadow-sm"
            >
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--color-text-primary)]">
                <Hash className="h-5 w-5 text-[var(--color-ax-blue)]" />
                {subject}
              </h2>
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(items as any[]).map((item: any) => {
                  const percent = Math.round(
                    (item.mastery_score || 0) * 100
                  );
                  const level = item.level || 1;
                  const correctCount = item.correct_count || 0;
                  const incorrectCount = item.incorrect_count || 0;
                  let colorClass = "bg-red-400";
                  let textColor = "text-red-400";
                  if (percent >= 40) {
                    colorClass = "bg-yellow-400";
                    textColor = "text-yellow-400";
                  }
                  if (percent >= 70) {
                    colorClass = "bg-orange-400";
                    textColor = "text-orange-400";
                  }
                  if (percent >= 90) {
                    colorClass = "bg-[var(--color-ax-blue)]";
                    textColor = "text-[var(--color-ax-blue)]";
                  }

                  return (
                    <div key={item.id} className="group">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]">
                          {item.topic}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-dim)]">
                            {"★".repeat(level)}
                            {"☆".repeat(5 - level)}
                          </span>
                          {percent >= 90 && (
                            <Award className="h-4 w-4 text-[var(--color-ax-blue)]" />
                          )}
                          <span
                            className={`text-xs font-bold ${textColor}`}
                          >
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-bg2)]">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                          style={{
                            width: `${Math.max(2, percent)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-[10px] text-[var(--color-dim)]">
                          {item.interactions_count}{" "}
                          {item.interactions_count !== 1
                            ? t("interactions")
                            : t("interaction")}
                          {(correctCount > 0 || incorrectCount > 0) && (
                            <>
                              {" "}
                              ·{" "}
                              <span className="text-green-400">
                                {correctCount} {t("correct")}
                              </span>{" "}
                              ·{" "}
                              <span className="text-red-400">
                                {incorrectCount} {t("incorrect")}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-[var(--color-dim)]">
                          {t("level")} {level}: {t(`level_${level}`)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
