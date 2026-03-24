"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canManageOrg } from "@/types/roles";

// ─── Auth Helper ─────────────────────────────────────────────────────────

async function requireNetworkManager(
  orgId: string
): Promise<{ userId: string; role: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (!membership || !canManageOrg(membership.role)) return null;
  return { userId: user.id, role: membership.role };
}

// ─── Create Child Org ────────────────────────────────────────────────────

const NETWORK_TYPES = [
  "network",
  "private_network",
  "public_municipal",
  "public_state",
  "state",
];

const CHILD_TYPE_MAP: Record<string, string> = {
  private_network: "private_school",
  public_municipal: "school",
  public_state: "school",
  network: "school",
  state: "school",
};

export async function createChildOrg(input: {
  parentOrgId: string;
  name: string;
  type?: string;
  maxStudents?: number;
}): Promise<{ orgId: string; directorCode: string } | { error: string }> {
  // 1. Auth: must be owner/secretary/admin of parent org
  const mgr = await requireNetworkManager(input.parentOrgId);
  if (!mgr) return { error: "Not authorized — owner/secretary/admin required" };

  // 2. Validate parent org exists and is a network type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: parent } = await (supabaseAdmin.from("organizations") as any)
    .select("id, name, type, status, max_students")
    .eq("id", input.parentOrgId)
    .single();

  if (!parent) return { error: "Parent organization not found" };
  if (parent.status !== "active")
    return { error: "Parent organization is not active" };
  if (!NETWORK_TYPES.includes(parent.type))
    return { error: "Parent must be a network/state organization" };

  // 3. Determine child type
  const childType = input.type || CHILD_TYPE_MAP[parent.type] || "school";

  // 4. INSERT child org with parent_id

  const { data: newOrg, error: orgErr } = await (
    supabaseAdmin.from("organizations") as any
  )
    .insert({
      name: input.name.trim(),
      type: childType,
      status: "active",
      parent_id: input.parentOrgId,
      created_by: mgr.userId,
      max_students:
        input.maxStudents || Math.round((parent.max_students || 500) / 10),
    })
    .select("id")
    .single();

  if (orgErr) return { error: orgErr.message };

  // 5. Generate DIR invite code for child org
  const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    let body = "";
    for (let i = 0; i < 6; i++)
      body += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    const candidate = `DIR-${body}`;
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

  if (!code) return { error: "Failed to generate unique invite code" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin.from("invite_codes") as any).insert({
    code,
    type: "director",
    org_id: newOrg.id,
    created_by: mgr.userId,
    max_uses: 1,
  });

  console.log(
    `[F3] Child org "${input.name}" (${newOrg.id}) created under "${parent.name}" by ${mgr.userId} (${mgr.role}). DIR code: ${code}`
  );

  return { orgId: newOrg.id, directorCode: code };
}

// ─── Transfer Member ─────────────────────────────────────────────────────

export async function transferMember(input: {
  userId: string;
  fromOrgId: string;
  toOrgId: string;
  keepRole?: boolean;
}): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 1. Get parent_id of both orgs — must be same parent
  const [fromRes, toRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("organizations") as any)
      .select("id, parent_id, name")
      .eq("id", input.fromOrgId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin.from("organizations") as any)
      .select("id, parent_id, name")
      .eq("id", input.toOrgId)
      .single(),
  ]);

  if (!fromRes.data) return { error: "Source org not found" };
  if (!toRes.data) return { error: "Target org not found" };
  if (!fromRes.data.parent_id || !toRes.data.parent_id)
    return { error: "Both orgs must be child orgs of a network" };
  if (fromRes.data.parent_id !== toRes.data.parent_id)
    return { error: "Both orgs must belong to the same network" };

  // 2. Auth: must be owner/secretary/admin of the PARENT org
  const mgr = await requireNetworkManager(fromRes.data.parent_id);
  if (!mgr) return { error: "Not authorized — must be network manager" };

  // 3. Verify member exists in source org

  const { data: membership } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("role")
    .eq("user_id", input.userId)
    .eq("org_id", input.fromOrgId)
    .single();

  if (!membership) return { error: "User is not a member of source org" };

  // 4. Block transferring students and directors
  if (membership.role === "student")
    return { error: "Cannot transfer students — they join via class codes" };
  if (membership.role === "director")
    return { error: "Cannot transfer directors — remove and reassign instead" };

  // 5. Check not already in target org

  const { data: existing } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("id")
    .eq("user_id", input.userId)
    .eq("org_id", input.toOrgId)
    .single();

  if (existing) return { error: "User is already a member of target org" };

  // 6. Move membership: UPDATE org_id
  const keepRole = input.keepRole !== false;

  const { error: updateErr } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .update({ org_id: input.toOrgId })
    .eq("user_id", input.userId)
    .eq("org_id", input.fromOrgId);

  if (updateErr) return { error: updateErr.message };

  // 7. Remove class_memberships from old org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oldClasses } = await (supabaseAdmin.from("classes") as any)
    .select("id")
    .eq("org_id", input.fromOrgId);

  if (oldClasses && oldClasses.length > 0) {
    const classIds = oldClasses.map((c: { id: string }) => c.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("class_memberships") as any)
      .delete()
      .in("class_id", classIds)
      .eq("user_id", input.userId);

    // If the member was a teacher, unassign from classes
    if (membership.role === "teacher" || membership.role === "coordinator") {
      // Don't delete classes — just log warning

      const { data: assignedClasses } = await (
        supabaseAdmin.from("classes") as any
      )
        .select("id, name")
        .eq("org_id", input.fromOrgId)
        .eq("teacher_id", input.userId);

      if (assignedClasses && assignedClasses.length > 0) {
        console.warn(
          `[F3] Warning: ${assignedClasses.length} classes in "${fromRes.data.name}" still assigned to transferred teacher ${input.userId}. Classes: ${assignedClasses.map((c: { name: string }) => c.name).join(", ")}`
        );
      }
    }
  }

  console.log(
    `[F3] Member ${input.userId} (${membership.role}) transferred from "${fromRes.data.name}" to "${toRes.data.name}" by ${user.id} (${mgr.role}). keepRole=${keepRole}`
  );

  return { success: true };
}

// ─── Search User by Email (for add member UIs) ──────────────────────────

export async function searchUserByEmail(
  email: string
): Promise<{ userId: string; name: string; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("profiles") as any)
    .select("id, full_name, email")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (!data) return null;
  return {
    userId: data.id,
    name: data.full_name || data.email?.split("@")[0] || "User",
    email: data.email,
  };
}
