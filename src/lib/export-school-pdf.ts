"use client";

import jsPDF from "jspdf";

// --- Colors ---------------------------------------------------------------
const ORANGE = [249, 115, 22] as const;
const DARK = [51, 51, 51] as const;
const DIM = [136, 136, 136] as const;
const WHITE = [255, 255, 255] as const;
const GREEN = [34, 197, 94] as const;
const RED = [239, 68, 68] as const;
const YELLOW = [234, 179, 8] as const;

// --- Helpers --------------------------------------------------------------
function setColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function setFillColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function safeText(text: string): string {
  return text
    .replace(/—/g, "-")
    .replace(/·/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, "");
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
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
  doc.text("Gerado por Axiom - axiom-solver.com", pw / 2, ph - 6, {
    align: "center",
  });
  doc.text(`${pageNum}/${totalPages}`, pw - 20, ph - 6);
}

function semaphoreColor(pct: number): readonly [number, number, number] {
  if (pct >= 70) return GREEN;
  if (pct >= 50) return YELLOW;
  return RED;
}

// --- Types ----------------------------------------------------------------
export interface SchoolReportData {
  schoolName: string;
  period: string;
  generatedBy: string;
  // KPIs
  totalStudents: number;
  activeStudents: number;
  totalSolved: number;
  overallAccuracy: number;
  avgStreak: number;
  adoption: number;
  // Class comparison
  classComparison: {
    className: string;
    teacherName?: string;
    students: number;
    active7d: number;
    avgSolved: number;
    avgAccuracy: number;
    adoption: number;
  }[];
  // Weekly evolution
  weeklyEvolution: { week: string; solved: number }[];
  // Alerts
  engagementAlerts: {
    className: string;
    thisWeek: number;
    lastWeek: number;
    dropPct: number;
  }[];
  // Members
  managers: { name: string; role: string; email: string }[];
}

// --- Export School PDF (3 pages) ------------------------------------------

export async function exportSchoolPdf(data: SchoolReportData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pw - margin * 2;

  // ═══════════ PAGE 1: Cover + KPIs + Class Comparison ═══════════

  // Header bar
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(doc, WHITE);
  doc.text("AXIOM", margin, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relatorio Institucional", margin, 24);

  // School info
  let y = 44;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text(safeText(data.schoolName), margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor(doc, DIM);
  doc.text(`Periodo: ${safeText(data.period)}`, margin, y);
  y += 5;
  doc.text(
    `Gerado por ${safeText(data.generatedBy)} em ${new Date().toLocaleDateString("pt-BR")}`,
    margin,
    y
  );

  // KPI cards
  y += 12;
  const kpiW = (contentW - 4 * 4) / 5;
  const kpis = [
    { label: "TOTAL ALUNOS", value: String(data.totalStudents) },
    { label: "ATIVOS", value: String(data.activeStudents) },
    { label: "EXERCICIOS", value: String(data.totalSolved) },
    { label: "PRECISAO", value: `${data.overallAccuracy}%` },
    { label: "ADOCAO", value: `${data.adoption}%` },
  ];

  for (let i = 0; i < kpis.length; i++) {
    const x = margin + i * (kpiW + 4);
    setFillColor(doc, [245, 245, 245]);
    doc.roundedRect(x, y, kpiW, 26, 2, 2, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    setColor(doc, DARK);
    doc.text(kpis[i].value, x + kpiW / 2, y + 11, { align: "center" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    setColor(doc, DIM);
    doc.text(kpis[i].label, x + kpiW / 2, y + 19, { align: "center" });
  }
  y += 34;

  // Class comparison table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("COMPARATIVO DE TURMAS", margin, y);
  y += 6;

  // Table header
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setColor(doc, DIM);
  const cols = [
    { label: "TURMA", x: margin },
    { label: "PROFESSOR", x: margin + 35 },
    { label: "ALUNOS", x: margin + 75 },
    { label: "PRECISAO", x: margin + 95 },
    { label: "ADOCAO", x: margin + 118 },
    { label: "MEDIA", x: margin + 140 },
  ];
  cols.forEach((c) => doc.text(c.label, c.x, y));
  y += 1;
  doc.setLineWidth(0.2);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pw - margin, y);
  y += 3;

  // Sort by accuracy descending
  const sorted = [...data.classComparison].sort(
    (a, b) => b.avgAccuracy - a.avgAccuracy
  );
  for (const cls of sorted.slice(0, 12)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(doc, DARK);
    const clsName =
      cls.className.length > 15
        ? cls.className.slice(0, 13) + "..."
        : cls.className;
    doc.text(safeText(clsName), margin, y);
    doc.text(safeText(cls.teacherName || "-"), margin + 35, y);
    doc.text(String(cls.students), margin + 75, y);

    // Accuracy with semaphore
    const accColor = semaphoreColor(cls.avgAccuracy);
    setColor(doc, accColor);
    doc.text(`${cls.avgAccuracy}%`, margin + 95, y);

    // Adoption with semaphore
    const adpColor = semaphoreColor(cls.adoption);
    setColor(doc, adpColor);
    doc.text(`${cls.adoption}%`, margin + 118, y);

    setColor(doc, DARK);
    doc.text(String(cls.avgSolved), margin + 140, y);
    y += 5;
  }

  // ═══════════ PAGE 2: Weekly Evolution + Distribution ═══════════

  doc.addPage();
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(doc, WHITE);
  doc.text("EVOLUCAO E DISTRIBUICAO", margin, 10);
  y = 22;

  // Weekly evolution as bar chart
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("EVOLUCAO SEMANAL", margin, y);
  y += 6;

  if (data.weeklyEvolution.length > 0) {
    const maxSolved = Math.max(...data.weeklyEvolution.map((w) => w.solved), 1);
    const barMaxW = contentW - 30;
    const barH = 5;

    for (const week of data.weeklyEvolution.slice(-8)) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      setColor(doc, DIM);
      doc.text(week.week, margin, y + 3);

      // Bar
      const barW = Math.max(2, (week.solved / maxSolved) * barMaxW);
      setFillColor(doc, ORANGE);
      doc.roundedRect(margin + 25, y, barW, barH, 1, 1, "F");

      // Value
      doc.setFontSize(6);
      setColor(doc, DARK);
      doc.text(String(week.solved), margin + 25 + barW + 2, y + 3.5);

      y += 7;
    }
  }

  y += 8;

  // Accuracy distribution as simple text bars
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("DISTRIBUICAO DE PRECISAO", margin, y);
  y += 6;

  // Compute from class data
  const accBuckets = [0, 0, 0, 0];
  const accLabels = ["0-30%", "30-50%", "50-70%", "70-100%"];
  const accColors = [RED, YELLOW, ORANGE, GREEN] as const;
  for (const cls of data.classComparison) {
    if (cls.avgAccuracy < 30) accBuckets[0] += cls.students;
    else if (cls.avgAccuracy < 50) accBuckets[1] += cls.students;
    else if (cls.avgAccuracy < 70) accBuckets[2] += cls.students;
    else accBuckets[3] += cls.students;
  }
  const maxBucket = Math.max(...accBuckets, 1);

  for (let i = 0; i < 4; i++) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(doc, DIM);
    doc.text(accLabels[i], margin, y + 3);

    const barW = Math.max(2, (accBuckets[i] / maxBucket) * (contentW - 40));
    setFillColor(doc, accColors[i]);
    doc.roundedRect(margin + 22, y, barW, 5, 1, 1, "F");

    doc.setFontSize(6);
    setColor(doc, DARK);
    doc.text(`${accBuckets[i]} alunos`, margin + 22 + barW + 2, y + 3.5);
    y += 7;
  }

  // ═══════════ PAGE 3: Alerts + Members ═══════════

  doc.addPage();
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(doc, WHITE);
  doc.text("ALERTAS E EQUIPE", margin, 10);
  y = 22;

  // Engagement alerts
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("ALERTAS DE ENGAJAMENTO", margin, y);
  y += 6;

  if (data.engagementAlerts.length === 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setColor(doc, GREEN);
    doc.text(
      "Nenhum alerta ativo - todas as turmas com engajamento saudavel!",
      margin,
      y
    );
    y += 8;
  } else {
    for (const alert of data.engagementAlerts.slice(0, 8)) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      setColor(doc, RED);
      doc.text(
        `! ${safeText(alert.className)}: queda de ${alert.dropPct}% (${alert.lastWeek} -> ${alert.thisWeek} exercicios)`,
        margin,
        y
      );
      y += 5;
    }
  }

  y += 8;

  // Team members
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("EQUIPE DA ESCOLA", margin, y);
  y += 6;

  for (const mgr of data.managers) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(doc, DARK);
    doc.text(
      `${safeText(mgr.name)} - ${safeText(mgr.role)} (${safeText(mgr.email)})`,
      margin,
      y
    );
    y += 5;
  }

  y += 10;

  // Footer note
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  setColor(doc, DIM);
  doc.text(
    "Este relatorio foi gerado automaticamente pela plataforma Axiom.",
    margin,
    y
  );

  // -- Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, totalPages);
  }

  // -- Save
  const date = new Date().toISOString().split("T")[0];
  doc.save(`axiom-escola-${slugify(data.schoolName)}-${date}.pdf`);
}
