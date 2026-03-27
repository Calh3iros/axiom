export type CodeType =
  | "secretary"
  | "gre"
  | "director"
  | "teacher"
  | "owner"
  | "student";

export function detectCodeType(code: string): CodeType | null {
  const upper = code.toUpperCase().trim();
  if (upper.startsWith("SEC-")) return "secretary";
  if (upper.startsWith("GRE-")) return "gre";
  if (upper.startsWith("DIR-")) return "director";
  if (upper.startsWith("PRF-")) return "teacher";
  if (upper.startsWith("OWN-")) return "owner";
  if (upper.length >= 4) return "student";
  return null;
}

export const SUBJECTS = [
  "Português",
  "Matemática",
  "História",
  "Geografia",
  "Ciências",
  "Física",
  "Química",
  "Biologia",
  "Inglês",
  "Espanhol",
  "Ed. Física",
  "Artes",
  "Filosofia",
  "Sociologia",
  "Redação",
  "Literatura",
  "Ensino Religioso",
  "Ed. Musical",
] as const;
