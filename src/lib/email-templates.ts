// ─── Email Templates ─────────────────────────────────────────────────────
// All templates use table layout with inline styles for maximum
// email client compatibility (Gmail, Outlook, Apple Mail).
// ─────────────────────────────────────────────────────────────────────────

const COLORS = {
  orange: "#f97316",
  blue: "#3b82f6",
  white: "#ffffff",
  text: "#1a1a2a",
  lightBg: "#f9fafb",
  border: "#e5e7eb",
};

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${COLORS.lightBg};font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.lightBg};">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<!-- Header -->
<tr><td style="padding:32px 40px 24px;border-bottom:1px solid ${COLORS.border};">
<span style="font-size:28px;font-weight:800;color:${COLORS.orange};letter-spacing:2px;">AXIOM</span>
</td></tr>
<!-- Content -->
<tr><td style="padding:32px 40px;">
${content}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
<tr><td>
<a href="${url}" target="_blank" style="display:inline-block;background-color:${COLORS.orange};color:${COLORS.white};font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
${text}
</a>
</td></tr>
</table>`;
}

function footer(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid ${COLORS.border};padding-top:24px;">
<tr><td style="font-size:13px;color:#9ca3af;text-align:center;">
${text}
</td></tr>
</table>`;
}

// ─── TEMPLATE 1: Welcome Email ───────────────────────────────────────────

export function welcomeEmailHtml(name: string): string {
  const displayName = name || "there";
  return emailWrapper(`
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${COLORS.text};">Welcome to Axiom! 🎓</h1>
<p style="font-size:16px;color:${COLORS.text};line-height:1.6;margin:0 0 20px;">
Hi ${displayName}, we're excited to have you on board! Axiom is your AI-powered study companion — here's what you can do:
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">📸 <strong>Solve</strong> — Snap a photo of any problem and get step-by-step solutions</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">✍️ <strong>Write</strong> — Generate essays, summaries, and academic content</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">🪄 <strong>Humanize</strong> — Make AI text sound natural and undetectable</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">🧠 <strong>Learn</strong> — Chat with AI to deepen your understanding</td></tr>
</table>
${ctaButton("Start now →", "https://axiom-solver.com/solve")}
${footer("Axiom — AI Study Companion")}`);
}

export function welcomeEmailHtmlPt(name: string): string {
  const displayName = name || "estudante";
  return emailWrapper(`
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${COLORS.text};">Bem-vindo ao Axiom! 🎓</h1>
<p style="font-size:16px;color:${COLORS.text};line-height:1.6;margin:0 0 20px;">
Olá ${displayName}, estamos felizes em ter você conosco! O Axiom é seu companheiro de estudos com IA — veja o que você pode fazer:
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">📸 <strong>Resolver</strong> — Tire uma foto de qualquer problema e receba soluções passo a passo</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">✍️ <strong>Escrever</strong> — Gere redações, resumos e conteúdo acadêmico</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">🪄 <strong>Humanizar</strong> — Torne textos de IA naturais e indetectáveis</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};">🧠 <strong>Aprender</strong> — Converse com a IA para aprofundar seu conhecimento</td></tr>
</table>
${ctaButton("Começar agora →", "https://axiom-solver.com/solve")}
${footer("Axiom — Companheiro de Estudos com IA")}`);
}

// ─── TEMPLATE 2: Upgrade Email ───────────────────────────────────────────

export function upgradeEmailHtml(planName: string, features: string[]): string {
  const featureRows = features
    .map(
      (f) =>
        `<tr><td style="padding:6px 0;font-size:16px;color:${COLORS.text};">✅ ${f}</td></tr>`
    )
    .join("\n");

  return emailWrapper(`
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${COLORS.text};">Your ${planName} plan is active! ✨</h1>
<p style="font-size:16px;color:${COLORS.text};line-height:1.6;margin:0 0 20px;">
Thank you for upgrading! Here's what's now unlocked for you:
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${featureRows}
</table>
${ctaButton("Explore now →", "https://axiom-solver.com/solve")}
${footer('Axiom — AI Study Companion<br><a href="https://axiom-solver.com/settings" style="color:#9ca3af;">Manage your subscription</a>')}`);
}

export function upgradeEmailHtmlPt(
  planName: string,
  features: string[]
): string {
  const featureRows = features
    .map(
      (f) =>
        `<tr><td style="padding:6px 0;font-size:16px;color:${COLORS.text};">✅ ${f}</td></tr>`
    )
    .join("\n");

  return emailWrapper(`
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${COLORS.text};">Seu plano ${planName} está ativo! ✨</h1>
<p style="font-size:16px;color:${COLORS.text};line-height:1.6;margin:0 0 20px;">
Obrigado por fazer o upgrade! Veja o que agora está liberado para você:
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${featureRows}
</table>
${ctaButton("Explorar agora →", "https://axiom-solver.com/solve")}
${footer('Axiom — Companheiro de Estudos com IA<br><a href="https://axiom-solver.com/settings" style="color:#9ca3af;">Gerenciar sua assinatura</a>')}`);
}

// ─── TEMPLATE 3: Org Approved Email ──────────────────────────────────────

export function orgApprovedEmailHtml(orgName: string): string {
  return emailWrapper(`
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${COLORS.text};">Your institution has been approved! 🏫</h1>
<p style="font-size:16px;color:${COLORS.text};line-height:1.6;margin:0 0 20px;">
Great news — <strong>${orgName}</strong> is now an approved Axiom institution. Here are your next steps:
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};"><strong>1.</strong> Create your first class and invite students</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};"><strong>2.</strong> Share the institution code with your team</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};"><strong>3.</strong> Explore the analytics dashboards</td></tr>
</table>
${ctaButton("Access dashboard →", "https://axiom-solver.com/org")}
${footer('Axiom — AI Study Companion<br>Need help? <a href="mailto:mysupport@axiom-solver.com" style="color:#9ca3af;">mysupport@axiom-solver.com</a>')}`);
}

export function orgApprovedEmailHtmlPt(orgName: string): string {
  return emailWrapper(`
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${COLORS.text};">Sua instituição foi aprovada! 🏫</h1>
<p style="font-size:16px;color:${COLORS.text};line-height:1.6;margin:0 0 20px;">
Ótima notícia — <strong>${orgName}</strong> agora é uma instituição aprovada no Axiom. Próximos passos:
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};"><strong>1.</strong> Crie sua primeira turma e convide alunos</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};"><strong>2.</strong> Compartilhe o código da instituição com sua equipe</td></tr>
<tr><td style="padding:10px 0;font-size:16px;color:${COLORS.text};"><strong>3.</strong> Explore os dashboards de análise</td></tr>
</table>
${ctaButton("Acessar painel →", "https://axiom-solver.com/org")}
${footer('Axiom — Companheiro de Estudos com IA<br>Precisa de ajuda? <a href="mailto:mysupport@axiom-solver.com" style="color:#9ca3af;">mysupport@axiom-solver.com</a>')}`);
}
