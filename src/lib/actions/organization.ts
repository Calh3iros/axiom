"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────
export type OrgRole = "student" | "teacher" | "admin" | "director" | "secretary";
export type OrgType = "school" | "network" | "state";

// ─── Organization CRUD ──────────────────────────────────────────────────

/**
 * Create a new organization. The creator becomes admin automatically.
 */
export async function createOrganization(name: string, type: OrgType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org, error } = await (supabase.from("organizations") as any)
    .insert({ name, type, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Auto-add creator as admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("org_memberships") as any).insert({
    user_id: user.id,
    org_id: org.id,
    role: "admin",
  });

  return { orgId: org.id };
}

/**
 * Get all organizations the current user is a member of.
 */
export async function getMyOrganizations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("org_memberships") as any)
    .select("role, org_id, organizations(id, name, type, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  return data || [];
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

  // Verify membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase.from("org_memberships") as any)
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (!membership) return null;

  // Fetch org, members, classes in parallel
  const [orgRes, membersRes, classesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("organizations") as any)
      .select("id, name, type, created_at")
      .eq("id", orgId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("org_memberships") as any)
      .select("user_id, role, joined_at")
      .eq("org_id", orgId)
      .order("role"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("classes") as any)
      .select("id, name, invite_code, teacher_id, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    org: orgRes?.data,
    myRole: membership.role as OrgRole,
    members: membersRes?.data || [],
    classes: classesRes?.data || [],
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

  // Verify role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase.from("org_memberships") as any)
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (!membership || !["teacher", "admin", "director"].includes(membership.role)) {
    return { error: "Not authorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("classes") as any)
    .insert({ org_id: orgId, name, teacher_id: user.id })
    .select("id, invite_code")
    .single();

  if (error) return { error: error.message };
  return { classId: data.id, inviteCode: data.invite_code };
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabase.from("classes") as any)
    .select("id, name, invite_code, teacher_id, org_id, created_at")
    .eq("id", classId)
    .single();

  if (!cls) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: students } = await (supabase.from("class_memberships") as any)
    .select("user_id, joined_at")
    .eq("class_id", classId)
    .order("joined_at");

  return {
    classInfo: cls,
    students: students || [],
    isTeacher: cls.teacher_id === user.id,
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
  role: OrgRole
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify admin role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase.from("org_memberships") as any)
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (
    !membership ||
    !["admin", "director", "secretary"].includes(membership.role)
  ) {
    return { error: "Not authorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("org_memberships") as any).insert({
    user_id: targetUserId,
    org_id: orgId,
    role,
  });

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
  const { error } = await (supabase.from("org_memberships") as any)
    .delete()
    .eq("user_id", targetUserId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };
  return { success: true };
}
