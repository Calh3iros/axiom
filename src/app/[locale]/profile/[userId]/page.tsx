import { Award, Brain, Hash } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return {
    title: `Student Profile | Axiom`,
    description: `View learning progress for student ${userId.substring(0, 8)}`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const t = await getTranslations("Profile");
  const supabase = await createClient();

  // Fetch profile (only if public)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase
    .from("profiles")
    .select("id, plan, current_streak, is_profile_public, created_at")
    .eq("id", userId)
    .single() as any);

  if (!profile || !profile.is_profile_public) {
    notFound();
  }

  // Fetch stats
  const [spRes, kmRes, badgeRes, catalogRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("student_profiles")
      .select("total_problems_solved, total_correct")
      .eq("id", userId)
      .single() as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("knowledge_map")
      .select("subject, topic, mastery_score, level, correct_count, incorrect_count, interactions_count")
      .eq("user_id", userId)
      .order("subject")
      .order("mastery_score", { ascending: false }) as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", userId) as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("badges_catalog")
      .select("id, icon, name_key, category")
      .order("sort_order") as any),
  ]);

  const totalSolved = spRes?.data?.total_problems_solved || 0;
  const totalCorrect = spRes?.data?.total_correct || 0;
  const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topics = (kmRes?.data as any[]) || [];
  const badges = (badgeRes?.data || []) as { badge_id: string; unlocked_at: string }[];
  const catalog = (catalogRes?.data || []) as { id: string; icon: string; name_key: string; category: string }[];
  const unlockedIds = new Set(badges.map((b) => b.badge_id));

  const memberDate = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });

  // Group topics
  const grouped = topics.reduce((acc, curr) => {
    if (!acc[curr.subject]) acc[curr.subject] = [];
    acc[curr.subject].push(curr);
    return acc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any[]>);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      {/* Profile Header */}
      <div className="rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--color-ax-blue)]/25 bg-[var(--color-ax-blue)]/10">
          <Brain className="h-8 w-8 text-[var(--color-ax-blue)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          {t("studentProfile")}
        </h1>
        <p className="mt-1 text-xs text-[var(--color-dim)]">
          {t("memberSince")} {memberDate} · 🔥 {profile.current_streak || 0} {t("dayStreak")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{totalSolved}</p>
          <p className="text-[10px] font-medium tracking-wider text-[var(--color-dim)] uppercase">{t("solved")}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{accuracy}%</p>
          <p className="text-[10px] font-medium tracking-wider text-[var(--color-dim)] uppercase">{t("accuracy")}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{topics.length}</p>
          <p className="text-[10px] font-medium tracking-wider text-[var(--color-dim)] uppercase">{t("topics")}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4">
        <h3 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">🏆 {t("badges")}</h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {catalog.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center rounded-lg p-2 ${
                unlockedIds.has(badge.id)
                  ? "bg-[var(--color-ax-yellow)]/5"
                  : "opacity-30 grayscale"
              }`}
              title={badge.name_key}
            >
              <span className="text-lg">{badge.icon}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(grouped).map(([subject, items]) => (
            <div
              key={subject}
              className="rounded-xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-4"
            >
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                <Hash className="h-4 w-4 text-[var(--color-ax-blue)]" />
                {subject}
              </h3>
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(items as any[]).map((item: any, idx: number) => {
                  const percent = Math.round((item.mastery_score || 0) * 100);
                  const level = item.level || 1;
                  let colorClass = "bg-red-400";
                  if (percent >= 40) colorClass = "bg-yellow-400";
                  if (percent >= 70) colorClass = "bg-orange-400";
                  if (percent >= 90) colorClass = "bg-[var(--color-ax-blue)]";

                  return (
                    <div key={idx}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {item.topic}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-[var(--color-dim)]">
                            {"★".repeat(level)}{"☆".repeat(5 - level)}
                          </span>
                          {percent >= 90 && <Award className="h-3 w-3 text-[var(--color-ax-blue)]" />}
                          <span className="text-[10px] font-bold text-[var(--color-dim)]">
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg2)]">
                        <div
                          className={`h-full rounded-full ${colorClass}`}
                          style={{ width: `${Math.max(2, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-[10px] text-[var(--color-dim)]">
        Powered by Axiom · axiom-solver.com
      </p>
    </div>
  );
}
