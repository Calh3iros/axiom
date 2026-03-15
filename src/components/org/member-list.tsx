"use client";

import { useTranslations } from "next-intl";

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
}

interface MemberListProps {
  members: Member[];
}

const roleColors: Record<string, string> = {
  student: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  teacher: "bg-green-500/15 text-green-400 border-green-500/20",
  admin: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  director: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  secretary: "bg-red-500/15 text-red-400 border-red-500/20",
};

export function MemberList({ members }: MemberListProps) {
  const t = useTranslations("Org");

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const roleKey = `role${m.role.charAt(0).toUpperCase() + m.role.slice(1)}` as
          | "roleStudent"
          | "roleTeacher"
          | "roleAdmin"
          | "roleDirector"
          | "roleSecretary";

        return (
          <div
            key={m.user_id}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg1)] text-xs font-bold text-[var(--color-dim)]">
                {m.user_id.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-mono text-xs text-[var(--color-dim)]">
                {m.user_id.slice(0, 8)}…
              </span>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${roleColors[m.role] || roleColors.student}`}
            >
              {t(roleKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
