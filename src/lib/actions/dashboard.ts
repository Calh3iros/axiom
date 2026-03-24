"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isElevated, isManager } from "@/types/roles";

// ─── Types ───────────────────────────────────────────────────────────────

export interface DateRange {
  startDate: string; // ISO YYYY-MM-DD
  endDate: string;
}

// ─── Auth Helpers ────────────────────────────────────────────────────────

async function getManagerRole(
  orgId: string
): Promise<{ userId: string; role: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Use supabaseAdmin — memberships created server-side (invite codes,
  // admin scripts) may not be readable via user client due to RLS.

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (membership) {
    if (!isElevated(membership.role)) return null;
    return { userId: user.id, role: membership.role };
  }

  // Super_admin bypass: read-only director-level access without membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabaseAdmin.from("profiles") as any)
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  if (profile?.is_super_admin) return { userId: user.id, role: "director" };

  return null;
}

async function getClassOrgId(
  classId: string
): Promise<{ orgId: string; teacherId: string | null } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("classes") as any)
    .select("org_id, teacher_id")
    .eq("id", classId)
    .single();
  return data ? { orgId: data.org_id, teacherId: data.teacher_id } : null;
}

async function getClassStudentIds(classId: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("class_memberships") as any)
    .select("user_id")
    .eq("class_id", classId);
  return (data || []).map((m: { user_id: string }) => m.user_id);
}

// ─── Time Buckets ────────────────────────────────────────────────────────

function getDefaultRange(): DateRange {
  const now = new Date();
  return {
    startDate: new Date(now.getTime() - 30 * 86400000)
      .toISOString()
      .split("T")[0],
    endDate: now.toISOString().split("T")[0],
  };
}

function computeTimeBuckets(
  startDate: string,
  endDate: string
): { label: string; start: Date; end: Date }[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);

  if (diffDays <= 7) {
    // Daily buckets
    const buckets = [];
    for (let d = 0; d < diffDays; d++) {
      const bStart = new Date(start.getTime() + d * 86400000);
      const bEnd = new Date(start.getTime() + (d + 1) * 86400000);
      buckets.push({
        label: `${bStart.getMonth() + 1}/${bStart.getDate()}`,
        start: bStart,
        end: bEnd,
      });
    }
    return buckets;
  } else if (diffDays <= 90) {
    // Weekly buckets
    const weeks = Math.ceil(diffDays / 7);
    const buckets = [];
    for (let w = 0; w < weeks; w++) {
      const wStart = new Date(start.getTime() + w * 7 * 86400000);
      const wEnd = new Date(
        Math.min(start.getTime() + (w + 1) * 7 * 86400000, end.getTime())
      );
      buckets.push({
        label: `${wStart.getMonth() + 1}/${wStart.getDate()}`,
        start: wStart,
        end: wEnd,
      });
    }
    return buckets;
  } else {
    // Monthly buckets
    const buckets = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor < end) {
      const mStart = new Date(cursor);
      cursor.setMonth(cursor.getMonth() + 1);
      const mEnd = new Date(Math.min(cursor.getTime(), end.getTime()));
      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      buckets.push({
        label: monthNames[mStart.getMonth()],
        start: mStart,
        end: mEnd,
      });
    }
    return buckets;
  }
}

// ─── Teacher Dashboard ──────────────────────────────────────────────────

export async function getTeacherDashboard(
  classId: string,
  dateRange?: DateRange
) {
  const classInfo = await getClassOrgId(classId);
  if (!classInfo) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let authorized = classInfo.teacherId === user.id;
  if (!authorized) {
    const mgr = await getManagerRole(classInfo.orgId);
    if (mgr && isManager(mgr.role)) authorized = true;
  }
  if (!authorized) return null;

  const studentIds = await getClassStudentIds(classId);
  if (studentIds.length === 0) {
    return { empty: true, studentCount: 0 };
  }

  const { startDate, endDate } = dateRange || getDefaultRange();
  const now = new Date(endDate + "T23:59:59Z");
  const startISO = new Date(startDate).toISOString();
  const diffDays = Math.ceil(
    (now.getTime() - new Date(startDate).getTime()) / 86400000
  );
  const inactiveThreshold = Math.max(7, Math.round(diffDays * 0.15));
  const inactiveDate = new Date(now.getTime() - inactiveThreshold * 86400000)
    .toISOString()
    .split("T")[0];

  // Batch fetch all data (filtered by date range)
  const [profilesRes, challengeRes, usageRes, kmRes, spRes] = await Promise.all(
    [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("profiles") as any)
        .select("id, full_name, email, last_active_date, current_streak")
        .in("id", studentIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("challenge_log") as any)
        .select("user_id, topic, subject, created_at")
        .in("user_id", studentIds)
        .gte("created_at", startISO)
        .lte("created_at", new Date(endDate + "T23:59:59Z").toISOString())
        .order("created_at"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("usage") as any)
        .select("user_id, date, solves, writes, learns")
        .in("user_id", studentIds)
        .gte("date", startDate)
        .lte("date", endDate),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("subjects") as any)
        .select("user_id, mastery_pct")
        .in("user_id", studentIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("student_profiles") as any)
        .select("id, total_problems_solved, total_correct")
        .in("id", studentIds),
    ]
  );

  const profiles = profilesRes.data || [];
  const challenges = challengeRes.data || [];
  const usageData = usageRes.data || [];
  const kmData = kmRes.data || [];
  const spData = spRes.data || [];

  // Active within period

  const activeInPeriod = profiles.filter(
    (p: any) => p.last_active_date && p.last_active_date >= startDate
  ).length;

  // Accuracy from student_profiles (all-time, since challenge_log doesn't have is_correct)

  const spMap = new Map<string, { solved: number; correct: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spData.forEach((sp: any) => {
    spMap.set(sp.id, {
      solved: sp.total_problems_solved || 0,
      correct: sp.total_correct || 0,
    });
  });
  const totalSolvedFromSP = spData.reduce(
    (s: number, sp: any) => s + (sp.total_problems_solved || 0),
    0
  );

  const totalCorrectFromSP = spData.reduce(
    (s: number, sp: any) => s + (sp.total_correct || 0),
    0
  );

  // Period-based solved count from challenge_log
  const totalSolvedInPeriod = challenges.length;
  // Per-student challenge count in period
  const studentChallengeCount = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challenges.forEach((c: any) => {
    studentChallengeCount.set(
      c.user_id,
      (studentChallengeCount.get(c.user_id) || 0) + 1
    );
  });

  const avgSolved = Math.round(totalSolvedInPeriod / studentIds.length);
  const avgAccuracy =
    totalSolvedFromSP > 0
      ? Math.round((totalCorrectFromSP / totalSolvedFromSP) * 100)
      : 0;

  const avgStreak = Math.round(
    profiles.reduce((s: number, p: any) => s + (p.current_streak || 0), 0) /
      studentIds.length
  );

  // Evolution with dynamic time buckets
  const buckets = computeTimeBuckets(startDate, endDate);
  const evolution = buckets.map((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bChallenges = challenges.filter((c: any) => {
      const d = new Date(c.created_at);
      return d >= b.start && d < b.end;
    });
    const solved = bChallenges.length;
    return {
      week: b.label,
      solved,
      accuracy: avgAccuracy, // Use all-time accuracy since we can't compute per-bucket
    };
  });

  // Accuracy distribution (from student_profiles, per student)
  const accuracyBuckets = [0, 0, 0, 0, 0];
  const accuracyLabels = ["0-30%", "30-50%", "50-70%", "70-90%", "90-100%"];
  studentIds.forEach((sid: string) => {
    const sp = spMap.get(sid);
    const acc = sp && sp.solved > 0 ? (sp.correct / sp.solved) * 100 : 0;
    if (acc < 30) accuracyBuckets[0]++;
    else if (acc < 50) accuracyBuckets[1]++;
    else if (acc < 70) accuracyBuckets[2]++;
    else if (acc < 90) accuracyBuckets[3]++;
    else accuracyBuckets[4]++;
  });
  const accuracyDist = accuracyLabels.map((label, i) => ({
    range: label,
    count: accuracyBuckets[i],
  }));

  // Top 5 error topics (based on frequency — we can't track correctness per challenge)
  const topicCounts = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challenges.forEach((c: any) => {
    const key = `${c.subject} — ${c.topic}`;
    topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
  });
  // Show topics with lowest avg accuracy from student_profiles
  // Since we can't track per-topic errors without is_correct, show most-practiced topics
  const topErrors = Array.from(topicCounts.entries())
    .map(([topic, total]) => ({ topic, errors: 0, total, errorRate: 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Inactive students (relative to period)

  const inactiveStudents = profiles
    .filter((p: any) => {
      if (!p.last_active_date) return true;
      return p.last_active_date < inactiveDate;
    })
    .map((p: any) => ({
      name: p.full_name || p.email?.split("@")[0] || "User",
      lastActive: p.last_active_date,
      daysInactive: p.last_active_date
        ? Math.floor(
            (now.getTime() - new Date(p.last_active_date).getTime()) / 86400000
          )
        : 999,
    }))
    .sort(
      (a: { daysInactive: number }, b: { daysInactive: number }) =>
        b.daysInactive - a.daysInactive
    )
    .slice(0, 10);

  // Top 10 Students for Class PDF
  const topStudents = profiles
    .map((p: any) => {
      const sp = spMap.get(p.id) || { solved: 0, correct: 0 };
      const km = kmData.find((k: any) => k.user_id === p.id);
      const acc = sp.solved > 0 ? Math.round((sp.correct / sp.solved) * 100) : 0;
      const pct = km?.mastery_pct || 0;
      const level = Math.min(4, Math.floor(pct / 20));
      return {
        name: p.full_name || p.email?.split("@")[0] || "User",
        solved: sp.solved,
        accuracy: acc,
        streak: p.current_streak || 0,
        level: level
      };
    })
    .sort((a: any, b: any) => b.solved - a.solved || b.accuracy - a.accuracy)
    .slice(0, 10);

  // Module usage
  const modules = { solves: 0, writes: 0, learns: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usageData.forEach((u: any) => {
    modules.solves += u.solves || 0;
    modules.writes += u.writes || 0;
    modules.learns += u.learns || 0;
  });
  const moduleUsage = Object.entries(modules).map(([name, value]) => ({
    name,
    value,
  }));

  // Mastery distribution (current snapshot, not period-dependent)
  const masteryBuckets = [0, 0, 0, 0, 0];
  const masteryLabels = [
    "Iniciante",
    "Básico",
    "Intermediário",
    "Avançado",
    "Expert",
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kmData.forEach((km: any) => {
    const pct = km.mastery_pct || 0;
    const level = Math.min(4, Math.floor(pct / 20));
    masteryBuckets[level]++;
  });
  const masteryDist = masteryLabels.map((label, i) => ({
    level: label,
    count: masteryBuckets[i],
  }));

  return {
    empty: false,
    studentCount: studentIds.length,
    active7d: activeInPeriod,
    avgSolved,
    avgAccuracy,
    avgStreak,
    weeklyEvolution: evolution,
    accuracyDist,
    topErrors,
    inactiveStudents,
    topStudents,
    moduleUsage,
    masteryDist,
  };
}

// ─── Director Dashboard ─────────────────────────────────────────────────

export async function getDirectorDashboard(
  orgId: string,
  dateRange?: DateRange
) {
  const mgr = await getManagerRole(orgId);
  if (!mgr || !isManager(mgr.role)) return null;

  const { startDate, endDate } = dateRange || getDefaultRange();
  const startISO = new Date(startDate).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classes } = await (supabaseAdmin.from("classes") as any)
    .select("id, name")
    .eq("org_id", orgId);

  if (!classes || classes.length === 0) return { empty: true, classCount: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classComparison: any[] = [];
  let totalStudentsAll = 0;
  let totalSolvedAll = 0;
  let totalCorrectAll = 0;
  let totalSolvedFromSP = 0;
  let activeAll = 0;
  let totalStreakAll = 0;

  for (const cls of classes) {
    const sids = await getClassStudentIds(cls.id);
    if (sids.length === 0) {
      classComparison.push({
        classId: cls.id,
        className: cls.name,
        students: 0,
        active7d: 0,
        avgSolved: 0,
        avgAccuracy: 0,
        adoption: 0,
      });
      continue;
    }

    const [pRes, challengeRes, spRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("profiles") as any)
        .select("id, last_active_date, current_streak")
        .in("id", sids),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("challenge_log") as any)
        .select("user_id")
        .in("user_id", sids)
        .gte("created_at", startISO)
        .lte("created_at", new Date(endDate + "T23:59:59Z").toISOString()),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("student_profiles") as any)
        .select("id, total_problems_solved, total_correct")
        .in("id", sids),
    ]);

    const profs = pRes.data || [];
    const chals = challengeRes.data || [];
    const spRows = spRes.data || [];

    const classActive = profs.filter(
      (p: any) => p.last_active_date && p.last_active_date >= startDate
    ).length;
    const classSolved = chals.length;
    // Accuracy from student_profiles (all-time)

    const classTotalSolved = spRows.reduce(
      (s: number, sp: any) => s + (sp.total_problems_solved || 0),
      0
    );

    const classTotalCorrect = spRows.reduce(
      (s: number, sp: any) => s + (sp.total_correct || 0),
      0
    );

    const classStreak = profs.reduce(
      (s: number, p: any) => s + (p.current_streak || 0),
      0
    );

    classComparison.push({
      classId: cls.id,
      className: cls.name,
      students: sids.length,
      active7d: classActive,
      avgSolved: Math.round(classSolved / sids.length),
      avgAccuracy:
        classTotalSolved > 0
          ? Math.round((classTotalCorrect / classTotalSolved) * 100)
          : 0,
      adoption: Math.round((classActive / sids.length) * 100),
    });

    totalStudentsAll += sids.length;
    totalSolvedAll += classSolved;
    totalCorrectAll += classTotalCorrect;
    activeAll += classActive;
    totalStreakAll += classStreak;
    totalSolvedFromSP += classTotalSolved;
  }

  // Weekly/daily evolution (school-wide)
  const allStudentIds = (
    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      classes.map((c: any) => getClassStudentIds(c.id))
    )
  ).flat();

  const { data: challengeData } = await (
    supabaseAdmin.from("challenge_log") as any
  )
    .select("created_at")
    .in("user_id", allStudentIds.length > 0 ? allStudentIds : ["__none__"])
    .gte("created_at", startISO)
    .lte("created_at", new Date(endDate + "T23:59:59Z").toISOString())
    .order("created_at");

  const buckets = computeTimeBuckets(startDate, endDate);
  const weeklyEvolution = buckets.map((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = (challengeData || []).filter((c: any) => {
      const d = new Date(c.created_at);
      return d >= b.start && d < b.end;
    }).length;
    return { week: b.label, solved: count };
  });

  // Engagement alerts (last 2 weeks within range)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engagementAlerts: any[] = [];
  const endDt = new Date(endDate + "T23:59:59Z");
  const oneWeekBefore = new Date(endDt.getTime() - 7 * 86400000);
  const twoWeeksBefore = new Date(endDt.getTime() - 14 * 86400000);

  for (const cls of classComparison) {
    if (cls.students === 0) continue;
    const sids = await getClassStudentIds(cls.classId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tw } = await (supabaseAdmin.from("challenge_log") as any)
      .select("id")
      .in("user_id", sids)
      .gte("created_at", oneWeekBefore.toISOString())
      .lte("created_at", endDt.toISOString());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lw } = await (supabaseAdmin.from("challenge_log") as any)
      .select("id")
      .in("user_id", sids)
      .gte("created_at", twoWeeksBefore.toISOString())
      .lt("created_at", oneWeekBefore.toISOString());

    const twCount = tw?.length || 0;
    const lwCount = lw?.length || 0;
    if (lwCount > 0 && twCount < lwCount * 0.7) {
      engagementAlerts.push({
        className: cls.className,
        thisWeek: twCount,
        lastWeek: lwCount,
        dropPct: Math.round(((lwCount - twCount) / lwCount) * 100),
      });
    }
  }

  return {
    empty: false,
    classCount: classes.length,
    totalStudents: totalStudentsAll,
    totalSolved: totalSolvedAll,
    overallAccuracy:
      totalSolvedFromSP > 0
        ? Math.round((totalCorrectAll / totalSolvedFromSP) * 100)
        : 0,
    active7d: activeAll,
    avgStreak:
      totalStudentsAll > 0 ? Math.round(totalStreakAll / totalStudentsAll) : 0,
    adoption:
      totalStudentsAll > 0
        ? Math.round((activeAll / totalStudentsAll) * 100)
        : 0,
    classComparison,
    weeklyEvolution,
    engagementAlerts,
  };
}

// ─── Secretary / Network Dashboard ──────────────────────────────────────

export async function getSecretaryDashboard(
  orgId: string,
  dateRange?: DateRange
) {
  const mgr = await getManagerRole(orgId);
  if (!mgr || !isManager(mgr.role)) return null;

  const { startDate, endDate } = dateRange || getDefaultRange();
  const startISO = new Date(startDate).toISOString();
  const endISO = new Date(endDate + "T23:59:59Z").toISOString();

  // Use supabaseAdmin for RPC — SECURITY DEFINER handles permissions,
  // but supabaseAdmin avoids any RLS edge cases with the user client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subtree } = await (supabaseAdmin as any).rpc(
    "get_org_subtree",
    {
      root_id: orgId,
    }
  );
  const childIds = (subtree || [])
    .filter((n: { depth: number }) => n.depth > 0)
    .map((n: { org_id: string }) => n.org_id);

  if (childIds.length === 0) return { empty: true, schoolCount: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: childOrgs } = await (supabaseAdmin.from("organizations") as any)
    .select("id, name, type")
    .in("id", childIds);

  if (!childOrgs || childOrgs.length === 0)
    return { empty: true, schoolCount: 0 };

  // ─── Batch: memberships for ALL child orgs ───────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allMemberships } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("user_id, org_id, role")
    .in("org_id", childIds);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allClasses } = await (supabaseAdmin.from("classes") as any)
    .select("id, org_id")
    .in("org_id", childIds);

  // Index by org_id
  const membersByOrg = new Map<string, { user_id: string; role: string }[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (allMemberships || []).forEach((m: any) => {
    if (!membersByOrg.has(m.org_id)) membersByOrg.set(m.org_id, []);
    membersByOrg.get(m.org_id)!.push(m);
  });

  const classesByOrg = new Map<string, string[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (allClasses || []).forEach((c: any) => {
    if (!classesByOrg.has(c.org_id)) classesByOrg.set(c.org_id, []);
    classesByOrg.get(c.org_id)!.push(c.id);
  });

  // Collect ALL student IDs across all child orgs
  const allStudentIds: string[] = [];
  const studentsByOrg = new Map<string, string[]>();
  for (const org of childOrgs) {
    const members = membersByOrg.get(org.id) || [];
    const sids = members
      .filter((m) => m.role === "student")
      .map((m) => m.user_id);
    studentsByOrg.set(org.id, sids);
    allStudentIds.push(...sids);
  }

  const uniqueStudentIds = [...new Set(allStudentIds)];

  // ─── Batch: profiles, challenge_log, student_profiles ────────────
  const [profilesRes, challengeRes, spRes] = await Promise.all([
    uniqueStudentIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("profiles") as any)
          .select("id, last_active_date, current_streak")
          .in("id", uniqueStudentIds)
      : { data: [] },
    uniqueStudentIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("challenge_log") as any)
          .select("user_id, created_at")
          .in("user_id", uniqueStudentIds)
          .gte("created_at", startISO)
          .lte("created_at", endISO)
          .order("created_at")
      : { data: [] },
    uniqueStudentIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("student_profiles") as any)
          .select("id, total_problems_solved, total_correct")
          .in("id", uniqueStudentIds)
      : { data: [] },
  ]);

  // Index profile data
  const profileMap = new Map<
    string,
    { last_active_date: string | null; current_streak: number }
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (profilesRes.data || []).forEach((p: any) => {
    profileMap.set(p.id, {
      last_active_date: p.last_active_date,
      current_streak: p.current_streak || 0,
    });
  });

  const spMap = new Map<string, { solved: number; correct: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (spRes.data || []).forEach((sp: any) => {
    spMap.set(sp.id, {
      solved: sp.total_problems_solved || 0,
      correct: sp.total_correct || 0,
    });
  });

  // Index challenge_log by user
  const challengesByUser = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (challengeRes.data || []).forEach((c: any) => {
    challengesByUser.set(c.user_id, (challengesByUser.get(c.user_id) || 0) + 1);
  });

  // ─── Per-school metrics ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schoolComparison: any[] = [];
  let kpiTotalStudents = 0;
  let kpiActiveStudents = 0;
  let kpiTotalTeachers = 0;
  let kpiTotalClasses = 0;
  let kpiTotalExercises = 0;
  let kpiTotalSolvedSP = 0;
  let kpiTotalCorrectSP = 0;
  let kpiTotalStreak = 0;

  for (const org of childOrgs) {
    const sids = studentsByOrg.get(org.id) || [];
    const members = membersByOrg.get(org.id) || [];
    const teacherCount = members.filter(
      (m) => m.role === "teacher" || m.role === "coordinator"
    ).length;
    const classCount = (classesByOrg.get(org.id) || []).length;

    // Per-school metrics
    let active = 0;
    let solved = 0;
    let totalSolvedSP = 0;
    let totalCorrectSP = 0;
    let totalStreak = 0;

    for (const sid of sids) {
      const prof = profileMap.get(sid);
      if (prof?.last_active_date && prof.last_active_date >= startDate)
        active++;
      totalStreak += prof?.current_streak || 0;
      solved += challengesByUser.get(sid) || 0;
      const sp = spMap.get(sid);
      totalSolvedSP += sp?.solved || 0;
      totalCorrectSP += sp?.correct || 0;
    }

    const accuracy =
      totalSolvedSP > 0
        ? Math.round((totalCorrectSP / totalSolvedSP) * 100)
        : 0;
    const adoption =
      sids.length > 0 ? Math.round((active / sids.length) * 100) : 0;
    const avgStreak =
      sids.length > 0 ? Math.round(totalStreak / sids.length) : 0;
    // Score: accuracy*0.4 + adoption*0.3 + (streak normalized to 100)*0.3
    const streakNorm = Math.min(100, avgStreak * 10); // 10-day streak = 100%
    const score = Math.round(
      accuracy * 0.4 + adoption * 0.3 + streakNorm * 0.3
    );
    const status = score >= 70 ? "green" : score >= 50 ? "yellow" : "red";

    schoolComparison.push({
      orgId: org.id,
      orgName: org.name,
      orgType: org.type,
      students: sids.length,
      active7d: active,
      teachers: teacherCount,
      classes: classCount,
      avgSolved: sids.length > 0 ? Math.round(solved / sids.length) : 0,
      avgAccuracy: accuracy,
      adoption,
      avgStreak,
      score,
      status,
    });

    kpiTotalStudents += sids.length;
    kpiActiveStudents += active;
    kpiTotalTeachers += teacherCount;
    kpiTotalClasses += classCount;
    kpiTotalExercises += solved;
    kpiTotalSolvedSP += totalSolvedSP;
    kpiTotalCorrectSP += totalCorrectSP;
    kpiTotalStreak += totalStreak;
  }

  schoolComparison.sort((a, b) => b.score - a.score);

  // ─── Network KPIs ────────────────────────────────────────────────
  const kpis = {
    totalStudents: kpiTotalStudents,
    activeStudents: kpiActiveStudents,
    totalTeachers: kpiTotalTeachers,
    totalClasses: kpiTotalClasses,
    avgAccuracy:
      kpiTotalSolvedSP > 0
        ? Math.round((kpiTotalCorrectSP / kpiTotalSolvedSP) * 100)
        : 0,
    totalExercises: kpiTotalExercises,
    avgStreak:
      kpiTotalStudents > 0 ? Math.round(kpiTotalStreak / kpiTotalStudents) : 0,
    adoption:
      kpiTotalStudents > 0
        ? Math.round((kpiActiveStudents / kpiTotalStudents) * 100)
        : 0,
  };

  // ─── Weekly Evolution (network-wide) ─────────────────────────────
  const buckets = computeTimeBuckets(startDate, endDate);
  const allChallenges = challengeRes.data || [];
  const weeklyEvolution = buckets.map((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = allChallenges.filter((c: any) => {
      const d = new Date(c.created_at);
      return d >= b.start && d < b.end;
    }).length;
    return { week: b.label, exercises: count };
  });

  // ─── Alerts ──────────────────────────────────────────────────────

  const alerts: {
    type: string;
    message: string;
    orgName: string;
    severity: string;
  }[] = [];

  for (const school of schoolComparison) {
    if (school.status === "red") {
      alerts.push({
        type: "low_score",
        message: `Score ${school.score}% — abaixo do esperado`,
        orgName: school.orgName,
        severity: "error",
      });
    }
    if (school.adoption < 30 && school.students > 0) {
      alerts.push({
        type: "low_adoption",
        message: `Adoção ${school.adoption}% — ${school.active7d}/${school.students} alunos ativos`,
        orgName: school.orgName,
        severity: "warning",
      });
    }
    if (school.students === 0) {
      alerts.push({
        type: "empty_school",
        message: "Sem alunos cadastrados",
        orgName: school.orgName,
        severity: "info",
      });
    }
  }

  return {
    empty: false,
    schoolCount: childOrgs.length,
    schoolComparison,
    kpis,
    weeklyEvolution,
    alerts,
  };
}
