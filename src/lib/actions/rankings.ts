"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────

export type RankingSortField =
  | "problems_solved"
  | "active_usage"
  | "streak_days"
  | "accuracy"
  | "topics_mastered"
  | "badges_count";

export interface StudentRankingRow {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  // Effort metrics (visible to all)
  problems_solved: number;
  active_usage: number;
  streak_days: number;
  // Performance metrics (visible to managers only)
  accuracy?: number;
  topics_mastered?: number;
  badges_count?: number;
}

export interface ClassAggregateRow {
  class_id: string;
  class_name: string;
  student_count: number;
  avg_problems_solved: number;
  avg_active_usage: number;
  avg_accuracy: number;
  active_last_7d: number;
}

export interface OrgAggregateRow {
  org_id: string;
  org_name: string;
  org_type: string;
  total_students: number;
  avg_problems_solved: number;
  avg_accuracy: number;
  active_last_7d: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function isElevatedRole(role: string): boolean {
  return ["teacher", "admin", "director", "secretary"].includes(role);
}

// ─── Class Ranking ───────────────────────────────────────────────────────

/**
 * Get ranking for students in a class.
 * - Students see effort metrics only.
 * - Teachers/admins see effort + performance metrics.
 */
export async function getClassRanking(
  classId: string,
  sortBy: RankingSortField = "problems_solved"
): Promise<{ rows: StudentRankingRow[]; role: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get the class and verify access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabase.from("classes") as any)
    .select("id, org_id, teacher_id")
    .eq("id", classId)
    .single();
  if (!cls) return null;

  // Determine user's role
  let role = "student";
  if (cls.teacher_id === user.id) {
    role = "teacher";
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase.from("org_memberships") as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", cls.org_id)
      .single();
    if (membership) role = membership.role;
  }

  // Get students in class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: students } = await (supabase.from("class_memberships") as any)
    .select("user_id")
    .eq("class_id", classId);

  if (!students || students.length === 0) return { rows: [], role };

  const userIds = students.map((s: { user_id: string }) => s.user_id);

  // Batch-fetch all metrics
  const [profilesRes, studentProfilesRes, usageRes, kmRes, badgesRes] =
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("profiles") as any)
        .select("id, full_name, avatar_url, email, current_streak")
        .in("id", userIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("student_profiles") as any)
        .select("id, total_problems_solved, total_correct")
        .in("id", userIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("usage") as any)
        .select("user_id, solves, writes, learns")
        .in("user_id", userIds),
      // Performance: only fetch if elevated
      isElevatedRole(role)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("knowledge_map") as any)
            .select("user_id, level")
            .in("user_id", userIds)
            .gte("level", 5)
        : Promise.resolve({ data: [] }),
      isElevatedRole(role)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("user_badges") as any)
            .select("user_id")
            .in("user_id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

  // Index profiles
  const profileMap = new Map<
    string,
    { full_name: string; avatar_url: string | null; email: string; current_streak: number }
  >();
  for (const p of profilesRes?.data || []) {
    profileMap.set(p.id, p);
  }

  // Index student profiles
  const spMap = new Map<string, { total_problems_solved: number; total_correct: number }>();
  for (const sp of studentProfilesRes?.data || []) {
    spMap.set(sp.id, sp);
  }

  // Sum usage per user
  const usageMap = new Map<string, number>();
  for (const u of usageRes?.data || []) {
    const current = usageMap.get(u.user_id) || 0;
    usageMap.set(u.user_id, current + (u.solves || 0) + (u.writes || 0) + (u.learns || 0));
  }

  // Performance: topics mastered per user
  const masteryMap = new Map<string, number>();
  if (isElevatedRole(role)) {
    for (const km of kmRes?.data || []) {
      masteryMap.set(km.user_id, (masteryMap.get(km.user_id) || 0) + 1);
    }
  }

  // Performance: badges count per user
  const badgesMap = new Map<string, number>();
  if (isElevatedRole(role)) {
    for (const b of badgesRes?.data || []) {
      badgesMap.set(b.user_id, (badgesMap.get(b.user_id) || 0) + 1);
    }
  }

  // Build rows
  const rows: StudentRankingRow[] = userIds.map((uid: string) => {
    const profile = profileMap.get(uid);
    const sp = spMap.get(uid);
    const totalSolved = sp?.total_problems_solved || 0;
    const totalCorrect = sp?.total_correct || 0;

    const row: StudentRankingRow = {
      user_id: uid,
      full_name: profile?.full_name || profile?.email?.split("@")[0] || "User",
      avatar_url: profile?.avatar_url || null,
      problems_solved: totalSolved,
      active_usage: usageMap.get(uid) || 0,
      streak_days: profile?.current_streak || 0,
    };

    if (isElevatedRole(role)) {
      row.accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
      row.topics_mastered = masteryMap.get(uid) || 0;
      row.badges_count = badgesMap.get(uid) || 0;
    }

    return row;
  });

  // Sort
  const elevatedSort = isElevatedRole(role);
  const safeSortBy =
    !elevatedSort && ["accuracy", "topics_mastered", "badges_count"].includes(sortBy)
      ? "problems_solved"
      : sortBy;

  rows.sort((a, b) => {
    const av = (a as unknown as Record<string, number>)[safeSortBy] || 0;
    const bv = (b as unknown as Record<string, number>)[safeSortBy] || 0;
    return (bv || 0) - (av || 0);
  });

  return { rows, role };
}

// ─── Org Ranking (between classes) ──────────────────────────────────────

/**
 * Get aggregated ranking by class for an org.
 * Only for director/admin/secretary.
 */
export async function getOrgClassRanking(
  orgId: string
): Promise<{ rows: ClassAggregateRow[]; childOrgRows?: OrgAggregateRow[] } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify elevated role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase.from("org_memberships") as any)
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  // Super_admin bypass: read-only director access without membership
  let effectiveRole = membership?.role || null;
  let isSuperAdminUser = false;
  if (!effectiveRole) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("is_super_admin").eq("id", user.id).single();
    if (profile?.is_super_admin) {
      effectiveRole = "director";
      isSuperAdminUser = true;
    }
  }

  if (!effectiveRole || !isElevatedRole(effectiveRole)) return null;

  // Super_admin uses supabaseAdmin to bypass RLS
   
  const { supabaseAdmin } = isSuperAdminUser ? await import("@/lib/supabase/admin") : { supabaseAdmin: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = isSuperAdminUser ? supabaseAdmin : supabase;

  // Get classes in this org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classes } = await (db.from("classes") as any)
    .select("id, name")
    .eq("org_id", orgId);

  if (!classes || classes.length === 0) return { rows: [] };

  const classRows: ClassAggregateRow[] = [];

  for (const cls of classes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (db.from("class_memberships") as any)
      .select("user_id")
      .eq("class_id", cls.id);

    if (!members || members.length === 0) {
      classRows.push({
        class_id: cls.id,
        class_name: cls.name,
        student_count: 0,
        avg_problems_solved: 0,
        avg_active_usage: 0,
        avg_accuracy: 0,
        active_last_7d: 0,
      });
      continue;
    }

    const uids = members.map((m: { user_id: string }) => m.user_id);

    const [spRes, profilesRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.from("student_profiles") as any)
        .select("id, total_problems_solved, total_correct")
        .in("id", uids),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.from("profiles") as any)
        .select("id, last_active_date")
        .in("id", uids),
    ]);

    const spRows = spRes?.data || [];
    const profileRows = profilesRes?.data || [];

    const totalSolved = spRows.reduce(
      (sum: number, r: { total_problems_solved: number }) =>
        sum + (r.total_problems_solved || 0),
      0
    );
    const totalCorrect = spRows.reduce(
      (sum: number, r: { total_correct: number }) => sum + (r.total_correct || 0),
      0
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().split("T")[0];
    const activeLast7d = profileRows.filter(
      (p: { last_active_date: string | null }) =>
        p.last_active_date && p.last_active_date >= sevenDaysStr
    ).length;

    const n = uids.length;
    classRows.push({
      class_id: cls.id,
      class_name: cls.name,
      student_count: n,
      avg_problems_solved: Math.round(totalSolved / n),
      avg_active_usage: 0, // TODO: aggregate usage
      avg_accuracy: totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0,
      active_last_7d: activeLast7d,
    });
  }

  classRows.sort((a, b) => b.avg_problems_solved - a.avg_problems_solved);

  // For secretary/admin: also aggregate child orgs
  let childOrgRows: OrgAggregateRow[] | undefined;
  if (["admin", "secretary", "director"].includes(effectiveRole)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subtree } = await (db as any).rpc("get_org_subtree", {
      root_id: orgId,
    });

    const childIds = (subtree || [])
      .filter((n: { depth: number }) => n.depth > 0)
      .map((n: { org_id: string }) => n.org_id);

    if (childIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: childOrgs } = await (db.from("organizations") as any)
        .select("id, name, type")
        .in("id", childIds);

      childOrgRows = [];
      for (const org of childOrgs || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: orgMembers } = await (db.from("org_memberships") as any)
          .select("user_id")
          .eq("org_id", org.id)
          .eq("role", "student");

        const stuIds = (orgMembers || []).map((m: { user_id: string }) => m.user_id);
        if (stuIds.length === 0) {
          childOrgRows.push({
            org_id: org.id,
            org_name: org.name,
            org_type: org.type,
            total_students: 0,
            avg_problems_solved: 0,
            avg_accuracy: 0,
            active_last_7d: 0,
          });
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: spData } = await (db.from("student_profiles") as any)
          .select("id, total_problems_solved, total_correct")
          .in("id", stuIds);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pData } = await (db.from("profiles") as any)
          .select("id, last_active_date")
          .in("id", stuIds);

        const solved = (spData || []).reduce(
          (s: number, r: { total_problems_solved: number }) => s + (r.total_problems_solved || 0), 0
        );
        const correct = (spData || []).reduce(
          (s: number, r: { total_correct: number }) => s + (r.total_correct || 0), 0
        );
        const sda = new Date();
        sda.setDate(sda.getDate() - 7);
        const sdaStr = sda.toISOString().split("T")[0];
        const active7d = (pData || []).filter(
          (p: { last_active_date: string | null }) => p.last_active_date && p.last_active_date >= sdaStr
        ).length;

        childOrgRows.push({
          org_id: org.id,
          org_name: org.name,
          org_type: org.type,
          total_students: stuIds.length,
          avg_problems_solved: Math.round(solved / stuIds.length),
          avg_accuracy: solved > 0 ? Math.round((correct / solved) * 100) : 0,
          active_last_7d: active7d,
        });
      }

      childOrgRows.sort((a, b) => b.avg_problems_solved - a.avg_problems_solved);
    }
  }

  return { rows: classRows, childOrgRows };
}
