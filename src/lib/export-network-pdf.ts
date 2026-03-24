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
const BLUE = [59, 130, 246] as const;

// --- Types ----------------------------------------------------------------
export interface NetworkPdfData {
  networkName: string;
  schoolCount: number;
  kpis: {
    totalStudents: number;
    activeStudents: number;
    totalTeachers: number;
    totalClasses: number;
    avgAccuracy: number;
    totalExercises: number;
    avgStreak: number;
    adoption: number;
  };
  schoolComparison: {
    orgName: string;
    students: number;
    active7d: number;
    teachers: number;
    classes: number;
    avgAccuracy: number;
    adoption: number;
    avgStreak: number;
    score: number;
    status: string;
  }[];
  alerts: { orgName: string; message: string; severity: string }[];
  weeklyEvolution: { week: string; exercises: number }[];
  period: string;
}

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
function statusEmoji(status: string): string {
  if (status === "green") return "[OK]";
  if (status === "yellow") return "[!]";
  return "[X]";
}

// --- Main Export ----------------------------------------------------------
export function exportNetworkPdf(data: NetworkPdfData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // ~210mm
  const margin = 15;
  const contentW = pw - margin * 2;
  const date = new Date().toISOString().split("T")[0];
  const totalPages = 3;

  // ─── PAGE 1: Cover + KPIs ─────────────────────────────────────────────
  // Header bar
  setFillColor(doc, ORANGE);
  doc.roundedRect(margin, 12, contentW, 26, 4, 4, "F");
  doc.setFontSize(18);
  setColor(doc, WHITE);
  doc.text("AXIOM", margin + 8, 25);
  doc.setFontSize(10);
  doc.text("Relatorio Executivo da Rede", margin + 8, 32);

  // Network name & period
  let y = 50;
  doc.setFontSize(14);
  setColor(doc, DARK);
  doc.text(safeText(data.networkName), margin, y);
  y += 7;
  doc.setFontSize(9);
  setColor(doc, DIM);
  doc.text(`Periodo: ${data.period}`, margin, y);
  doc.text(`${data.schoolCount} escolas`, pw - margin, y, { align: "right" });
  y += 12;

  // KPI Grid (2x4)
  const kpiLabels = [
    {
      label: "Total de Alunos",
      value: `${data.kpis.totalStudents}`,
      sub: `${data.kpis.activeStudents} ativos`,
    },
    {
      label: "Total de Professores",
      value: `${data.kpis.totalTeachers}`,
      sub: `${data.kpis.totalClasses} turmas`,
    },
    { label: "Precisao Media", value: `${data.kpis.avgAccuracy}%`, sub: "" },
    { label: "Adocao", value: `${data.kpis.adoption}%`, sub: "" },
    {
      label: "Exercicios Resolvidos",
      value: `${data.kpis.totalExercises}`,
      sub: "",
    },
    { label: "Streak Medio", value: `${data.kpis.avgStreak} dias`, sub: "" },
  ];

  const kpiW = (contentW - 10) / 3;
  const kpiH = 22;
  kpiLabels.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = margin + col * (kpiW + 5);
    const ky = y + row * (kpiH + 5);

    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(kx, ky, kpiW, kpiH, 3, 3, "S");
    doc.setFontSize(8);
    setColor(doc, DIM);
    doc.text(safeText(kpi.label), kx + 4, ky + 8);
    doc.setFontSize(16);
    setColor(doc, DARK);
    doc.text(kpi.value, kx + 4, ky + 17);
    if (kpi.sub) {
      doc.setFontSize(7);
      setColor(doc, DIM);
      doc.text(kpi.sub, kx + kpiW - 4, ky + 17, { align: "right" });
    }
  });

  y += 2 * (kpiH + 5) + 10;

  // Alerts section
  if (data.alerts.length > 0) {
    doc.setFontSize(11);
    setColor(doc, RED);
    doc.text(`Alertas (${data.alerts.length})`, margin, y);
    y += 6;

    const maxAlerts = Math.min(data.alerts.length, 8);
    for (let i = 0; i < maxAlerts; i++) {
      const a = data.alerts[i];
      const alertColor =
        a.severity === "error" ? RED : a.severity === "warning" ? YELLOW : DIM;
      setFillColor(doc, [245, 245, 248]);
      doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
      doc.setFontSize(8);
      setColor(doc, DARK);
      doc.text(safeText(a.orgName), margin + 3, y + 5.5);
      setColor(doc, alertColor);
      doc.text(safeText(a.message), pw - margin - 3, y + 5.5, {
        align: "right",
      });
      y += 10;
    }
  }

  addFooter(doc, 1, totalPages);

  // ─── PAGE 2: School Comparison Table ───────────────────────────────────
  doc.addPage();
  // Header bar
  setFillColor(doc, ORANGE);
  doc.roundedRect(margin, 12, contentW, 18, 4, 4, "F");
  doc.setFontSize(12);
  setColor(doc, WHITE);
  doc.text("Comparacao entre Escolas", margin + 8, 24);

  y = 40;
  // Table header
  const cols = [
    { label: "Escola", x: margin, w: 55 },
    { label: "Alunos", x: margin + 55, w: 18 },
    { label: "Ativos", x: margin + 73, w: 18 },
    { label: "Turmas", x: margin + 91, w: 18 },
    { label: "Precisao", x: margin + 109, w: 22 },
    { label: "Adocao", x: margin + 131, w: 20 },
    { label: "Score", x: margin + 151, w: 16 },
    { label: "Status", x: margin + 167, w: 16 },
  ];

  setFillColor(doc, [240, 240, 244]);
  doc.roundedRect(margin, y - 1, contentW, 8, 1, 1, "F");
  doc.setFontSize(7);
  setColor(doc, DIM);
  cols.forEach((col) => {
    doc.text(col.label, col.x + 2, y + 5);
  });
  y += 10;

  // Table rows
  doc.setFontSize(8);
  const maxRows = Math.min(data.schoolComparison.length, 20);
  for (let i = 0; i < maxRows; i++) {
    const s = data.schoolComparison[i];
    if (y > 265) {
      addFooter(doc, 2, totalPages);
      doc.addPage();
      y = 20;
    }

    if (i % 2 === 0) {
      setFillColor(doc, [250, 250, 252]);
      doc.rect(margin, y - 1, contentW, 8, "F");
    }

    setColor(doc, DARK);
    doc.text(safeText(s.orgName).substring(0, 28), cols[0].x + 2, y + 5);
    doc.text(`${s.students}`, cols[1].x + 2, y + 5);
    doc.text(`${s.active7d}`, cols[2].x + 2, y + 5);
    doc.text(`${s.classes}`, cols[3].x + 2, y + 5);

    setColor(doc, semaphoreColor(s.avgAccuracy));
    doc.text(`${s.avgAccuracy}%`, cols[4].x + 2, y + 5);

    setColor(doc, semaphoreColor(s.adoption));
    doc.text(`${s.adoption}%`, cols[5].x + 2, y + 5);

    setColor(doc, semaphoreColor(s.score));
    doc.text(`${s.score}`, cols[6].x + 2, y + 5);

    setColor(
      doc,
      s.status === "green" ? GREEN : s.status === "yellow" ? YELLOW : RED
    );
    doc.text(statusEmoji(s.status), cols[7].x + 2, y + 5);

    y += 9;
  }

  addFooter(doc, 2, totalPages);

  // ─── PAGE 3: Weekly Evolution + Summary ────────────────────────────────
  doc.addPage();
  // Header bar
  setFillColor(doc, ORANGE);
  doc.roundedRect(margin, 12, contentW, 18, 4, 4, "F");
  doc.setFontSize(12);
  setColor(doc, WHITE);
  doc.text("Evolucao e Resumo", margin + 8, 24);

  y = 40;
  // Weekly evolution as text table
  doc.setFontSize(10);
  setColor(doc, DARK);
  doc.text("Evolucao Semanal (exercicios resolvidos)", margin, y);
  y += 8;

  if (data.weeklyEvolution.length > 0) {
    const maxEx = Math.max(...data.weeklyEvolution.map((w) => w.exercises), 1);
    const barMaxW = contentW - 50;

    for (const week of data.weeklyEvolution.slice(-12)) {
      if (y > 260) break;
      doc.setFontSize(7);
      setColor(doc, DIM);
      doc.text(week.week, margin, y + 4);

      const barW = Math.max(2, (week.exercises / maxEx) * barMaxW);
      setFillColor(doc, BLUE);
      doc.roundedRect(margin + 30, y, barW, 5, 1, 1, "F");

      doc.setFontSize(7);
      setColor(doc, DARK);
      doc.text(`${week.exercises}`, margin + 32 + barW, y + 4);
      y += 8;
    }
  } else {
    doc.setFontSize(8);
    setColor(doc, DIM);
    doc.text("Sem dados de evolucao no periodo selecionado.", margin, y);
    y += 12;
  }

  y += 10;

  // Summary box
  doc.setFontSize(10);
  setColor(doc, DARK);
  doc.text("Resumo Executivo", margin, y);
  y += 8;
  doc.setFontSize(8);
  setColor(doc, DIM);

  const greenCount = data.schoolComparison.filter(
    (s) => s.status === "green"
  ).length;
  const yellowCount = data.schoolComparison.filter(
    (s) => s.status === "yellow"
  ).length;
  const redCount = data.schoolComparison.filter(
    (s) => s.status === "red"
  ).length;

  const summary = [
    `Escolas verdes: ${greenCount} | Amarelas: ${yellowCount} | Vermelhas: ${redCount}`,
    `Total de alunos: ${data.kpis.totalStudents} (${data.kpis.activeStudents} ativos, ${data.kpis.adoption}% adocao)`,
    `Precisao media global: ${data.kpis.avgAccuracy}%`,
    `Exercicios resolvidos no periodo: ${data.kpis.totalExercises}`,
    `Streak medio: ${data.kpis.avgStreak} dias`,
  ];

  for (const line of summary) {
    doc.text(safeText(line), margin, y);
    y += 6;
  }

  addFooter(doc, 3, totalPages);

  // Save
  doc.save(`axiom-rede-${slugify(data.networkName)}-${date}.pdf`);
}
