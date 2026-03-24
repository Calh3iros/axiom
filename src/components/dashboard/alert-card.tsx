"use client";

import { AlertTriangle, TrendingDown, UserX } from "lucide-react";

export interface AlertData {
  type: string;
  title: string;
  message: string;
  severity: "error" | "warning" | "info";
  // For student-specific or class-specific details
  details?: { label: string; value: string | number; extra?: string }[];
}

export function AlertCard({ title, icon: Icon, color, emptyMessage, items }: {
  title: React.ReactNode;
  icon?: React.ElementType;
  color?: string;
  emptyMessage: string;
  items: { title: string; subtitle?: React.ReactNode; value?: React.ReactNode; color?: string }[];
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg1)] p-5 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
        {Icon && color && <Icon style={{ color, width: 18, height: 18 }} />}
        {title}
      </h3>
      
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] border-dashed bg-[var(--color-bg2)] p-4 text-center">
          <p className="text-sm text-[var(--color-dim)]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col justify-center rounded-xl bg-[var(--color-bg2)] p-3 transition-colors hover:bg-[var(--color-bg3)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.title}</span>
                {item.value && (
                  <span className="text-xs font-bold" style={{ color: item.color || "var(--color-text-secondary)" }}>
                    {item.value}
                  </span>
                )}
              </div>
              {item.subtitle && (
                <span className="mt-1 text-xs text-[var(--color-dim)]">{item.subtitle}</span>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-dim); }
      `}</style>
    </div>
  );
}

// Pre-configured intelligent alerts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InactiveStudentsAlert({ students, t }: { students: any[]; t: any }) {
  const items = students.map(s => ({
    title: s.name,
    subtitle: s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "Nunca ativo",
    value: s.daysInactive === 999 ? "-" : `${s.daysInactive}d inativo`,
    color: "#ef4444" // RED
  }));

  return (
    <AlertCard 
      title={<>{t("inactiveStudents")} ({students.length})</>}
      icon={UserX}
      color="#ef4444"
      emptyMessage={`✅ ${t("allActive", { fallback: "Todos ativos!" })}`}
      items={items}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TopErrorsAlert({ errors, t }: { errors: any[]; t: any }) {
  const items = errors.map(e => ({
    title: e.topic,
    subtitle: `Erros: ${e.errors} de ${e.total} praticados`,
    value: `${e.errorRate}% taxa de erro`,
    color: e.errorRate > 60 ? "#ef4444" : "#f59e0b" // RED : YELLOW
  }));

  return (
    <AlertCard
      title={t("topErrors", { fallback: "Tópicos de Maior Dificuldade" })}
      icon={AlertTriangle}
      color="#f59e0b" // YELLOW
      emptyMessage={t("noErrors", { fallback: "Sem dados suficientes." })}
      items={items}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EngagementDropsAlert({ alerts, t }: { alerts: any[]; t: any }) {
  const items = alerts.map(a => ({
    title: a.orgName || a.className || a.message,
    subtitle: a.message,
    value: a.type === "empty_school" || a.type === "empty_class" ? "Atenção" : `${a.severity}`,
    color: a.severity === "error" ? "#ef4444" : "#f59e0b"
  }));

  return (
    <AlertCard
      title={t("engagementAlerts", { fallback: "Alertas de Engajamento" })}
      icon={TrendingDown}
      color="#ef4444"
      emptyMessage={t("noAlerts", { fallback: "Tudo certo! Engajamento positivo." })}
      items={items}
    />
  );
}
