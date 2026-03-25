"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Join a class using an invite code.
 * Also auto-joins the organization as a student if not already a member.
 * Enforces: org status, max_students limit, access_expires_at.
 */
export async function joinByInviteCode(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmedCode = code.trim().toLowerCase();
  if (!trimmedCode || trimmedCode.length < 4) {
    return { error: "Invalid code" };
  }

  // Find class by invite code — use supabaseAdmin to bypass RLS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabaseAdmin.from("classes") as any)
    .select("id, org_id, name")
    .eq("invite_code", trimmedCode)
    .single();

  if (!cls) return { error: "Invalid invite code" };

  // Check if already in class

  const { data: existing } = await (
    supabaseAdmin.from("class_memberships") as any
  )
    .select("id")
    .eq("user_id", user.id)
    .eq("class_id", cls.id)
    .single();

  if (existing) return { error: "Already in this class" };

  // ─── Enforcement: org status, expiry, capacity ──────────────────
  // Use supabaseAdmin to bypass RLS and read org data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabaseAdmin.from("organizations") as any)
    .select("id, status, max_students, access_expires_at")
    .eq("id", cls.org_id)
    .single();

  if (!org) return { error: "Organization not found" };

  // Check if org is active
  if (org.status !== "active") {
    return {
      error: "This organization is not active. Contact the administrator.",
    };
  }

  // Check expiry — auto-suspend if expired
  if (org.access_expires_at) {
    const expiresAt = new Date(org.access_expires_at);
    if (expiresAt < new Date()) {
      // Auto-suspend the org
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("organizations") as any)
        .update({ status: "suspended" })
        .eq("id", org.id);
      return {
        error:
          "This organization's access has expired. Contact the administrator.",
      };
    }
  }

  // Check student capacity (only students count, not teachers/directors/etc.)
  if (org.max_students != null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabaseAdmin.from("org_memberships") as any)
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("role", "student");

    if ((count || 0) >= org.max_students) {
      return {
        error:
          "This organization has reached its student limit. Contact the administrator.",
      };
    }
  }

  // ─── Auto-join org as student (if not already member) ───────────

  const { data: orgMember } = await (
    supabaseAdmin.from("org_memberships") as any
  )
    .select("id")
    .eq("user_id", user.id)
    .eq("org_id", cls.org_id)
    .single();

  if (!orgMember) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("org_memberships") as any).insert({
      user_id: user.id,
      org_id: cls.org_id,
      role: "student",
    });
  }

  // Join class

  const { error } = await (
    supabaseAdmin.from("class_memberships") as any
  ).insert({
    user_id: user.id,
    class_id: cls.id,
  });

  if (error) return { error: error.message };
  return { success: true, className: cls.name, classId: cls.id };
}

/**
 * Regenerate invite code for a class. Only the teacher can do this.
 */
export async function regenerateInviteCode(classId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify teacher — use supabaseAdmin for RLS bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabaseAdmin.from("classes") as any)
    .select("teacher_id")
    .eq("id", classId)
    .single();

  if (!cls || cls.teacher_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Generate new code
  const newCode = Math.random().toString(36).substring(2, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("classes") as any)
    .update({ invite_code: newCode })
    .eq("id", classId);

  if (error) return { error: error.message };
  return { inviteCode: newCode };
}

/**
 * Leave a class.
 */
export async function leaveClass(classId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from("class_memberships") as any)
    .delete()
    .eq("user_id", user.id)
    .eq("class_id", classId);

  if (error) return { error: error.message };
  return { success: true };
}
