"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { InviteCode, InviteCodeType, RedeemResult } from "@/types/invite-codes";

// ─── Helpers ─────────────────────────────────────────────────────────────

const PREFIX_MAP: Record<InviteCodeType, string> = {
  secretary: "SEC",
  gre: "GRE",
  director: "DIR",
  teacher: "PRF",
};

// Ambiguity-free charset (no O/0/I/1)
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(type: InviteCodeType): string {
  const prefix = PREFIX_MAP[type];
  let body = "";
  for (let i = 0; i < 6; i++) {
    body += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return `${prefix}-${body}`;
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("profiles") as any)
    .select("is_super_admin")
    .eq("id", userId)
    .single();
  return data?.is_super_admin === true;
}

async function getOrgRole(userId: string, orgId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("org_memberships") as any)
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();
  return data?.role || null;
}

// ─── 3A: Generate Invite Code ────────────────────────────────────────────

export async function generateInviteCode(input: {
  type: InviteCodeType;
  orgId: string;
}): Promise<{ code: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const isAdmin = await isSuperAdmin(user.id);

  // Permission check
  if (input.type === "secretary" || input.type === "gre") {
    if (!isAdmin) return { error: "Only administrators can generate this code type" };
  } else if (input.type === "director") {
    if (!isAdmin) {
      const role = await getOrgRole(user.id, input.orgId);
      if (!role || !["secretary", "admin", "director"].includes(role)) {
        return { error: "Not authorized to generate director codes for this organization" };
      }
    }
  } else if (input.type === "teacher") {
    if (!isAdmin) {
      const role = await getOrgRole(user.id, input.orgId);
      if (!role || !["admin", "director"].includes(role)) {
        return { error: "Not authorized to generate teacher codes for this organization" };
      }
    }
  }

  // Validate org exists and is active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabaseAdmin.from("organizations") as any)
    .select("id, status")
    .eq("id", input.orgId)
    .single();

  if (!org) return { error: "Organization not found" };
  if (org.status !== "active") return { error: "Organization is not active" };

  // Check if active code of same type already exists for this org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabaseAdmin.from("invite_codes") as any)
    .select("id")
    .eq("org_id", input.orgId)
    .eq("type", input.type)
    .eq("is_active", true)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "Active code already exists for this type. Use regenerate or deactivate first." };
  }

  // Generate unique code (max 5 attempts)
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode(input.type);
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

  if (!code) return { error: "Failed to generate unique code. Try again." };

  // Insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("invite_codes") as any).insert({
    code,
    type: input.type,
    org_id: input.orgId,
    created_by: user.id,
    max_uses: input.type === "teacher" ? null : 1,
  });

  if (error) return { error: error.message };
  return { code };
}

// ─── 3B: Redeem Invite Code ─────────────────────────────────────────────

export async function redeemInviteCode(input: {
  code: string;
  subjects?: string[];
}): Promise<RedeemResult | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode || normalizedCode.length < 6) {
    return { error: "Invalid code format" };
  }

  // Find code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteCode } = await (supabaseAdmin.from("invite_codes") as any)
    .select("*")
    .eq("code", normalizedCode)
    .single();

  if (!inviteCode) return { error: "Código não encontrado. Verifique e tente novamente." };
  if (!inviteCode.is_active) return { error: "Código desativado." };
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return { error: "Código expirado. Solicite novo código." };
  }
  if (inviteCode.max_uses !== null && inviteCode.used_count >= inviteCode.max_uses) {
    return { error: "Código já utilizado." };
  }

  // Check org is active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabaseAdmin.from("organizations") as any)
    .select("id, name, status")
    .eq("id", inviteCode.org_id)
    .single();

  if (!org || org.status !== "active") return { error: "Organização suspensa." };

  // Check if user already a member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingMember } = await (supabaseAdmin.from("org_memberships") as any)
    .select("id")
    .eq("user_id", user.id)
    .eq("org_id", inviteCode.org_id)
    .single();

  if (existingMember) return { error: "Você já faz parte desta organização." };

  // Map type → role
  const roleMap: Record<string, string> = {
    secretary: "secretary",
    gre: "director",
    director: "director",
    teacher: "teacher",
  };
  const role = roleMap[inviteCode.type] || "teacher";

  // Sanitize subjects
  let subjects: string[] = [];
  if (input.subjects && inviteCode.type === "teacher") {
    subjects = input.subjects
      .map((s: string) => s.trim().toLowerCase().slice(0, 20))
      .filter((s: string) => s.length > 0)
      .slice(0, 15);
  }

  // Create membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: memberError } = await (supabaseAdmin.from("org_memberships") as any).insert({
    user_id: user.id,
    org_id: inviteCode.org_id,
    role,
    subjects: subjects.length > 0 ? subjects : [],
  });

  if (memberError) {
    if (memberError.code === "23505") return { error: "Você já faz parte desta organização." };
    return { error: memberError.message };
  }

  // Increment used_count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin.from("invite_codes") as any)
    .update({ used_count: inviteCode.used_count + 1 })
    .eq("id", inviteCode.id);

  return {
    success: true,
    role,
    orgId: org.id,
    orgName: org.name,
    requiresSubjects: inviteCode.type === "teacher",
  };
}

// ─── 3C: Get Org Invite Codes ───────────────────────────────────────────

export async function getOrgInviteCodes(orgId: string): Promise<InviteCode[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const isAdmin = await isSuperAdmin(user.id);
  if (!isAdmin) {
    const role = await getOrgRole(user.id, orgId);
    if (!role || !["director", "secretary", "admin"].includes(role)) return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("invite_codes") as any)
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (data || []) as InviteCode[];
}

// ─── 3D: Deactivate Invite Code ─────────────────────────────────────────

export async function deactivateInviteCode(
  codeId: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get code to check org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: code } = await (supabaseAdmin.from("invite_codes") as any)
    .select("id, org_id")
    .eq("id", codeId)
    .single();

  if (!code) return { error: "Code not found" };

  // Permission
  const isAdmin = await isSuperAdmin(user.id);
  if (!isAdmin) {
    const role = await getOrgRole(user.id, code.org_id);
    if (!role || !["director", "secretary", "admin"].includes(role)) {
      return { error: "Not authorized" };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("invite_codes") as any)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", codeId);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── 3E: Regenerate Invite Code ─────────────────────────────────────────

export async function regenerateInviteCodeByType(
  codeId: string
): Promise<{ code: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get old code details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oldCode } = await (supabaseAdmin.from("invite_codes") as any)
    .select("id, type, org_id")
    .eq("id", codeId)
    .single();

  if (!oldCode) return { error: "Code not found" };

  // Permission
  const isAdmin = await isSuperAdmin(user.id);
  if (!isAdmin) {
    const role = await getOrgRole(user.id, oldCode.org_id);
    if (!role || !["director", "secretary", "admin"].includes(role)) {
      return { error: "Not authorized" };
    }
  }

  // Deactivate old code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin.from("invite_codes") as any)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", codeId);

  // Generate new code with same type and org
  return generateInviteCode({ type: oldCode.type, orgId: oldCode.org_id });
}

// ─── 3F: Update Member Subjects ─────────────────────────────────────────

export async function updateMemberSubjects(
  orgId: string,
  subjects: string[]
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Sanitize subjects
  const sanitized = subjects
    .map((s) => s.trim().slice(0, 20))
    .filter((s) => s.length > 0)
    .slice(0, 15);

  if (sanitized.length === 0) return { error: "Select at least one subject" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("org_memberships") as any)
    .update({ subjects: sanitized })
    .eq("user_id", user.id)
    .eq("org_id", orgId);

  if (error) return { error: error.message };
  return { success: true };
}
