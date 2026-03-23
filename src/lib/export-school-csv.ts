"use client";

export interface SchoolCsvRow {
  className: string;
  teacherName: string;
  studentName: string;
  studentEmail: string;
  exercises: number;
  accuracy: number;
  streak: number;
  lastActive: string;
}

/**
 * Export school data as CSV file.
 * Format: turma, professor, aluno, email, exercicios, precisao, streak, último_acesso
 */
export function exportSchoolCsv(
  rows: SchoolCsvRow[],
  schoolName: string
): void {
  const header =
    "turma,professor,aluno,email,exercicios,precisao,streak,ultimo_acesso";
  const lines = rows.map((r) =>
    [
      csvEscape(r.className),
      csvEscape(r.teacherName),
      csvEscape(r.studentName),
      csvEscape(r.studentEmail),
      r.exercises,
      r.accuracy,
      r.streak,
      r.lastActive || "",
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `axiom-escola-${slugify(schoolName)}-${date}.csv`;
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
