"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import type { ClassAggregateRow, OrgAggregateRow } from "@/lib/actions/rankings";

interface Props {
  classRows: ClassAggregateRow[];
  orgId: string;
  childOrgRows?: OrgAggregateRow[];
}

export function OrgRankingView({ classRows, orgId, childOrgRows }: Props) {
  const t = useTranslations("Rankings");

  return (
    <div className="space-y-8">
      {/* Class ranking table */}
      {classRows.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)] py-10 text-center">
          <p className="text-sm text-[var(--color-dim)]">{t("noClasses")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-3 text-xs font-medium text-[var(--color-dim)]">#</th>
                <th className="px-4 py-3 text-xs font-medium text-[var(--color-dim)]">{t("className")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">👥 {t("students")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">📚 {t("avgSolved")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">🎯 {t("avgAccuracy")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">🟢 {t("active7d")}</th>
              </tr>
            </thead>
            <tbody>
              {classRows.map((row, i) => (
                <tr
                  key={row.class_id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg2)] transition-colors"
                >
                  <td className="px-4 py-3 text-center text-xs text-[var(--color-dim)]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/org/${orgId}/class/${row.class_id}`}
                      className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-ax-blue)] transition-colors"
                    >
                      {row.class_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                    {row.student_count}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                    {row.avg_problems_solved}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono text-sm ${row.avg_accuracy < 50 ? "text-red-400" : "text-[var(--color-text-primary)]"}`}>
                    {row.avg_accuracy}%
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm text-green-400">
                    {row.active_last_7d}/{row.student_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Child org ranking (secretary/admin only) */}
      {childOrgRows && childOrgRows.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <Building2 className="h-4 w-4 text-orange-400" />
            {t("orgRanking")} ({childOrgRows.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg1)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-dim)]">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-dim)]">{t("orgName")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">👥 {t("students")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">📚 {t("avgSolved")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">🎯 {t("avgAccuracy")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-dim)]">🟢 {t("active7d")}</th>
                </tr>
              </thead>
              <tbody>
                {childOrgRows.map((row, i) => (
                  <tr
                    key={row.org_id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg2)] transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-xs text-[var(--color-dim)]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/org/${row.org_id}`}
                        className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-ax-blue)] transition-colors"
                      >
                        <span className="mr-1.5 inline-block">
                          <Building2 className={`inline h-3.5 w-3.5 ${row.org_type === 'school' ? 'text-blue-400' : 'text-purple-400'}`} />
                        </span>
                        {row.org_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                      {row.total_students}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[var(--color-text-primary)]">
                      {row.avg_problems_solved}
                    </td>
                    <td className={`px-4 py-3 text-center font-mono text-sm ${row.avg_accuracy < 50 ? "text-red-400" : "text-[var(--color-text-primary)]"}`}>
                      {row.avg_accuracy}%
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-green-400">
                      {row.active_last_7d}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
