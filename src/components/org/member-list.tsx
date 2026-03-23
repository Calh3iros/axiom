"use client";

import { useTranslations } from "next-intl";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: ProfileData;
}

interface MemberListProps {
  members: Member[];
}

const roleColors: Record<string, string> = {
  student: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  teacher: "bg-green-500/15 text-green-400 border-green-500/20",
  coordinator: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  admin: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  director: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  owner: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  secretary: "bg-red-500/15 text-red-400 border-red-500/20",
};

function getDisplayName(m: Member): string {
  if (m.profiles?.full_name) return m.profiles.full_name;
  if (m.profiles?.email) return m.profiles.email.split("@")[0];
  return "User";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function MemberList({ members }: MemberListProps) {
  const t = useTranslations("Org");

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const roleKey =
          `role${m.role.charAt(0).toUpperCase() + m.role.slice(1)}` as
            | "roleStudent"
            | "roleTeacher"
            | "roleCoordinator"
            | "roleAdmin"
            | "roleDirector"
            | "roleOwner"
            | "roleSecretary";

        const name = getDisplayName(m);
        const avatarUrl = m.profiles?.avatar_url;

        return (
          <div
            key={m.user_id}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ax-blue)]/15 text-xs font-bold text-[var(--color-ax-blue)]">
                  {getInitials(name)}
                </div>
              )}
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {name}
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
