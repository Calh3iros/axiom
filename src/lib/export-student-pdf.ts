"use client";

import jsPDF from "jspdf";

import type { StudentReport } from "@/lib/actions/report";

// --- Colors ---------------------------------------------------------------
const ORANGE = [249, 115, 22] as const; // Axiom orange
const DARK = [51, 51, 51] as const;
const DIM = [136, 136, 136] as const;
const WHITE = [255, 255, 255] as const;
const GREEN_BG = [34, 197, 94] as const;
const RED_BG = [239, 68, 68] as const;
const YELLOW_BG = [234, 179, 8] as const;
const BLUE_BG = [59, 130, 246] as const;

// --- Helpers --------------------------------------------------------------
function setColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function setFillColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

/** Level as ASCII art: [***--] for level 3/5 */
function levelBar(level: number): string {
  return "[" + "*".repeat(level) + "-".repeat(5 - level) + "]";
}

function masteryColor(percent: number): readonly [number, number, number] {
  if (percent >= 90) return BLUE_BG;
  if (percent >= 70) return ORANGE;
  if (percent >= 40) return YELLOW_BG;
  return RED_BG;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

/** Strip any character outside basic Latin (32-126) + accented Latin range */
function safeText(text: string): string {
  return text
    .replace(/—/g, "-")
    .replace(/·/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, "");
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  setColor(doc, DIM);
  doc.text(
    "Relatorio confidencial - uso exclusivo para fins pedagogicos",
    pw / 2,
    ph - 10,
    { align: "center" }
  );
  doc.text(
    "Gerado por Axiom - axiom-solver.com",
    pw / 2,
    ph - 6,
    { align: "center" }
  );
  doc.text(`${pageNum}/${totalPages}`, pw - 20, ph - 6);
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, margin: number): number {
  const ph = doc.internal.pageSize.getHeight();
  if (y + needed > ph - margin - 16) {
    doc.addPage();
    return 25;
  }
  return y;
}

// --- Export ----------------------------------------------------------------

export async function exportStudentPdf(report: StudentReport): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pw - margin * 2;
  let y: number;

  // -- PAGE 1: Cover + KPIs ------------------------------------------------
  // Header bar
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(doc, WHITE);
  doc.text("AXIOM", margin, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relatorio Individual do Aluno", margin, 24);

  // Student info
  y = 44;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text(safeText(report.student.name), margin, y);
  y += 9;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  setColor(doc, DIM);
  doc.text(safeText(`${report.class.name} - ${report.class.org_name}`), margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`Dados acumulados desde ${formatDate(report.stats.member_since)}`, margin, y);
  y += 4;
  doc.text(`Gerado em ${formatDate(report.generated_at)}`, margin, y);

  // KPI cards -- 5 across
  y += 12;
  const cardW = (contentW - 4 * 3) / 5;
  const kpis = [
    { label: "TOTAL RESOLVIDO", value: String(report.stats.total_solved) },
    { label: "PRECISAO", value: `${report.stats.accuracy_percent}%` },
    { label: "SEQUENCIA", value: `${report.stats.current_streak} dias` },
    { label: "CONQUISTAS", value: String(report.stats.badges_count) },
    { label: "DIAS ATIVOS", value: String(report.stats.days_active) },
  ];

  for (let i = 0; i < kpis.length; i++) {
    const x = margin + i * (cardW + 3);
    // Card background
    setFillColor(doc, [245, 245, 245]);
    doc.roundedRect(x, y, cardW, 28, 2, 2, "F");
    // Value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    setColor(doc, DARK);
    doc.text(kpis[i].value, x + cardW / 2, y + 12, { align: "center" });
    // Label
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    setColor(doc, DIM);
    doc.text(kpis[i].label, x + cardW / 2, y + 20, { align: "center" });
  }
  y += 36;

  // Strengths & Weaknesses
  const halfW = (contentW - 4) / 2;

  // Strengths
  setFillColor(doc, [240, 253, 244]);
  doc.roundedRect(margin, y, halfW, 8 + report.strengths.slice(0, 6).length * 5.5 + 4, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(doc, GREEN_BG);
  doc.text("(+) PONTOS FORTES", margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, DARK);
  const strengthList = report.strengths.length > 0 ? report.strengths.slice(0, 6) : ["Sem pontos fortes identificados ainda"];
  for (let i = 0; i < strengthList.length; i++) {
    doc.text(safeText(`> ${strengthList[i]}`), margin + 4, y + 12 + i * 5.5);
  }

  // Weaknesses
  const weakX = margin + halfW + 4;
  setFillColor(doc, [254, 242, 242]);
  doc.roundedRect(weakX, y, halfW, 8 + report.weaknesses.slice(0, 6).length * 5.5 + 4, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(doc, RED_BG);
  doc.text("(!) PRECISA DE REFORCO", weakX + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, DARK);
  const weaknessList = report.weaknesses.length > 0 ? report.weaknesses.slice(0, 6) : ["Sem pontos de atencao identificados"];
  for (let i = 0; i < weaknessList.length; i++) {
    doc.text(safeText(`> ${weaknessList[i]}`), weakX + 4, y + 12 + i * 5.5);
  }

  y += Math.max(
    8 + strengthList.length * 5.5 + 4,
    8 + weaknessList.length * 5.5 + 4
  ) + 8;

  // Activity summary
  y = checkPageBreak(doc, y, 20, margin);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("ATIVIDADE RECENTE (30 DIAS)", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const trendLabel = report.activity.trend === "improving" ? "Melhorando" : report.activity.trend === "declining" ? "Em queda" : "Estavel";
  doc.text(`Tendencia: ${trendLabel}  |  ${report.activity.exercises_30d} exercicios  |  ${report.activity.days_active_30d} dias ativos`, margin, y);
  y += 5;
  doc.text(`Uso: ${report.usage.solves} resolves  -  ${report.usage.writes} redacoes  -  ${report.usage.humanizes} humanizacoes  -  ${report.usage.learns} aprendizados`, margin, y);

  // -- PAGE 2: Knowledge Map -----------------------------------------------
  doc.addPage();
  y = 20;

  // Section header
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(doc, WHITE);
  doc.text("MAPA DE CONHECIMENTO", margin, 10);
  y = 22;

  for (const subject of report.subjects) {
    y = checkPageBreak(doc, y, 14 + subject.topics.length * 7, margin);

    // Subject header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    setColor(doc, DARK);
    doc.text(safeText(subject.name), margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(doc, DIM);
    doc.text(`Dominio medio: ${subject.avg_mastery}%  -  ${subject.topics_mastered}/${subject.total_topics} dominados`, margin + 45, y);
    y += 4;

    // Table header
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    setColor(doc, DIM);
    doc.text("TOPICO", margin, y);
    doc.text("NIVEL", margin + 70, y);
    doc.text("DOMINIO", margin + 95, y);
    doc.text("OK", margin + 125, y);
    doc.text("ERR", margin + 135, y);
    y += 1;
    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pw - margin, y);
    y += 3;

    for (const topic of subject.topics) {
      y = checkPageBreak(doc, y, 7, margin);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setColor(doc, DARK);
      // Truncate long topic names
      const topicName = topic.name.length > 30 ? topic.name.slice(0, 28) + "..." : topic.name;
      doc.text(safeText(topicName), margin, y);

      // Level bar
      doc.setFontSize(7);
      doc.text(levelBar(topic.level), margin + 70, y);

      // Mastery bar
      const barX = margin + 95;
      const barW = 25;
      const barH = 3;
      setFillColor(doc, [230, 230, 230]);
      doc.roundedRect(barX, y - 2.5, barW, barH, 1, 1, "F");
      const mc = masteryColor(topic.mastery_percent);
      setFillColor(doc, mc);
      const fillW = Math.max(1, (topic.mastery_percent / 100) * barW);
      doc.roundedRect(barX, y - 2.5, fillW, barH, 1, 1, "F");
      doc.setFontSize(5.5);
      setColor(doc, DIM);
      doc.text(`${topic.mastery_percent}%`, barX + barW + 2, y);

      // Correct/incorrect
      doc.setFontSize(7);
      setColor(doc, GREEN_BG);
      doc.text(String(topic.correct_count), margin + 125, y);
      setColor(doc, RED_BG);
      doc.text(String(topic.incorrect_count), margin + 135, y);

      y += 5.5;
    }
    y += 4;
  }

  // -- Badges section -------------------------------------------------------
  if (report.badges.length > 0) {
    y = checkPageBreak(doc, y, 30, margin);
    if (y < 30) {
      // New page already, add header
      setFillColor(doc, ORANGE);
      doc.rect(0, 0, pw, 14, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      setColor(doc, WHITE);
      doc.text("CONQUISTAS", margin, 10);
      y = 22;
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      setColor(doc, DARK);
      doc.text("CONQUISTAS", margin, y);
      y += 6;
    }

    const badgeCols = 4;
    const badgeW = (contentW - (badgeCols - 1) * 3) / badgeCols;
    for (let i = 0; i < report.badges.length; i++) {
      const col = i % badgeCols;
      if (col === 0 && i > 0) y += 14;
      y = checkPageBreak(doc, y, 14, margin);
      const x = margin + col * (badgeW + 3);
      setFillColor(doc, [245, 245, 245]);
      doc.roundedRect(x, y, badgeW, 12, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      setColor(doc, DARK);
      const badgeName = report.badges[i].name.length > 16 ? report.badges[i].name.slice(0, 14) + "..." : report.badges[i].name;
      doc.text(safeText(badgeName), x + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      setColor(doc, DIM);
      doc.text(formatDate(report.badges[i].unlocked_at), x + 4, y + 10);
    }
  }

  // -- Footers on all pages -------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, totalPages);
  }

  // -- Save -----------------------------------------------------------------
  const date = new Date().toISOString().split("T")[0];
  const filename = `axiom-relatorio-${slugify(report.student.name)}-${date}.pdf`;
  doc.save(filename);
}

// --- Full Class Export ----------------------------------------------------

export async function exportClassPdf(reports: StudentReport[], className: string): Promise<void> {
  if (reports.length === 0) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;

  for (let ridx = 0; ridx < reports.length; ridx++) {
    const report = reports[ridx];
    if (ridx > 0) doc.addPage();

    let y: number;

    // Header
    setFillColor(doc, ORANGE);
    doc.rect(0, 0, pw, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setColor(doc, WHITE);
    doc.text("AXIOM", margin, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(safeText(`Relatorio - ${className}`), margin, 20);

    // Student name
    y = 38;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    setColor(doc, DARK);
    doc.text(safeText(report.student.name), margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    setColor(doc, DIM);
    doc.text(`Membro desde ${formatDate(report.stats.member_since)}`, margin, y);
    y += 10;

    // Quick stats in a line
    doc.setFontSize(9);
    setColor(doc, DARK);
    doc.setFont("helvetica", "bold");
    const statLine = `Resolvidos: ${report.stats.total_solved}  |  Precisao: ${report.stats.accuracy_percent}%  |  Sequencia: ${report.stats.current_streak}d  |  Conquistas: ${report.stats.badges_count}  |  Dias ativos (30d): ${report.activity.days_active_30d}`;
    doc.text(statLine, margin, y);
    y += 8;

    // Knowledge map compact
    if (report.subjects.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      setColor(doc, DARK);
      doc.text("Mapa de Conhecimento", margin, y);
      y += 5;

      for (const subject of report.subjects) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        setColor(doc, DARK);
        doc.text(safeText(`${subject.name} (${subject.avg_mastery}%)`), margin, y);
        y += 4;
        for (const topic of subject.topics) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          setColor(doc, DIM);
          doc.text(safeText(`  ${topic.name}: ${levelBar(topic.level)} ${topic.mastery_percent}%`), margin, y);
          y += 4;
          if (y > 270) { doc.addPage(); y = 20; }
        }
        y += 2;
      }
    }

    // Strengths & Weaknesses compact
    y += 2;
    if (report.strengths.length > 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setColor(doc, GREEN_BG);
      doc.text("Pontos Fortes:", margin, y);
      doc.setFont("helvetica", "normal");
      setColor(doc, DARK);
      doc.text(safeText(report.strengths.slice(0, 5).join(", ")), margin + 25, y);
      y += 5;
    }
    if (report.weaknesses.length > 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setColor(doc, RED_BG);
      doc.text("Precisa Reforco:", margin, y);
      doc.setFont("helvetica", "normal");
      setColor(doc, DARK);
      doc.text(safeText(report.weaknesses.slice(0, 5).join(", ")), margin + 28, y);
      y += 5;
    }
  }

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, totalPages);
  }

  const date = new Date().toISOString().split("T")[0];
  doc.save(`axiom-turma-${slugify(className)}-${date}.pdf`);
}
