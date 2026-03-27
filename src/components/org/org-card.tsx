"use client";

import { Building2, GraduationCap, Globe, Trash2 } from "lucide-react";
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
  isSuperAdmin?: boolean;
  onDelete?: (orgId: string, orgName: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  school: <Building2 className="h-5 w-5 text-blue-400" />,
  network: <Globe className="h-5 w-5 text-purple-400" />,
  state: <GraduationCap className="h-5 w-5 text-orange-400" />,
};

export function OrgCard({ org, role, isSuperAdmin, onDelete }: OrgCardProps) {
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
  const typeKey = `type${org.type
    .split("_")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")}` as
    | "typeSchool"
    | "typeNetwork"
    | "typeState"
    | "typePrivateSchool"
    | "typePrivateNetwork"
    | "typePublicMunicipal"
    | "typePublicState";

  return (
    <div className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-5 transition-all hover:border-[var(--color-ax-blue)]/30 hover:shadow-[var(--color-ax-blue)]/5 hover:shadow-lg">
      <Link href={`/org/${org.id}`} className="block">
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
      </Link>
      {isSuperAdmin && onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(org.id, org.name);
          }}
          className="absolute right-3 bottom-3 rounded-lg p-1.5 text-[var(--color-dim)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
          title={t("deleteOrg")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
