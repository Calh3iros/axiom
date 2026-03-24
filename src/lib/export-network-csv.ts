"use client";

export interface NetworkCsvRow {
  schoolName: string;
  students: number;
  active7d: number;
  teachers: number;
  classes: number;
  avgAccuracy: number;
  adoption: number;
  avgStreak: number;
  score: number;
  status: string;
}

/**
 * Export network data as CSV file.
 * Format: escola, alunos, ativos_7d, professores, turmas, precisao, adocao, streak, score, status
 */
export function exportNetworkCsv(
  rows: NetworkCsvRow[],
  networkName: string
): void {
  const header =
    "escola,alunos,ativos_7d,professores,turmas,precisao,adocao,streak_medio,score,status";
  const lines = rows.map((r) =>
    [
      csvEscape(r.schoolName),
      r.students,
      r.active7d,
      r.teachers,
      r.classes,
      r.avgAccuracy,
      r.adoption,
      r.avgStreak,
      r.score,
      r.status,
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `axiom-rede-${slugify(networkName)}-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}
