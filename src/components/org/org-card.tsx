"use client";

import { Building2, GraduationCap, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

interface OrgCardProps {
  org: {
    id: string;
    name: string;
    type: string;
    created_at: string;
  };
  role: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  school: <Building2 className="h-5 w-5 text-blue-400" />,
  network: <Globe className="h-5 w-5 text-purple-400" />,
  state: <GraduationCap className="h-5 w-5 text-orange-400" />,
};

export function OrgCard({ org, role }: OrgCardProps) {
  const t = useTranslations("Org");

  const roleColors: Record<string, string> = {
    student: "bg-blue-500/15 text-blue-400",
    teacher: "bg-green-500/15 text-green-400",
    admin: "bg-orange-500/15 text-orange-400",
    director: "bg-purple-500/15 text-purple-400",
    secretary: "bg-red-500/15 text-red-400",
  };

  const roleKey = `role${role.charAt(0).toUpperCase() + role.slice(1)}` as
    | "roleStudent"
    | "roleTeacher"
    | "roleAdmin"
    | "roleDirector"
    | "roleSecretary";
  const typeKey = `type${org.type.charAt(0).toUpperCase() + org.type.slice(1)}` as
    | "typeSchool"
    | "typeNetwork"
    | "typeState";

  return (
    <Link href={`/org/${org.id}`}>
      <div className="group cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-5 transition-all hover:border-[var(--color-ax-blue)]/30 hover:shadow-lg hover:shadow-[var(--color-ax-blue)]/5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {typeIcons[org.type] || typeIcons.school}
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-ax-blue)]">
                {org.name}
              </h3>
              <p className="text-xs text-[var(--color-dim)]">{t(typeKey)}</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[role] || roleColors.student}`}
          >
            {t(roleKey)}
          </span>
        </div>
      </div>
    </Link>
  );
}
