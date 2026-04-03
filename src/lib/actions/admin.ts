"use server";

import { sendEmail } from "@/lib/email";
import { orgApprovedEmailHtml } from "@/lib/email-templates";
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
  const { data: profile } = await (supabaseAdmin.from("profiles") as any)
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
    .select(
      "id, name, type, status, created_at, requested_at, requested_by_name, requested_by_email, requested_by_role, requested_by_phone, institution_id, request_message, rejection_reason, approved_at"
    )
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

export async function approveOrg(
  orgId: string,
  options?: {
    maxStudents?: number | null;
    expiresAt?: string | null;
    contractNotes?: string | null;
  }
) {
  await requireSuperAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    status: "active",
    approved_at: new Date().toISOString(),
  };

  if (options?.maxStudents !== undefined)
    updateData.max_students = options.maxStudents;
  if (options?.expiresAt !== undefined)
    updateData.access_expires_at = options.expiresAt;
  if (options?.contractNotes !== undefined)
    updateData.contract_notes = options.contractNotes;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("organizations") as any)
    .update(updateData)
    .eq("id", orgId);

  if (error) throw new Error(error.message);

  // ── Auto-add requester as org member ────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgInfo } = await (supabaseAdmin.from("organizations") as any)
      .select("requested_by_email, requested_by_role")
      .eq("id", orgId)
      .single();

    if (orgInfo?.requested_by_email) {
      // Look up user by email in profiles

      const { data: userProfile } = await (
        supabaseAdmin.from("profiles") as any
      )
        .select("id")
        .eq("email", orgInfo.requested_by_email.toLowerCase())
        .single();

      if (userProfile) {
        const roleMap: Record<string, string> = {
          director: "director",
          coordinator: "teacher",
          secretary: "secretary",
          other: "teacher",
        };
        const memberRole = roleMap[orgInfo.requested_by_role] || "teacher";

        // Check if already a member (idempotent)

        const { data: existing } = await (
          supabaseAdmin.from("org_memberships") as any
        )
          .select("id")
          .eq("org_id", orgId)
          .eq("user_id", userProfile.id)
          .single();

        if (!existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabaseAdmin.from("org_memberships") as any).insert({
            org_id: orgId,
            user_id: userProfile.id,
            role: memberRole,
          });
          console.warn(
            `[APPROVE] Auto-added ${orgInfo.requested_by_email} as ${memberRole}`
          );
        }
      } else {
        console.warn(
          `[APPROVE] User ${orgInfo.requested_by_email} not found in profiles — manual add needed`
        );
      }
    }
  } catch (memberErr) {
    // Non-fatal: org is approved even if membership creation fails
    console.error("[APPROVE] Auto-membership error (non-fatal):", memberErr);
  }
  // ────────────────────────────────────────────────────────────────────

  // ── Org approved email (fire-and-forget) ────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabaseAdmin.from("organizations") as any)
      .select("name, requested_by_email")
      .eq("id", orgId)
      .single();

    if (org?.requested_by_email) {
      sendEmail({
        to: org.requested_by_email,
        subject: `Your institution has been approved! 🏫`,
        html: orgApprovedEmailHtml(org.name || "Your institution"),
      });
    }
  } catch (emailErr) {
    console.error("[admin] Org approval email error:", emailErr);
  }
  // ────────────────────────────────────────────────────────────────────

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

export async function updateOrgContract(
  orgId: string,
  data: {
    maxStudents?: number | null;
    expiresAt?: string | null;
    contractNotes?: string | null;
  }
) {
  await requireSuperAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.maxStudents !== undefined)
    updateData.max_students = data.maxStudents;
  if (data.expiresAt !== undefined)
    updateData.access_expires_at = data.expiresAt;
  if (data.contractNotes !== undefined)
    updateData.contract_notes = data.contractNotes;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("organizations") as any)
    .update(updateData)
    .eq("id", orgId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getOrgStudentCount(orgId: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabaseAdmin.from("org_memberships") as any)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("role", "student");
  return count || 0;
}

export async function getRenewalAlerts() {
  await requireSuperAdmin();

  const now = new Date();
  const in30d = new Date(now.getTime() + 30 * 86400000).toISOString();

  // Orgs expiring in next 30 days

  const { data: expiringSoon } = await (
    supabaseAdmin.from("organizations") as any
  )
    .select("id, name, type, access_expires_at, max_students")
    .eq("status", "active")
    .not("access_expires_at", "is", null)
    .lte("access_expires_at", in30d)
    .gte("access_expires_at", now.toISOString())
    .order("access_expires_at");

  // Expired (suspended because of expiry)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expired } = await (supabaseAdmin.from("organizations") as any)
    .select("id, name, type, access_expires_at")
    .eq("status", "suspended")
    .not("access_expires_at", "is", null)
    .lt("access_expires_at", now.toISOString())
    .order("access_expires_at");

  // Orgs with max_students — check capacity

  const { data: withLimits } = await (
    supabaseAdmin.from("organizations") as any
  )
    .select("id, name, type, max_students")
    .eq("status", "active")
    .not("max_students", "is", null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nearCapacity: any[] = [];
  for (const org of withLimits || []) {
    const count = await getOrgStudentCount(org.id);
    const pct = Math.round((count / org.max_students) * 100);
    if (pct >= 80) {
      nearCapacity.push({
        id: org.id,
        name: org.name,
        type: org.type,
        current: count,
        max: org.max_students,
        pct,
      });
    }
  }
  nearCapacity.sort((a, b) => b.pct - a.pct);

  // Add daysLeft to expiringSoon
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expiringWithDays = (expiringSoon || []).map((o: any) => ({
    ...o,
    daysLeft: Math.ceil(
      (new Date(o.access_expires_at).getTime() - now.getTime()) / 86400000
    ),
  }));

  return {
    expiringSoon: expiringWithDays,
    expired: expired || [],
    nearCapacity,
  };
}

// ─── Platform KPIs ───────────────────────────────────────────────────────

export async function getAdminPlatformStats() {
  await requireSuperAdmin();

  // Total users

  const { count: totalUsers } = await (
    supabaseAdmin.from("profiles") as any
  ).select("id", { count: "exact", head: true });

  // Active orgs

  const { count: activeOrgs } = await (
    supabaseAdmin.from("organizations") as any
  )
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // Plan distribution

  const { data: planData } = await (
    supabaseAdmin.from("profiles") as any
  ).select("plan");

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
    .gte(
      "created_at",
      new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("created_at");

  const weeklySignups: { week: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(
      now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000
    );
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

  const { data: orgMembers } = await (
    supabaseAdmin.from("org_memberships") as any
  ).select("user_id");
  const orgUserIds = new Set(
    (orgMembers || []).map((m: { user_id: string }) => m.user_id)
  );

  // Build query for profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabaseAdmin.from("profiles") as any).select(
    "id, full_name, email, plan, created_at, last_active_date, current_streak, avatar_url, badges",
    { count: "exact" }
  );

  // Search filter
  if (filters.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  // Plan filter
  if (filters.plan && filters.plan !== "all") {
    query = query.eq("plan", filters.plan);
  }

  // Activity filter
  if (filters.active === "active") {
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    query = query.gte("last_active_date", d30);
  } else if (filters.active === "inactive") {
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    query = query.or(`last_active_date.lt.${d30},last_active_date.is.null`);
  }

  // Sort
  const sortBy = filters.sortBy || "created_at";
  const ascending = filters.sortDir === "asc";
  query = query.order(sortBy, { ascending });

  // Pagination — fetch more to filter out org users
  query = query.range(0, page * pageSize + pageSize * 3);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  // Filter out org users client-side

  const individualUsers = (data || []).filter(
    (u: any) => !orgUserIds.has(u.id)
  );

  // Manual pagination on filtered results
  const paged = individualUsers.slice(offset, offset + pageSize);

  // Get total problems solved for these users from student_profiles
  const userIds = paged.map((u: { id: string }) => u.id);

  const { data: studentData } = await (
    supabaseAdmin.from("student_profiles") as any
  )
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

// ─── Demo Org Helper ─────────────────────────────────────────────────────

export async function getDemoOrgId(): Promise<string | null> {
  await requireSuperAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("organizations") as any)
    .select("id")
    .eq("name", "Escola Demonstração")
    .single();
  return data?.id || null;
}

// ─── Direct Org Creation ─────────────────────────────────────────────────

/**
 * Create an org directly (B2B active sales) and auto-generate invite code.
 * Only super_admin. Returns { orgId, code }.
 */
export async function createOrganizationDirect(input: {
  name: string;
  type: string;
  maxStudents?: number;
  expiresAt?: string;
  contractNotes?: string;
}): Promise<{ orgId: string; code: string } | { error: string }> {
  const user = await requireSuperAdmin();

  if (!input.name?.trim()) return { error: "Name is required" };

  const expiresAt =
    input.expiresAt ||
    new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];

  const { data: org, error: orgErr } = await (
    supabaseAdmin.from("organizations") as any
  )
    .insert({
      name: input.name.trim(),
      type: input.type,
      status: "active",
      created_by: user.id,
      max_students: input.maxStudents || 500,
      access_expires_at: expiresAt,
      contract_notes: input.contractNotes || null,
    })
    .select("id")
    .single();

  if (orgErr) return { error: orgErr.message };

  // NOTE: We intentionally do NOT insert a membership for the super_admin creator.
  // Super admins access all orgs via the is_super_admin bypass in getManagerRole.
  // Adding a membership would make them appear in the org's member list,
  // confusing school directors who see an unknown "Admin" user.

  // Generate invite code based on org type
  // school/private_school => director, network/state => secretary, private_network/public_* => owner
  const codeTypeMap: Record<string, string> = {
    school: "director",
    private_school: "director",
    network: "secretary",
    state: "secretary",
    private_network: "owner",
    public_municipal: "secretary",
    public_state: "secretary",
  };
  const codeType = codeTypeMap[input.type] || "director";
  const PREFIX_MAP: Record<string, string> = {
    secretary: "SEC",
    gre: "GRE",
    director: "DIR",
    teacher: "PRF",
    owner: "OWN",
  };
  const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    let body = "";
    for (let i = 0; i < 6; i++)
      body += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    const candidate = `${PREFIX_MAP[codeType]}-${body}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dup } = await (supabaseAdmin.from("invite_codes") as any)
      .select("id")
      .eq("code", candidate)
      .limit(1);
    if (!dup || dup.length === 0) {
      code = candidate;
      break;
    }
  }

  if (!code) return { error: "Failed to generate unique code" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin.from("invite_codes") as any).insert({
    code,
    type: codeType,
    org_id: org.id,
    created_by: user.id,
    max_uses: 1,
  });

  return { orgId: org.id, code };
}

/**
 * Get all active orgs with their active invite codes.
 */
export async function getAdminOrgList() {
  await requireSuperAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgs } = await (supabaseAdmin.from("organizations") as any)
    .select(
      "id, name, type, status, created_at, max_students, access_expires_at"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!orgs || orgs.length === 0) return [];

  const orgIds = orgs.map((o: { id: string }) => o.id);

  // Parallel fetch: invite codes, children organizations, and org_memberships
  const [codesRes, childrenRes, membersRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("invite_codes") as any)
      .select("code, type, org_id")
      .in("org_id", orgIds)
      .eq("is_active", true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("organizations") as any)
      .select("parent_id")
      .in("parent_id", orgIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("org_memberships") as any).select("org_id"),
  ]);

  const codes = codesRes?.data || [];
  const childrenData = childrenRes?.data || [];
  const membersData = membersRes?.data || [];

  const codeMap = new Map<string, { code: string; type: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codes.forEach((c: any) => {
    // Keep the first active code per org
    if (!codeMap.has(c.org_id))
      codeMap.set(c.org_id, { code: c.code, type: c.type });
  });

  // Basic direct counts
  const childCountMap = new Map<string, number>();
  childrenData.forEach((c: any) => {
    childCountMap.set(c.parent_id, (childCountMap.get(c.parent_id) || 0) + 1);
  });

  const memberCountMap = new Map<string, number>();
  membersData.forEach((m: any) => {
    memberCountMap.set(m.org_id, (memberCountMap.get(m.org_id) || 0) + 1);
  });

  // Calculate aggregated members (direct + direct children's members)
  // (Assuming depth 1 child for networks mostly)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return orgs.map((o: any) => {
    let members = memberCountMap.get(o.id) || 0;
    // Add members from direct children
    childrenData.forEach((c: any) => {
      if (c.parent_id === o.id && c.id) {
        members += memberCountMap.get(c.id) || 0;
      }
    });

    return {
      ...o,
      inviteCode: codeMap.get(o.id)?.code || null,
      codeType: codeMap.get(o.id)?.type || null,
      schoolsCount: childCountMap.get(o.id) || 0,
      membersCount: members,
    };
  });
}

// ─── Delete Organization (cascade) ───────────────────────────────────────

export async function deleteOrganization(
  orgId: string
): Promise<{ success: boolean } | { error: string }> {
  const user = await requireSuperAdmin();

  // Fetch org name for logging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabaseAdmin.from("organizations") as any)
    .select("id, name")
    .eq("id", orgId)
    .single();

  if (!org) return { error: "Organization not found" };

  try {
    // 1. Get all classes belonging to this org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: classes } = await (supabaseAdmin.from("classes") as any)
      .select("id")
      .eq("org_id", orgId);

    const classIds = (classes || []).map((c: { id: string }) => c.id);

    // 2. Delete class_memberships for those classes
    if (classIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("class_memberships") as any)
        .delete()
        .in("class_id", classIds);
    }

    // 3. Delete classes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("classes") as any).delete().eq("org_id", orgId);

    // 4. Delete invite_codes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("invite_codes") as any)
      .delete()
      .eq("org_id", orgId);

    // 5. Delete org_memberships
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("org_memberships") as any)
      .delete()
      .eq("org_id", orgId);

    // 6. Unlink children (do NOT delete them)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("organizations") as any)
      .update({ parent_id: null })
      .eq("parent_id", orgId);

    // 7. Delete the organization itself
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from("organizations") as any)
      .delete()
      .eq("id", orgId);

    if (error) return { error: error.message };

    console.log(
      `[DELETE_ORG] Org "${org.name}" (${orgId}) deleted by user ${user.id}`
    );

    return { success: true };
  } catch (err) {
    console.error("[DELETE_ORG] Cascade delete failed:", err);
    return { error: "Cascade delete failed" };
  }
}
