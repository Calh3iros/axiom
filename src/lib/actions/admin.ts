"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ─── Auth Guard ──────────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) throw new Error("Forbidden");
  return user;
}

// ─── Approvals ───────────────────────────────────────────────────────────

export async function getAllOrgs(status?: string) {
  await requireSuperAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabaseAdmin.from("organizations") as any)
    .select("id, name, type, status, created_at, requested_at, requested_by_name, requested_by_email, requested_by_role, requested_by_phone, institution_id, request_message, rejection_reason, approved_at")
    .order("requested_at", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPendingOrgsCount() {
  await requireSuperAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabaseAdmin.from("organizations") as any)
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return count || 0;
}

export async function approveOrg(orgId: string) {
  await requireSuperAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("organizations") as any)
    .update({ status: "active", approved_at: new Date().toISOString() })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function rejectOrg(orgId: string, reason: string) {
  await requireSuperAdmin();

  if (!reason?.trim()) throw new Error("Rejection reason is required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("organizations") as any)
    .update({ status: "rejected", rejection_reason: reason.trim() })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function suspendOrg(orgId: string) {
  await requireSuperAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("organizations") as any)
    .update({ status: "suspended" })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ─── Platform KPIs ───────────────────────────────────────────────────────

export async function getAdminPlatformStats() {
  await requireSuperAdmin();

  // Total users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalUsers } = await (supabaseAdmin.from("profiles") as any)
    .select("id", { count: "exact", head: true });

  // Active orgs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: activeOrgs } = await (supabaseAdmin.from("organizations") as any)
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // Plan distribution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: planData } = await (supabaseAdmin.from("profiles") as any)
    .select("plan");

  const plans = { free: 0, pro: 0, elite: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (planData || []).forEach((p: any) => {
    const plan = (p.plan || "free").toLowerCase();
    if (plan in plans) plans[plan as keyof typeof plans]++;
    else plans.free++;
  });

  // Active users last 7 and 30 days
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: active7d } = await (supabaseAdmin.from("profiles") as any)
    .select("id", { count: "exact", head: true })
    .gte("last_active_date", d7.split("T")[0]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: active30d } = await (supabaseAdmin.from("profiles") as any)
    .select("id", { count: "exact", head: true })
    .gte("last_active_date", d30.split("T")[0]);

  // Signups per week (last 12 weeks)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: signupData } = await (supabaseAdmin.from("profiles") as any)
    .select("created_at")
    .gte("created_at", new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at");

  const weeklySignups: { week: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = (signupData || []).filter((s: any) => {
      const d = new Date(s.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    weeklySignups.push({ week: label, count });
  }

  // DAU last 30 days from usage table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usageData } = await (supabaseAdmin.from("usage") as any)
    .select("date, user_id")
    .gte("date", d30.split("T")[0]);

  const dauMap = new Map<string, Set<string>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (usageData || []).forEach((u: any) => {
    if (!dauMap.has(u.date)) dauMap.set(u.date, new Set());
    dauMap.get(u.date)!.add(u.user_id);
  });

  const dailyActive: { date: string; users: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    dailyActive.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      users: dauMap.get(dateStr)?.size || 0,
    });
  }

  // Module usage last 30 days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: moduleData } = await (supabaseAdmin.from("usage") as any)
    .select("solves, writes, humanizes, learns")
    .gte("date", d30.split("T")[0]);

  const modules = { solves: 0, writes: 0, humanizes: 0, learns: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (moduleData || []).forEach((m: any) => {
    modules.solves += m.solves || 0;
    modules.writes += m.writes || 0;
    modules.humanizes += m.humanizes || 0;
    modules.learns += m.learns || 0;
  });

  return {
    totalUsers: totalUsers || 0,
    activeOrgs: activeOrgs || 0,
    active7d: active7d || 0,
    active30d: active30d || 0,
    plans,
    weeklySignups,
    dailyActive,
    modules,
  };
}

// ─── User Management ─────────────────────────────────────────────────────

export async function getAdminUsers(filters: {
  search?: string;
  plan?: string;
  active?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}) {
  await requireSuperAdmin();

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const offset = (page - 1) * pageSize;

  // Get all user IDs that ARE in an org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgMembers } = await (supabaseAdmin.from("org_memberships") as any)
    .select("user_id");
  const orgUserIds = new Set((orgMembers || []).map((m: { user_id: string }) => m.user_id));

  // Build query for profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabaseAdmin.from("profiles") as any)
    .select("id, full_name, email, plan, created_at, last_active_date, current_streak, avatar_url, badges", { count: "exact" });

  // Search filter
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  // Plan filter
  if (filters.plan && filters.plan !== "all") {
    query = query.eq("plan", filters.plan);
  }

  // Activity filter
  if (filters.active === "active") {
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    query = query.gte("last_active_date", d30);
  } else if (filters.active === "inactive") {
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    query = query.or(`last_active_date.lt.${d30},last_active_date.is.null`);
  }

  // Sort
  const sortBy = filters.sortBy || "created_at";
  const ascending = filters.sortDir === "asc";
  query = query.order(sortBy, { ascending });

  // Pagination — fetch more to filter out org users
  query = query.range(0, (page * pageSize) + pageSize * 3);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  // Filter out org users client-side
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const individualUsers = (data || []).filter((u: any) => !orgUserIds.has(u.id));

  // Manual pagination on filtered results
  const paged = individualUsers.slice(offset, offset + pageSize);

  // Get total problems solved for these users from student_profiles
  const userIds = paged.map((u: { id: string }) => u.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: studentData } = await (supabaseAdmin.from("student_profiles") as any)
    .select("user_id, total_problems_solved")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const solvedMap = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (studentData || []).forEach((s: any) => {
    solvedMap.set(s.user_id, s.total_problems_solved || 0);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = paged.map((u: any) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    plan: u.plan || "free",
    created_at: u.created_at,
    last_active_date: u.last_active_date,
    current_streak: u.current_streak || 0,
    badges_count: Array.isArray(u.badges) ? u.badges.length : 0,
    problems_solved: solvedMap.get(u.id) || 0,
  }));

  return {
    users,
    total: count ? count - orgUserIds.size : individualUsers.length,
    page,
    pageSize,
  };
}
