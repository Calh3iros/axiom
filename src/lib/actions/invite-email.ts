"use server";

import { sendEmail } from "@/lib/email";
import { inviteEmailHtml } from "@/lib/email-templates";
import { createClient } from "@/lib/supabase/server";

export async function sendInviteEmail(input: {
  email: string;
  code: string;
  orgName: string;
  senderName: string;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { error: "Invalid email format" };
    }

    const inviteLink = `https://axiom-solver.com/join?code=${input.code}`;

    await sendEmail({
      to: input.email,
      subject: `Convite para o Axiom — ${input.orgName}`,
      html: inviteEmailHtml(
        input.orgName,
        input.code,
        inviteLink,
        input.senderName
      ),
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending invite email:", error);
    return { error: "Failed to send email" };
  }
}
