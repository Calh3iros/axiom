"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get public profile data for a user (only if profile is public)
 */
export async function getPublicProfile(userId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase
    .from("profiles")
    .select("id, plan, current_streak, is_profile_public, created_at")
    .eq("id", userId)
    .eq("is_profile_public", true)
    .single() as any);

  if (!profile) return null;

  // Fetch stats in parallel
  const [spData, kmData, badgeData] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("student_profiles")
      .select("total_problems_solved, total_correct, grade_level, study_goal")
      .eq("id", userId)
      .single() as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("knowledge_map")
      .select("subject, topic, mastery_score, level")
      .eq("user_id", userId)
      .order("mastery_score", { ascending: false }) as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", userId) as any),
  ]);

  // Get user display name from auth (not exposed by RLS, use initials)
  const totalSolved = spData?.data?.total_problems_solved || 0;
  const totalCorrect = spData?.data?.total_correct || 0;
  const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  return {
    userId: profile.id,
    plan: profile.plan,
    streak: profile.current_streak || 0,
    memberSince: profile.created_at,
    totalSolved,
    totalCorrect,
    accuracy,
    topics: kmData?.data || [],
    badges: badgeData?.data || [],
    gradeLevel: spData?.data?.grade_level,
    studyGoal: spData?.data?.study_goal,
  };
}

/**
 * Toggle profile public/private
 */
export async function toggleProfilePublic(isPublic: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any)
    .update({ is_profile_public: isPublic })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Get streak calendar data (last 90 days of interactions)
 */
export async function getStreakCalendar(userId?: string) {
  const supabase = await createClient();

  let targetUserId = userId;
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    targetUserId = user.id;
  }

  // Get interactions from challenge_log grouped by date
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase
    .from("challenge_log")
    .select("created_at")
    .eq("user_id", targetUserId)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .order("created_at", { ascending: true }) as any);

  if (!data) return [];

  // Group by date
  const dateCounts: Record<string, number> = {};
  for (const row of data as { created_at: string }[]) {
    const date = new Date(row.created_at).toISOString().split("T")[0];
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  }

  // Build 90-day array
  const result: { date: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    result.push({ date: dateStr, count: dateCounts[dateStr] || 0 });
  }

  return result;
}
