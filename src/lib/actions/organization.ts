"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ELEVATED_ROLES,
  ALL_ORG_TYPES,
  canCreateClass,
  isManager,
} from "@/types/roles";

/**
 * Check if current user is super_admin.
 */
async function isSuperAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("profiles") as any)
    .select("is_super_admin")
    .eq("id", userId)
    .single();
  return data?.is_super_admin === true;
}

// ─── Hierarchy Helpers ───────────────────────────────────────────────────

/**
 * Get all descendant org IDs from a root org via recursive CTE.
 * Uses the get_org_subtree() SQL function (LIMIT 500, max depth 10).
 */
async function getOrgSubtreeIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rootId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc("get_org_subtree", {
    root_id: rootId,
  });
  return (data || []) as { org_id: string; depth: number }[];
}

// ─── Organization CRUD ──────────────────────────────────────────────────

/**
 * Create a new organization. ONLY super_admin can create directly.
 */
export async function createOrganization(name: string, type: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only super_admin can create orgs directly
  if (!(await isSuperAdmin(supabase, user.id))) {
    return { error: "Only administrators can create organizations" };
  }

  const { data: org, error } = await (
    supabaseAdmin.from("organizations") as any
  )
    .insert({ name, type, created_by: user.id, status: "active" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Auto-add creator as admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin.from("org_memberships") as any).insert({
    user_id: user.id,
    org_id: org.id,
    role: "admin",
  });

  return { orgId: org.id };
}

/**
 * Public org request — no auth required. Creates org with status='pending'.
 */
export async function requestOrganization(data: {
  name: string;
  type: string;
  institution_id: string;
  requested_by_name: string;
  requested_by_role: string;
  requested_by_email: string;
  requested_by_phone: string;
  message?: string;
}) {
  // Server-side validation
  if (!data.name?.trim()) return { error: "Institution name is required" };
  if (!data.institution_id?.trim())
    return { error: "Institution ID (CNPJ) is required" };
  if (!data.requested_by_name?.trim())
    return { error: "Your name is required" };
  if (!data.requested_by_role?.trim())
    return { error: "Your role is required" };
  if (!data.requested_by_email?.trim()) return { error: "Email is required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.requested_by_email))
    return { error: "Invalid email format" };
  if (!data.requested_by_phone?.trim()) return { error: "Phone is required" };
  if (!ALL_ORG_TYPES.includes(data.type)) return { error: "Invalid org type" };

  // Use admin client for unauthenticated insert
  const { supabaseAdmin } = await import("@/lib/supabase/admin");

  // Rate limit: check recent pending requests from this email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recent } = await (supabaseAdmin.from("organizations") as any)
    .select("id")
    .eq("requested_by_email", data.requested_by_email)
    .eq("status", "pending")
    .gte(
      "requested_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );

  if (recent && recent.length >= 3) {
    return { error: "Too many requests. Please try again in 24 hours." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("organizations") as any).insert({
    name: data.name.trim(),
    type: data.type,
    status: "pending",
    institution_id: data.institution_id.trim(),
    requested_by_name: data.requested_by_name.trim(),
    requested_by_role: data.requested_by_role.trim(),
    requested_by_email: data.requested_by_email.trim().toLowerCase(),
    requested_by_phone: data.requested_by_phone.trim(),
    request_message: data.message?.trim() || null,
    requested_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Get all organizations the current user is a member of,
 * PLUS child orgs visible through hierarchy for elevated roles.
 */
export async function getMyOrganizations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Use supabaseAdmin — memberships created via redeemInviteCode (supabaseAdmin)
  // are invisible to user client due to RLS on org_memberships.

  const { data: directMemberships } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select(
      "role, org_id, organizations(id, name, type, parent_id, created_at)"
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const memberships = directMemberships || [];

  // For elevated roles, also fetch child orgs
  const childOrgIds = new Set<string>();
  for (const m of memberships) {
    if (ELEVATED_ROLES.includes(m.role)) {
      const subtree = await getOrgSubtreeIds(supabaseAdmin as any, m.org_id);
      for (const node of subtree) {
        if (node.depth > 0) childOrgIds.add(node.org_id);
      }
    }
  }

  // Fetch child orgs data if any
  let childOrgs: {
    id: string;
    name: string;
    type: string;
    parent_id: string;
    created_at: string;
  }[] = [];
  if (childOrgIds.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from("organizations") as any)
      .select("id, name, type, parent_id, created_at")
      .in("id", Array.from(childOrgIds));
    childOrgs = data || [];
  }

  return { memberships, childOrgs };
}

/**
 * Get org details with members and classes.
 */
export async function getOrgDashboard(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify membership — use supabaseAdmin because memberships may have been
  // created via supabaseAdmin (e.g. redeemInviteCode) and RLS on org_memberships
  // may block the user client from reading its own row.

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  // If no direct membership, check parent chain (owner/secretary of rede → can access escola)
  let inheritedRole: string | null = null;
  if (!membership) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabaseAdmin.from("organizations") as any)
      .select("parent_id")
      .eq("id", orgId)
      .single();
    if (org?.parent_id) {
      const { data: parentMem } = await (
        supabaseAdmin.from("org_memberships") as any
      )
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", org.parent_id)
        .single();
      if (parentMem && ELEVATED_ROLES.includes(parentMem.role)) {
        inheritedRole = parentMem.role;
      }
    }
  }

  // Super_admin bypass: read-only director-level access without membership
  const isSuperAdminUser =
    !membership && !inheritedRole && (await isSuperAdmin(supabase, user.id));
  const effectiveRole =
    membership?.role || inheritedRole || (isSuperAdminUser ? "director" : null);
  if (!effectiveRole) return null;

  // Use supabaseAdmin for all data queries — membership is verified above.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabaseAdmin;

  // Check org status — only super_admin can view non-active orgs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgCheck } = await (db.from("organizations") as any)
    .select("status")
    .eq("id", orgId)
    .single();
  if (orgCheck?.status !== "active") {
    if (!isSuperAdminUser) return null;
  }

  // Fetch org and classes in parallel first
  const [orgRes, classesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("organizations") as any)
      .select(
        "id, name, type, created_at, max_students, access_expires_at, contract_notes"
      )
      .eq("id", orgId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.from("classes") as any)
      .select("id, name, invite_code, teacher_id, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  // Fetch org memberships separately since profiles join lacks explicit FK in DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const membersRes = await (db.from("org_memberships") as any)
    .select("user_id, role, joined_at, subjects")
    .eq("org_id", orgId)
    .order("role");

  const membersRaw = membersRes?.data || [];
  let members = membersRaw;

  if (membersRaw.length > 0) {
    const userIds = membersRaw.map((m: any) => m.user_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (db.from("profiles") as any)
      .select("id, full_name, avatar_url, email")
      .in("id", userIds);

    const profileMap = new Map();
    if (profiles) {
      profiles.forEach((p: any) => profileMap.set(p.id, p));
    }

    members = membersRaw.map((m: any) => ({
      ...m,
      profiles: profileMap.get(m.user_id) || null,
    }));
  }

  // Auto-suspend if expired
  const orgData = orgRes.data;
  if (orgData?.access_expires_at) {
    const expiresAt = new Date(orgData.access_expires_at);
    if (expiresAt < new Date() && orgCheck?.status === "active") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("organizations") as any)
        .update({ status: "suspended" })
        .eq("id", orgId);
    }
  }

  // Count students for capacity display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentCount = members.filter((m: any) => m.role === "student").length;

  // For elevated roles, also fetch child orgs
  let childOrgs: {
    id: string;
    name: string;
    type: string;
    parent_id: string;
    created_at: string;
  }[] = [];
  if (ELEVATED_ROLES.includes(effectiveRole)) {
    // get_org_subtree RPC needs the user client for auth context
    const subtree = await getOrgSubtreeIds(
      isSuperAdminUser ? (supabaseAdmin as any) : supabase,
      orgId
    );
    const childIds = subtree.filter((n) => n.depth > 0).map((n) => n.org_id);
    if (childIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db.from("organizations") as any)
        .select("id, name, type, parent_id, created_at")
        .in("id", childIds)
        .order("type")
        .order("name");
      childOrgs = data || [];
    }
  }

  return {
    org: orgRes?.data,
    myRole: effectiveRole,
    members: members,
    classes: classesRes?.data || [],
    childOrgs,
    studentCount,
  };
}

// ─── Class CRUD ─────────────────────────────────────────────────────────

/**
 * Create a class within an organization. Only teacher/admin/director.
 */
export async function createClass(orgId: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify role — use supabaseAdmin because RLS blocks user client
  // from seeing memberships created via redeemInviteCode.

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (!membership || !canCreateClass(membership.role)) {
    return { error: "Not authorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin.from("classes") as any)
    .insert({ org_id: orgId, name, teacher_id: user.id })
    .select("id, invite_code")
    .single();

  if (error) return { error: error.message };
  return { classId: data.id, inviteCode: data.invite_code };
}

/**
 * Create multiple classes in batch. Only director/admin.
 */
export async function createClassesBatch(input: {
  orgId: string;
  grades: string[];
  sections: string[];
  shifts: Record<string, string>;
}): Promise<
  | { created: number; classes: Array<{ name: string; code: string }> }
  | { error: string }
> {
  if (
    !input.orgId ||
    input.grades.length === 0 ||
    input.sections.length === 0
  ) {
    return { error: "Invalid input" };
  }

  // Hard limit for safety
  if (input.grades.length * input.sections.length > 100) {
    return { error: "Too many classes requested (maximum 100 per batch)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", input.orgId)
    .single();

  if (!membership || !canCreateClass(membership.role)) {
    return { error: "Not authorized" };
  }

  // Get existing class names to avoid duplicates
  const { data: existingClasses } = await (supabaseAdmin.from("classes") as any)
    .select("name")
    .eq("org_id", input.orgId);

  const existingNames = new Set(
    (existingClasses || []).map((c: any) => c.name)
  );

  const toInsert = [];
  const generatedCodes = new Set<string>();

  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const genCode = () => {
    let code = "CLS-";
    for (let i = 0; i < 6; i++) {
      code += charset[Math.floor(Math.random() * charset.length)];
    }
    return code;
  };

  for (const grade of input.grades) {
    for (const section of input.sections) {
      const className = `${grade} ${section}`;
      if (existingNames.has(className)) continue;

      let code = genCode();
      while (generatedCodes.has(code)) {
        code = genCode();
      }
      generatedCodes.add(code);

      toInsert.push({
        org_id: input.orgId,
        name: className,
        grade,
        shift: input.shifts[section] || null,
        invite_code: code,
        teacher_id: user.id,
      });
    }
  }

  if (toInsert.length === 0) {
    return { created: 0, classes: [] };
  }

  const { data, error } = await (supabaseAdmin.from("classes") as any)
    .insert(toInsert)
    .select("name, invite_code");

  if (error) return { error: error.message };

  return {
    created: data.length,
    classes: data.map((d: any) => ({ name: d.name, code: d.invite_code })),
  };
}

/**
 * Get class details with student list.
 */
export async function getClassDashboard(classId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Use supabaseAdmin for all data queries — RLS blocks user client
  // from seeing data in orgs where membership was created server-side.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabaseAdmin;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (db.from("classes") as any)
    .select("id, name, invite_code, teacher_id, org_id, created_at, organizations(name)")
    .eq("id", classId)
    .single();

  if (!cls) return null;

  // Look up user's org role via supabaseAdmin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myMembership } = await (db.from("org_memberships") as any)
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", cls.org_id)
    .single();

  // If no direct membership, check parent chain (owner/secretary can view child org classes)
  let inheritedClassRole: string | null = null;
  if (!myMembership) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: classOrg } = await (db.from("organizations") as any)
      .select("parent_id")
      .eq("id", cls.org_id)
      .single();
    if (classOrg?.parent_id) {
      const { data: parentMem } = await (db.from("org_memberships") as any)
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", classOrg.parent_id)
        .single();
      if (parentMem && ELEVATED_ROLES.includes(parentMem.role)) {
        inheritedClassRole = parentMem.role;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mRows } = await (db.from("class_memberships") as any)
    .select("user_id, joined_at")
    .eq("class_id", classId)
    .order("joined_at");

  let students = [];
  if (mRows && mRows.length > 0) {
    const userIds = mRows.map((m: any) => m.user_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (db.from("profiles") as any)
      .select("id, full_name, avatar_url, email")
      .in("id", userIds);

    const profileMap = new Map();
    if (profiles) {
      profiles.forEach((p: any) => profileMap.set(p.id, p));
    }

    students = mRows.map((m: any) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      profiles: profileMap.get(m.user_id) || null,
    }));
  }

  return {
    classInfo: cls,
    students: students || [],
    isTeacher: cls.teacher_id === user.id,
    myRole:
      myMembership?.role ||
      inheritedClassRole ||
      (cls.teacher_id === user.id ? "teacher" : "student"),
  };
}

// ─── Member Management ──────────────────────────────────────────────────

/**
 * Add a member to an org with a specific role.
 * Only admin/director/secretary can do this.
 */
export async function addOrgMember(
  orgId: string,
  targetUserId: string,
  role: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify admin role — use supabaseAdmin for RLS bypass

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (!membership || !isManager(membership.role)) {
    return { error: "Not authorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("org_memberships") as any).insert(
    {
      user_id: targetUserId,
      org_id: orgId,
      role,
    }
  );

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Remove a member from an org.
 */
export async function removeOrgMember(orgId: string, targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("org_memberships") as any)
    .delete()
    .eq("user_id", targetUserId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };
  return { success: true };
}
