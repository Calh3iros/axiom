"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isElevated } from "@/types/roles";

// ─── Auth Helper ─────────────────────────────────────────────────────────

async function getElevatedRole(
  orgId: string
): Promise<{ userId: string; role: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Use supabaseAdmin — memberships created server-side may not be
  // readable via user client due to RLS.

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (!membership || !isElevated(membership.role)) return null;
  return { userId: user.id, role: membership.role };
}

// ─── Remove Student from Class ──────────────────────────────────────────

export async function removeStudentFromClass(input: {
  classId: string;
  studentUserId: string;
}): Promise<{ success: boolean } | { error: string }> {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 2. Get class → org_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabaseAdmin.from("classes") as any)
    .select("org_id")
    .eq("id", input.classId)
    .single();
  if (!cls) return { error: "Class not found" };

  // 3. Permission: coordinator+ in this org
  const mgr = await getElevatedRole(cls.org_id);
  if (!mgr) return { error: "Not authorized — coordinator or above required" };

  // 4. Verify the student is actually in this class

  const { data: membership } = await (
    supabaseAdmin.from("class_memberships") as any
  )
    .select("id")
    .eq("class_id", input.classId)
    .eq("user_id", input.studentUserId)
    .single();
  if (!membership) return { error: "Student is not a member of this class" };

  // 5. Delete class membership (student stays in org)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("class_memberships") as any)
    .delete()
    .eq("class_id", input.classId)
    .eq("user_id", input.studentUserId);

  if (error) return { error: error.message };

  console.log(
    `Student ${input.studentUserId} removed from class ${input.classId} by ${user.id} (${mgr.role})`
  );

  return { success: true };
}

// ─── Reassign Class Teacher ─────────────────────────────────────────────

export async function reassignClass(input: {
  classId: string;
  newTeacherUserId: string;
}): Promise<{ success: boolean } | { error: string }> {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 2. Get class → org_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabaseAdmin.from("classes") as any)
    .select("org_id, teacher_id")
    .eq("id", input.classId)
    .single();
  if (!cls) return { error: "Class not found" };

  // 3. Permission: coordinator+ in this org
  const mgr = await getElevatedRole(cls.org_id);
  if (!mgr) return { error: "Not authorized — coordinator or above required" };

  // 4. Verify new teacher is a teacher/coordinator in this org

  const { data: targetMembership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", input.newTeacherUserId)
    .eq("org_id", cls.org_id)
    .single();

  if (!targetMembership) {
    return { error: "Target user is not a member of this organization" };
  }
  if (
    targetMembership.role !== "teacher" &&
    targetMembership.role !== "coordinator"
  ) {
    return { error: "Target user must be a teacher or coordinator" };
  }

  // 5. Prevent no-op
  if (cls.teacher_id === input.newTeacherUserId) {
    return { error: "This teacher is already assigned to this class" };
  }

  // 6. Update teacher_id on class (schema: classes.teacher_id uuid NOT NULL)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("classes") as any)
    .update({ teacher_id: input.newTeacherUserId })
    .eq("id", input.classId);

  if (error) return { error: error.message };

  console.log(
    `Class ${input.classId} reassigned from ${cls.teacher_id} to ${input.newTeacherUserId} by ${user.id} (${mgr.role})`
  );

  return { success: true };
}

// ─── Get Org Teachers (for reassign dropdown) ───────────────────────────

export async function getOrgTeachers(
  orgId: string
): Promise<
  { userId: string; name: string; email: string; role: string }[] | null
> {
  const mgr = await getElevatedRole(orgId);
  if (!mgr) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("org_memberships") as any)
    .select("user_id, role")
    .eq("org_id", orgId)
    .in("role", ["teacher", "coordinator"]);

  if (!data || data.length === 0) return [];

  const userIds = data.map((m: any) => m.user_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabaseAdmin.from("profiles") as any)
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map();
  if (profiles) {
    profiles.forEach((p: any) => profileMap.set(p.id, p));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((m: any) => {
    const prof = profileMap.get(m.user_id);
    return {
      userId: m.user_id,
      name: prof?.full_name || prof?.email?.split("@")[0] || "User",
      email: prof?.email || "",
      role: m.role,
    };
  });
}

// ─── Update Member Role (teacher ↔ coordinator) ────────────────────────

export async function updateMemberRole(input: {
  orgId: string;
  userId: string;
  newRole: "teacher" | "coordinator";
}): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 1. Caller must be director+ (canManageMembers level)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerMem } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", input.orgId)
    .single();

  if (
    !callerMem ||
    !["admin", "director", "owner", "secretary"].includes(callerMem.role)
  ) {
    return { error: "Not authorized — director or above required" };
  }

  // 2. Validate newRole is only teacher or coordinator
  if (input.newRole !== "teacher" && input.newRole !== "coordinator") {
    return { error: "Can only switch between teacher and coordinator" };
  }

  // 3. Get target user's current role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetMem } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", input.userId)
    .eq("org_id", input.orgId)
    .single();

  if (!targetMem) return { error: "User is not a member of this organization" };

  // 4. Can only change teacher or coordinator (not director/owner/etc)
  if (targetMem.role !== "teacher" && targetMem.role !== "coordinator") {
    return { error: "Can only promote/demote teachers and coordinators" };
  }

  // 5. No-op check
  if (targetMem.role === input.newRole) {
    return { error: "User already has this role" };
  }

  // 6. Update
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("org_memberships") as any)
    .update({ role: input.newRole })
    .eq("user_id", input.userId)
    .eq("org_id", input.orgId);

  if (error) return { error: error.message };

  console.log(
    `Role updated: ${input.userId} ${targetMem.role}→${input.newRole} in org ${input.orgId} by ${user.id}`
  );

  return { success: true };
}
