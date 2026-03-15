/**
 * Badge Engine — checks and unlocks badges for a user.
 * Called server-side ONLY (from background worker in chat/route.ts).
 * Uses supabaseAdmin (service role) for all database operations.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

type BadgeCatalog = {
  id: string;
  criteria_type: string;
  criteria_value: number;
};

/**
 * Checks all badge criteria for a user and unlocks any newly earned ones.
 * @returns Array of badge IDs that were just unlocked (empty if none)
 */
export async function checkAndUnlockBadges(
  userId: string
): Promise<string[]> {
  try {
    // 1. Get all badges from catalog
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: catalog } = await (supabaseAdmin
      .from("badges_catalog")
      .select("id, criteria_type, criteria_value")
      .order("sort_order") as any);

    if (!catalog || catalog.length === 0) return [];

    // 2. Get badges already unlocked by this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unlocked } = await (supabaseAdmin
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId) as any);

    const unlockedIds = new Set(
      (unlocked || []).map((u: { badge_id: string }) => u.badge_id)
    );

    // 3. Gather user stats (batched queries)
    const [kmData, profileData, challengeData] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin
        .from("knowledge_map")
        .select("subject, level, correct_count, current_streak")
        .eq("user_id", userId) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin
        .from("profiles")
        .select("streak_count")
        .eq("id", userId)
        .single() as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin
        .from("student_profiles")
        .select("total_problems_solved, total_correct")
        .eq("id", userId)
        .single() as any),
    ]);

    const kmRows = kmData?.data || [];
    const streakDays = profileData?.data?.streak_count || 0;
    const totalSolved = challengeData?.data?.total_problems_solved || 0;
    const totalCorrect = challengeData?.data?.total_correct || 0;

    // Derived stats
    const topicsAtLevel5 = kmRows.filter(
      (r: { level: number }) => r.level >= 5
    ).length;
    const maxStreak = Math.max(
      0,
      ...kmRows.map((r: { current_streak: number }) => r.current_streak || 0)
    );
    const distinctSubjects = new Set(
      kmRows.map((r: { subject: string }) => r.subject)
    ).size;

    // 4. Check each badge criterion
    const newlyUnlocked: string[] = [];

    for (const badge of catalog as BadgeCatalog[]) {
      if (unlockedIds.has(badge.id)) continue; // Already unlocked

      let earned = false;

      switch (badge.criteria_type) {
        case "solves_total":
          earned = totalSolved >= badge.criteria_value;
          break;
        case "correct_total":
          earned = totalCorrect >= badge.criteria_value;
          break;
        case "correct_streak":
          earned = maxStreak >= badge.criteria_value;
          break;
        case "streak_days":
          earned = streakDays >= badge.criteria_value;
          break;
        case "topic_level_5":
          earned = topicsAtLevel5 >= badge.criteria_value;
          break;
        case "subjects_count":
          earned = distinctSubjects >= badge.criteria_value;
          break;
      }

      if (earned) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("user_badges") as any)
          .insert({ user_id: userId, badge_id: badge.id });

        if (!error) {
          newlyUnlocked.push(badge.id);
          console.warn(`🏆 Badge unlocked: ${badge.id} for user ${userId}`);
        }
      }
    }

    return newlyUnlocked;
  } catch (err) {
    console.error("Badge engine error (non-fatal):", err);
    return [];
  }
}
