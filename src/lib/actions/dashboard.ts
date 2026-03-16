"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ─── Auth Helpers ────────────────────────────────────────────────────────

async function getManagerRole(orgId: string): Promise<{ userId: string; role: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase.from("org_memberships") as any)
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (!membership) return null;
  const elevated = ["teacher", "admin", "director", "secretary"];
  if (!elevated.includes(membership.role)) return null;
  return { userId: user.id, role: membership.role };
}

async function getClassOrgId(classId: string): Promise<{ orgId: string; teacherId: string | null } | null> {
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
    .select("user_id").eq("class_id", classId);
  return (data || []).map((m: { user_id: string }) => m.user_id);
}

// ─── Teacher Dashboard ──────────────────────────────────────────────────

export async function getTeacherDashboard(classId: string) {
  const classInfo = await getClassOrgId(classId);
  if (!classInfo) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify: teacher of this class OR elevated role in org
  let authorized = classInfo.teacherId === user.id;
  if (!authorized) {
    const mgr = await getManagerRole(classInfo.orgId);
    if (mgr && ["admin", "director", "secretary"].includes(mgr.role)) authorized = true;
  }
  if (!authorized) return null;

  const studentIds = await getClassStudentIds(classId);
  if (studentIds.length === 0) {
    return { empty: true, studentCount: 0 };
  }

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const d84 = new Date(now.getTime() - 84 * 86400000).toISOString();

  // Batch fetch all data
  const [profilesRes, spRes, challengeRes, usageRes, kmRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("profiles") as any)
      .select("id, full_name, email, last_active_date, current_streak")
      .in("id", studentIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("student_profiles") as any)
      .select("id, total_problems_solved, total_correct")
      .in("id", studentIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("challenge_log") as any)
      .select("user_id, is_correct, topic, subject, created_at")
      .in("user_id", studentIds)
      .gte("created_at", d84)
      .order("created_at"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("usage") as any)
      .select("user_id, date, solves, writes, learns")
      .in("user_id", studentIds)
      .gte("date", d84.split("T")[0]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("subjects") as any)
      .select("user_id, mastery_pct")
      .in("user_id", studentIds),
  ]);

  const profiles = profilesRes.data || [];
  const spData = spRes.data || [];
  const challenges = challengeRes.data || [];
  const usageData = usageRes.data || [];
  const kmData = kmRes.data || [];

  // Active vs inactive (7d)
  const active7d = profiles.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => p.last_active_date && p.last_active_date >= d7
  ).length;

  // Avg problems solved
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSolved = spData.reduce((s: number, p: any) => s + (p.total_problems_solved || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCorrect = spData.reduce((s: number, p: any) => s + (p.total_correct || 0), 0);
  const avgSolved = Math.round(totalSolved / studentIds.length);
  const avgAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgStreak = Math.round(profiles.reduce((s: number, p: any) => s + (p.current_streak || 0), 0) / studentIds.length);

  // Weekly evolution (12 weeks) — problems solved per week
  const weeklyEvolution: { week: string; solved: number; accuracy: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const wStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
    const wEnd = new Date(now.getTime() - w * 7 * 86400000);
    const label = `${wStart.getMonth() + 1}/${wStart.getDate()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weekChallenges = challenges.filter((c: any) => {
      const d = new Date(c.created_at);
      return d >= wStart && d < wEnd;
    });
    const wSolved = weekChallenges.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wCorrect = weekChallenges.filter((c: any) => c.is_correct).length;
    weeklyEvolution.push({
      week: label,
      solved: wSolved,
      accuracy: wSolved > 0 ? Math.round((wCorrect / wSolved) * 100) : 0,
    });
  }

  // Accuracy distribution (histogram by student)
  const accuracyBuckets = [0, 0, 0, 0, 0]; // 0-30, 30-50, 50-70, 70-90, 90-100
  const accuracyLabels = ["0-30%", "30-50%", "50-70%", "70-90%", "90-100%"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spData.forEach((sp: any) => {
    const solved = sp.total_problems_solved || 0;
    const correct = sp.total_correct || 0;
    const acc = solved > 0 ? (correct / solved) * 100 : 0;
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

  // Top 5 topics with most errors
  const topicErrors = new Map<string, { errors: number; total: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challenges.forEach((c: any) => {
    const key = `${c.subject} — ${c.topic}`;
    const entry = topicErrors.get(key) || { errors: 0, total: 0 };
    entry.total++;
    if (!c.is_correct) entry.errors++;
    topicErrors.set(key, entry);
  });
  const topErrors = Array.from(topicErrors.entries())
    .map(([topic, { errors, total }]) => ({
      topic,
      errors,
      total,
      errorRate: Math.round((errors / total) * 100),
    }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 5);

  // Inactive students (7+ days)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inactiveStudents = profiles.filter((p: any) => {
    if (!p.last_active_date) return true;
    return p.last_active_date < d7;
  })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => {
      const daysInactive = p.last_active_date
        ? Math.floor((now.getTime() - new Date(p.last_active_date).getTime()) / 86400000)
        : 999;
      return {
        name: p.full_name || p.email?.split("@")[0] || "User",
        lastActive: p.last_active_date,
        daysInactive,
      };
    })
    .sort((a: { daysInactive: number }, b: { daysInactive: number }) => b.daysInactive - a.daysInactive)
    .slice(0, 10);

  // Module usage
  const modules = { solves: 0, writes: 0, learns: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usageData.forEach((u: any) => {
    modules.solves += u.solves || 0;
    modules.writes += u.writes || 0;
    modules.learns += u.learns || 0;
  });
  const moduleUsage = Object.entries(modules).map(([name, value]) => ({ name, value }));

  // Mastery distribution
  const masteryBuckets = [0, 0, 0, 0, 0]; // levels 1-5 mapped from mastery_pct
  const masteryLabels = ["Iniciante", "Básico", "Intermediário", "Avançado", "Expert"];
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
    active7d,
    avgSolved,
    avgAccuracy,
    avgStreak,
    weeklyEvolution,
    accuracyDist,
    topErrors,
    inactiveStudents,
    moduleUsage,
    masteryDist,
  };
}

// ─── Director Dashboard ─────────────────────────────────────────────────

export async function getDirectorDashboard(orgId: string) {
  const mgr = await getManagerRole(orgId);
  if (!mgr || !["admin", "director", "secretary"].includes(mgr.role)) return null;

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const d84 = new Date(now.getTime() - 84 * 86400000).toISOString();

  // Get all classes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classes } = await (supabaseAdmin.from("classes") as any)
    .select("id, name").eq("org_id", orgId);

  if (!classes || classes.length === 0) return { empty: true, classCount: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classComparison: any[] = [];
  let totalStudentsAll = 0;
  let totalSolvedAll = 0;
  let totalCorrectAll = 0;
  let active7dAll = 0;
  let totalStreakAll = 0;

  // Per-class metrics
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

    const [pRes, spRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("profiles") as any)
        .select("id, last_active_date, current_streak")
        .in("id", sids),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("student_profiles") as any)
        .select("id, total_problems_solved, total_correct")
        .in("id", sids),
    ]);

    const profs = pRes.data || [];
    const sps = spRes.data || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classActive = profs.filter((p: any) => p.last_active_date && p.last_active_date >= d7).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classSolved = sps.reduce((s: number, p: any) => s + (p.total_problems_solved || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classCorrect = sps.reduce((s: number, p: any) => s + (p.total_correct || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classStreak = profs.reduce((s: number, p: any) => s + (p.current_streak || 0), 0);

    classComparison.push({
      classId: cls.id,
      className: cls.name,
      students: sids.length,
      active7d: classActive,
      avgSolved: Math.round(classSolved / sids.length),
      avgAccuracy: classSolved > 0 ? Math.round((classCorrect / classSolved) * 100) : 0,
      adoption: Math.round((classActive / sids.length) * 100),
    });

    totalStudentsAll += sids.length;
    totalSolvedAll += classSolved;
    totalCorrectAll += classCorrect;
    active7dAll += classActive;
    totalStreakAll += classStreak;
  }

  // Weekly evolution (school-wide)
  const allStudentIds = (await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classes.map((c: any) => getClassStudentIds(c.id))
  )).flat();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: challengeData } = await (supabaseAdmin.from("challenge_log") as any)
    .select("created_at")
    .in("user_id", allStudentIds.length > 0 ? allStudentIds : ["__none__"])
    .gte("created_at", d84)
    .order("created_at");

  const weeklyEvolution: { week: string; solved: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const wStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
    const wEnd = new Date(now.getTime() - w * 7 * 86400000);
    const label = `${wStart.getMonth() + 1}/${wStart.getDate()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = (challengeData || []).filter((c: any) => {
      const d = new Date(c.created_at);
      return d >= wStart && d < wEnd;
    }).length;
    weeklyEvolution.push({ week: label, solved: count });
  }

  // Engagement alerts (classes where this week < last week)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engagementAlerts: any[] = [];
  for (const cls of classComparison) {
    if (cls.students === 0) continue;
    const sids = await getClassStudentIds(cls.classId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: thisWeek } = await (supabaseAdmin.from("challenge_log") as any)
      .select("id", { count: "exact", head: true })
      .in("user_id", sids)
      .gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastWeek, count: lwCount } = await (supabaseAdmin.from("challenge_log") as any)
      .select("id", { count: "exact", head: true })
      .in("user_id", sids)
      .gte("created_at", new Date(now.getTime() - 14 * 86400000).toISOString())
      .lt("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());

    const tw = thisWeek?.length || 0;
    const lw = lwCount || lastWeek?.length || 0;
    if (lw > 0 && tw < lw * 0.7) {
      engagementAlerts.push({
        className: cls.className,
        thisWeek: tw,
        lastWeek: lw,
        dropPct: Math.round(((lw - tw) / lw) * 100),
      });
    }
  }

  return {
    empty: false,
    classCount: classes.length,
    totalStudents: totalStudentsAll,
    totalSolved: totalSolvedAll,
    overallAccuracy: totalSolvedAll > 0 ? Math.round((totalCorrectAll / totalSolvedAll) * 100) : 0,
    active7d: active7dAll,
    avgStreak: totalStudentsAll > 0 ? Math.round(totalStreakAll / totalStudentsAll) : 0,
    adoption: totalStudentsAll > 0 ? Math.round((active7dAll / totalStudentsAll) * 100) : 0,
    classComparison,
    weeklyEvolution,
    engagementAlerts,
  };
}

// ─── Secretary Dashboard ─────────────────────────────────────────────────

export async function getSecretaryDashboard(orgId: string) {
  const mgr = await getManagerRole(orgId);
  if (!mgr || !["admin", "secretary"].includes(mgr.role)) return null;

  const supabase = await createClient();
  const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // Get child orgs via subtree
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subtree } = await (supabase as any).rpc("get_org_subtree", { root_id: orgId });
  const childIds = (subtree || [])
    .filter((n: { depth: number }) => n.depth > 0)
    .map((n: { org_id: string }) => n.org_id);

  if (childIds.length === 0) return { empty: true, schoolCount: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: childOrgs } = await (supabaseAdmin.from("organizations") as any)
    .select("id, name, type").in("id", childIds);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schoolComparison: any[] = [];
  for (const org of childOrgs || []) {
    // Get all students in this org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabaseAdmin.from("org_memberships") as any)
      .select("user_id").eq("org_id", org.id).eq("role", "student");
    const sids = (members || []).map((m: { user_id: string }) => m.user_id);

    if (sids.length === 0) {
      schoolComparison.push({
        orgId: org.id,
        orgName: org.name,
        orgType: org.type,
        students: 0,
        active7d: 0,
        avgSolved: 0,
        avgAccuracy: 0,
        adoption: 0,
      });
      continue;
    }

    const [pRes, spRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("profiles") as any)
        .select("id, last_active_date").in("id", sids),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabaseAdmin.from("student_profiles") as any)
        .select("id, total_problems_solved, total_correct").in("id", sids),
    ]);

    const profs = pRes.data || [];
    const sps = spRes.data || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = profs.filter((p: any) => p.last_active_date && p.last_active_date >= d7).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const solved = sps.reduce((s: number, p: any) => s + (p.total_problems_solved || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const correct = sps.reduce((s: number, p: any) => s + (p.total_correct || 0), 0);

    schoolComparison.push({
      orgId: org.id,
      orgName: org.name,
      orgType: org.type,
      students: sids.length,
      active7d: active,
      avgSolved: Math.round(solved / sids.length),
      avgAccuracy: solved > 0 ? Math.round((correct / solved) * 100) : 0,
      adoption: Math.round((active / sids.length) * 100),
    });
  }

  schoolComparison.sort((a, b) => b.avgSolved - a.avgSolved);

  return {
    empty: false,
    schoolCount: childOrgs?.length || 0,
    schoolComparison,
  };
}
