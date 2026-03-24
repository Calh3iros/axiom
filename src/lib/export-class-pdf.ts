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

function levelBar(level: number): string {
  return "[" + "*".repeat(level) + "-".repeat(5 - level) + "]";
}

// --- Types ----------------------------------------------------------------
export interface ClassReportData {
  className: string;
  orgName: string;
  teacherName: string;
  period: string;
  generatedBy: string;
  
  // KPIs
  totalStudents: number;
  totalSolved: number;
  overallAccuracy: number;
  avgStreak: number;
  
  // Top 10
  topStudents: {
    name: string;
    solved: number;
    accuracy: number;
    streak: number;
    level: number;
  }[];
  
  // Distribuição de Precisão
  accuracyDist: { range: string; count: number }[];
  
  // Weekly Evolution
  weeklyEvolution: { week: string; solved: number; accuracy: number }[];
  
  // Top 5 Em Erros/Matérias Praticadas
  topErrors: { topic: string; total: number }[];
  
  // Inactive Students
  inactiveStudents: { name: string; lastActive: string | null; daysInactive: number }[];
}

// --- Export Class PDF (2 pages) ------------------------------------------

export async function exportClassPdf2Pages(data: ClassReportData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pw - margin * 2;

  // ═══════════ PAGE 1: Cover + KPIs + Ranking ═══════════

  // Header bar
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(doc, WHITE);
  doc.text("AXIOM", margin, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relatorio de Turma", margin, 24);

  // Class info
  let y = 44;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text(safeText(data.className), margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor(doc, DIM);
  doc.text(`Escola: ${safeText(data.orgName)}  |  Professor(a): ${safeText(data.teacherName)}`, margin, y);
  y += 5;
  doc.text(`Periodo: ${safeText(data.period)}`, margin, y);
  y += 5;
  doc.text(
    `Gerado por ${safeText(data.generatedBy)} em ${new Date().toLocaleDateString("pt-BR")}`,
    margin,
    y
  );

  // KPI cards
  y += 12;
  const kpiW = (contentW - 3 * 4) / 4;
  const kpis = [
    { label: "TOTAL ALUNOS", value: String(data.totalStudents) },
    { label: "EXERCICIOS", value: String(data.totalSolved) },
    { label: "PRECISAO", value: `${data.overallAccuracy}%` },
    { label: "STREAK MEDIO", value: `${data.avgStreak}d` },
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

  // Ranking top 10
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("RANKING DE ALUNOS (TOP 10)", margin, y);
  y += 6;

  // Table header
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setColor(doc, DIM);
  const cols = [
    { label: "#", x: margin },
    { label: "NOME", x: margin + 7 },
    { label: "EXERCICIOS", x: margin + 65 },
    { label: "PRECISAO", x: margin + 95 },
    { label: "STREAK", x: margin + 120 },
    { label: "LEVEL", x: margin + 145 }
  ];
  cols.forEach((c) => doc.text(c.label, c.x, y));
  y += 1;
  doc.setLineWidth(0.2);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pw - margin, y);
  y += 3;

  for (let i = 0; i < data.topStudents.length; i++) {
    const st = data.topStudents[i];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(doc, DARK);
    
    doc.text(String(i + 1), margin, y);
    const sn = st.name.length > 25 ? st.name.slice(0, 23) + "..." : st.name;
    doc.setFont("helvetica", "bold");
    doc.text(safeText(sn), margin + 7, y);
    doc.setFont("helvetica", "normal");
    
    doc.text(String(st.solved), margin + 65, y);
    
    // Accuracy
    const accColor = semaphoreColor(st.accuracy);
    setColor(doc, accColor);
    doc.text(`${st.accuracy}%`, margin + 95, y);
    
    // Streak
    setColor(doc, ORANGE);
    doc.text(`${st.streak}d`, margin + 120, y);
    
    // Level
    setColor(doc, DARK);
    doc.text(levelBar(st.level), margin + 145, y);
    
    y += 5.5;
  }

  y += 8;

  // Accuracy Distribution
  if (data.accuracyDist && data.accuracyDist.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    setColor(doc, DARK);
    doc.text("DISTRIBUICAO DE PRECISAO", margin, y);
    y += 6;
    
    const maxCount = Math.max(...data.accuracyDist.map(d => d.count), 1);
    
    // Cores específicas para as faixas
    const distColors = [RED, YELLOW, ORANGE, GREEN, GREEN];
    
    for (let i = 0; i < data.accuracyDist.length; i++) {
      const dist = data.accuracyDist[i];
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      setColor(doc, DIM);
      doc.text(safeText(dist.range), margin, y + 3);
      
      const barW = Math.max(2, (dist.count / maxCount) * (contentW - 60));
      setFillColor(doc, distColors[Math.min(i, distColors.length - 1)]);
      doc.roundedRect(margin + 25, y, barW, 4.5, 1, 1, "F");
      
      doc.setFontSize(6);
      setColor(doc, DARK);
      doc.text(`${dist.count} alunos`, margin + 25 + barW + 2, y + 3);
      
      y += 6;
    }
  }

  // ═══════════ PAGE 2: Weekly Evolution + Weaknesses + Inactive ═══════════

  doc.addPage();
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(doc, WHITE);
  doc.text("EVOLUCAO E ENGAJAMENTO", margin, 10);
  y = 22;

  // Weekly evolution
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("EVOLUCAO SEMANAL", margin, y);
  y += 6;

  if (data.weeklyEvolution.length > 0) {
    const weTableY = y;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    setColor(doc, DIM);
    doc.text("SEMANA", margin, weTableY);
    doc.text("EXERCICIOS", margin + 30, weTableY);
    doc.text("RESULTADOS", margin + 70, weTableY);
    y += 4;
    
    const maxSolved = Math.max(...data.weeklyEvolution.map(w => w.solved), 1);
    const barMaxW = 40;
    
    for (const week of data.weeklyEvolution.slice(-8)) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      setColor(doc, DARK);
      doc.text(safeText(week.week), margin, y + 3);
      
      doc.text(String(week.solved), margin + 30, y + 3);
      
      const barW = Math.max(2, (week.solved / maxSolved) * barMaxW);
      setFillColor(doc, ORANGE);
      doc.roundedRect(margin + 70, y, barW, 4, 1, 1, "F");
      
      y += 6;
    }
  } else {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setColor(doc, DIM);
    doc.text("Sem dados suficientes para evolucao.", margin, y);
    y += 10;
  }

  y += 10;
  
  // Half-page layout for the bottom sections
  const halfW = (contentW - 6) / 2;
  const splitY = y;
  
  // Left: Weaknesses / Top Errors
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("MATERIAS MAIS PRATICADAS", margin, splitY);
  let ly = splitY + 6;
  
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setColor(doc, DIM);
  doc.text("TOPICO", margin, ly);
  doc.text("EXERCICIOS", margin + halfW - 15, ly);
  ly += 4;
  
  if (data.topErrors.length === 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setColor(doc, DIM);
    doc.text("Nenhuma atividade recente.", margin, ly);
  } else {
    for (const err of data.topErrors) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      setColor(doc, DARK);
      const tn = err.topic.length > 35 ? err.topic.slice(0, 33) + "..." : err.topic;
      doc.text(safeText(tn), margin, ly);
      
      doc.setFont("helvetica", "bold");
      doc.text(String(err.total), margin + halfW - 15, ly);
      ly += 6;
    }
  }

  // Right: Inactive Students
  const rx = margin + halfW + 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text("ALUNOS INATIVOS", rx, splitY);
  let ry = splitY + 6;
  
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setColor(doc, DIM);
  doc.text("NOME", rx, ry);
  doc.text("ULTIMO ACESSO", rx + halfW - 35, ry);
  doc.text("DIAS", rx + halfW - 10, ry);
  ry += 4;
  
  if (data.inactiveStudents.length === 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setColor(doc, GREEN);
    doc.text("Todos os alunos estao ativos!", rx, ry);
  } else {
    for (const inact of data.inactiveStudents.slice(0, 10)) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      setColor(doc, DARK);
      const nn = inact.name.length > 18 ? inact.name.slice(0, 16) + "..." : inact.name;
      doc.text(safeText(nn), rx, ry);
      
      doc.text(
        inact.lastActive 
          ? new Date(inact.lastActive).toLocaleDateString("pt-BR") 
          : "Nunca", 
        rx + halfW - 35, ry
      );
      
      setColor(doc, RED);
      doc.setFont("helvetica", "bold");
      doc.text(inact.daysInactive === 999 ? "-" : String(inact.daysInactive), rx + halfW - 10, ry);
      
      ry += 6;
    }
  }

  y = Math.max(ly, ry) + 12;

  // Footer note
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  setColor(doc, DIM);
  doc.text(
    "Este relatorio foi gerado automaticamente pela plataforma Axiom.",
    margin,
    280
  );

  // -- Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, totalPages);
  }

  // -- Save
  const date = new Date().toISOString().split("T")[0];
  doc.save(`axiom-turma-${slugify(data.className)}-${date}.pdf`);
}
