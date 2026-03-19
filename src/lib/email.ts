import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured, skipping");
    return;
  }
  try {
    await resend.emails.send({
      from: "Axiom <noreply@axiom-solver.com>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
  }
}
