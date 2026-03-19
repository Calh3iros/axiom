"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────

export interface StudentReportTopic {
  name: string;
  level: number;
  mastery_percent: number;
  correct_count: number;
  incorrect_count: number;
  interactions: number;
  last_interaction: string;
}

export interface StudentReportSubject {
  name: string;
  topics: StudentReportTopic[];
  avg_mastery: number;
  total_topics: number;
  topics_mastered: number;
}

export interface StudentReportBadge {
  name: string;
  icon: string;
  unlocked_at: string;
}

export interface StudentReport {
  student: {
    name: string;
    email: string;
    avatar_url: string | null;
    plan: string;
    school_year: string | null;
    learning_goal: string | null;
  };
  class: {
    name: string;
    org_name: string;
  };
  stats: {
    total_solved: number;
    total_correct: number;
    accuracy_percent: number;
    current_streak: number;
    badges_count: number;
    days_active: number;
    member_since: string;
  };
  subjects: StudentReportSubject[];
  activity: {
    days_active_30d: number;
    exercises_30d: number;
    trend: "improving" | "stable" | "declining";
  };
  usage: {
    solves: number;
    writes: number;
    humanizes: number;
    learns: number;
  };
  badges: StudentReportBadge[];
  strengths: string[];
  weaknesses: string[];
  generated_at: string;
}

// ─── Main Action ─────────────────────────────────────────────────────────

export async function getStudentReport(
  studentId: string,
  classId: string
): Promise<StudentReport | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check super_admin for RLS bypass (same pattern as rankings.ts)
  let isSuperAdminUser = false;
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prof } = await (supabase.from("profiles") as any)
      .select("is_super_admin").eq("id", user.id).single();
    isSuperAdminUser = prof?.is_super_admin === true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = isSuperAdminUser ? supabaseAdmin : supabase;

  // 1. Get class → org_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (db.from("classes") as any)
    .select("id, name, org_id, teacher_id")
    .eq("id", classId)
    .single();
  if (!cls) return null;

  // 2. Auth: super_admin bypasses, otherwise check elevated role
  if (!isSuperAdminUser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (db.from("org_memberships") as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", cls.org_id)
      .single();
    const elevated = ["teacher", "admin", "director", "secretary"];
    const isTeacher = cls.teacher_id === user.id;
    if (!isTeacher && (!membership || !elevated.includes(membership.role))) {
      return null;
    }
  }

  // 3. Verify student is in this class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (db.from("class_memberships") as any)
    .select("joined_at")
    .eq("class_id", classId)
    .eq("user_id", studentId)
    .single();
  if (!membership) return null;

  // 4. Parallel fetch all data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysISO = thirtyDaysAgo.toISOString();

  const [
    profileRes,
    spRes,
    orgRes,
    kmRes,
    challengeRes,
    challenge30dRes,
    usageRes,
    badgeRes,
    catalogRes,
  ] = await Promise.all([
    // Profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("profiles") as any)
      .select("full_name, email, avatar_url, plan, current_streak, created_at")
      .eq("id", studentId)
      .single(),
    // Student profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("student_profiles") as any)
      .select("total_problems_solved, total_correct, grade_level, study_goal")
      .eq("id", studentId)
      .single(),
    // Organization name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("organizations") as any)
      .select("name")
      .eq("id", cls.org_id)
      .single(),
    // Knowledge map — all entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("knowledge_map") as any)
      .select("subject, topic, level, mastery_score, correct_count, incorrect_count, interactions_count, last_interaction_at")
      .eq("user_id", studentId)
      .order("subject")
      .order("mastery_score", { ascending: false }),
    // Challenge log — all time (for days_active count)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("challenge_log") as any)
      .select("created_at")
      .eq("user_id", studentId),
    // Challenge log — last 30 days
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("challenge_log") as any)
      .select("created_at")
      .eq("user_id", studentId)
      .gte("created_at", thirtyDaysISO),
    // Usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("usage") as any)
      .select("solves, writes, humanizes, learns")
      .eq("user_id", studentId),
    // Badges
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("user_badges") as any)
      .select("badge_id, unlocked_at")
      .eq("user_id", studentId)
      .order("unlocked_at", { ascending: false }),
    // Badge catalog
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("badges_catalog") as any)
      .select("id, icon, name_key")
      .order("sort_order"),
  ]);

  const profile = profileRes.data;
  const sp = spRes.data;
  const org = orgRes.data;
  if (!profile) return null;

  // 5. Process knowledge map → subjects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kmRows: any[] = kmRes.data || [];
  const subjectMap = new Map<string, StudentReportTopic[]>();
  for (const row of kmRows) {
    const topics = subjectMap.get(row.subject) || [];
    topics.push({
      name: row.topic,
      level: row.level || 1,
      mastery_percent: Math.round((row.mastery_score || 0) * 100),
      correct_count: row.correct_count || 0,
      incorrect_count: row.incorrect_count || 0,
      interactions: row.interactions_count || 0,
      last_interaction: row.last_interaction_at || "",
    });
    subjectMap.set(row.subject, topics);
  }

  const subjects: StudentReportSubject[] = [];
  for (const [name, topics] of subjectMap.entries()) {
    const avgMastery =
      topics.length > 0
        ? Math.round(topics.reduce((s, t) => s + t.mastery_percent, 0) / topics.length)
        : 0;
    subjects.push({
      name,
      topics,
      avg_mastery: avgMastery,
      total_topics: topics.length,
      topics_mastered: topics.filter((t) => t.level >= 4).length,
    });
  }

  // 6. Days active (unique dates in challenge_log)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allChallenges: any[] = challengeRes.data || [];
  const uniqueDays = new Set(
    allChallenges.map((c) => new Date(c.created_at).toISOString().split("T")[0])
  );

  // 7. Activity — last 30 days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const challenges30d: any[] = challenge30dRes.data || [];
  const uniqueDays30d = new Set(
    challenges30d.map((c) => new Date(c.created_at).toISOString().split("T")[0])
  );

  // Trend: compare last 15 days vs previous 15 days
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const recentHalf = challenges30d.filter(
    (c) => new Date(c.created_at) >= fifteenDaysAgo
  ).length;
  const olderHalf = challenges30d.length - recentHalf;
  let trend: "improving" | "stable" | "declining" = "stable";
  if (olderHalf > 0) {
    const ratio = recentHalf / olderHalf;
    if (ratio > 1.25) trend = "improving";
    else if (ratio < 0.75) trend = "declining";
  } else if (recentHalf > 0) {
    trend = "improving";
  }

  // 8. Usage totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usageRows: any[] = usageRes.data || [];
  const usage = { solves: 0, writes: 0, humanizes: 0, learns: 0 };
  for (const u of usageRows) {
    usage.solves += u.solves || 0;
    usage.writes += u.writes || 0;
    usage.humanizes += u.humanizes || 0;
    usage.learns += u.learns || 0;
  }

  // 9. Badges
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalogMap = new Map<string, { icon: string; name_key: string }>();
  for (const c of (catalogRes.data || []) as { id: string; icon: string; name_key: string }[]) {
    catalogMap.set(c.id, { icon: c.icon, name_key: c.name_key });
  }
  const badges: StudentReportBadge[] = (
    (badgeRes.data || []) as { badge_id: string; unlocked_at: string }[]
  ).map((b) => {
    const cat = catalogMap.get(b.badge_id);
    return {
      name: cat?.name_key || b.badge_id,
      icon: cat?.icon || "🏅",
      unlocked_at: b.unlocked_at,
    };
  });

  // 10. Strengths & weaknesses
  const allTopics = Array.from(subjectMap.values()).flat();
  const strengths = allTopics
    .filter((t) => t.mastery_percent >= 70)
    .sort((a, b) => b.mastery_percent - a.mastery_percent)
    .map((t) => t.name);
  const weaknesses = allTopics
    .filter((t) => t.mastery_percent < 40 && t.interactions > 0)
    .sort((a, b) => a.mastery_percent - b.mastery_percent)
    .map((t) => t.name);

  // 11. Build report
  const totalSolved = sp?.total_problems_solved || 0;
  const totalCorrect = sp?.total_correct || 0;

  return {
    student: {
      name: profile.full_name || profile.email?.split("@")[0] || "Student",
      email: profile.email || "",
      avatar_url: profile.avatar_url || null,
      plan: profile.plan || "free",
      school_year: sp?.grade_level || null,
      learning_goal: sp?.study_goal || null,
    },
    class: {
      name: cls.name,
      org_name: org?.name || "",
    },
    stats: {
      total_solved: totalSolved,
      total_correct: totalCorrect,
      accuracy_percent: totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0,
      current_streak: profile.current_streak || 0,
      badges_count: badges.length,
      days_active: uniqueDays.size,
      member_since: membership.joined_at,
    },
    subjects,
    activity: {
      days_active_30d: uniqueDays30d.size,
      exercises_30d: challenges30d.length,
      trend,
    },
    usage,
    badges,
    strengths,
    weaknesses,
    generated_at: new Date().toISOString(),
  };
}
