"use client";

import { BookOpen, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/routing";

interface ClassCardProps {
  cls: {
    id: string;
    name: string;
    invite_code: string;
    teacher_id: string;
  };
  orgId: string;
  showCode?: boolean;
  studentCount?: number;
}

export function ClassCard({ cls, orgId, showCode, studentCount }: ClassCardProps) {
  const t = useTranslations("Class");
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(cls.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link href={`/org/${orgId}/class/${cls.id}`}>
      <div className="group cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-5 transition-all hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-green-400">
            {cls.name}
          </h3>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {showCode && (
            <div className="flex items-center gap-2">
              <code className="rounded bg-[var(--color-bg2)] px-2 py-1 font-mono text-xs text-[var(--color-ax-yellow)]">
                {cls.invite_code}
              </code>
              <button
                onClick={handleCopy}
                className="rounded p-1 text-[var(--color-dim)] transition-colors hover:text-white"
                title={t("copyCode")}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
          {studentCount !== undefined && (
            <span className="text-xs text-[var(--color-dim)]">
              {studentCount} {t("students")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
