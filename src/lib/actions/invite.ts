"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Join a class using an invite code.
 * Also auto-joins the organization as a student if not already a member.
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

  // Find class by invite code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabase.from("classes") as any)
    .select("id, org_id, name")
    .eq("invite_code", trimmedCode)
    .single();

  if (!cls) return { error: "Invalid invite code" };

  // Check if already in class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from("class_memberships") as any)
    .select("id")
    .eq("user_id", user.id)
    .eq("class_id", cls.id)
    .single();

  if (existing) return { error: "Already in this class" };

  // Auto-join org as student (if not already member)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgMember } = await (supabase.from("org_memberships") as any)
    .select("id")
    .eq("user_id", user.id)
    .eq("org_id", cls.org_id)
    .single();

  if (!orgMember) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("org_memberships") as any).insert({
      user_id: user.id,
      org_id: cls.org_id,
      role: "student",
    });
  }

  // Join class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("class_memberships") as any).insert({
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

  // Verify teacher
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls } = await (supabase.from("classes") as any)
    .select("teacher_id")
    .eq("id", classId)
    .single();

  if (!cls || cls.teacher_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Generate new code
  const newCode = Math.random().toString(36).substring(2, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("classes") as any)
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
  const { error } = await (supabase.from("class_memberships") as any)
    .delete()
    .eq("user_id", user.id)
    .eq("class_id", classId);

  if (error) return { error: error.message };
  return { success: true };
}
