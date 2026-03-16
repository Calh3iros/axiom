"use client";

import {
  Activity, AlertTriangle, BookOpen, Target, TrendingUp, UserX, Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DashboardData = any;

const ACCENT = "#818cf8";
const GREEN = "#22c55e";
const RED = "#ef4444";
const YELLOW = "#f59e0b";
const BLUE = "#3b82f6";
const PINK = "#ec4899";

const MASTERY_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7"];
const ACCURACY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#10b981"];
const TOOLTIP_STYLE = { background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#e2e8f0", fontSize: 12 };

function HealthBadge({ active, total }: { active: number; total: number }) {
  const pct = total > 0 ? (active / total) * 100 : 0;
  const color = pct >= 70 ? GREEN : pct >= 40 ? YELLOW : RED;
  const label = pct >= 70 ? "Saudável" : pct >= 40 ? "Atenção" : "Crítico";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${color}15`, color }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

export function TeacherDashboard({ data, className: cls }: { data: DashboardData; className?: string }) {
  const t = useTranslations("Dashboard");

  if (data?.empty) {
    return (
      <div className={cls} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
        <BookOpen style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#334155" }} />
        <p>{t("emptyClass")}</p>
      </div>
    );
  }

  if (!data) return null;

  const moduleColors = [ACCENT, GREEN, BLUE];

  return (
    <div className={cls}>
      {/* KPI Cards */}
      <div className="dash-kpi-grid">
        <KpiCard icon={Activity} color={GREEN} label={t("active7d")} value={`${data.active7d}/${data.studentCount}`} sub={`${Math.round((data.active7d / data.studentCount) * 100)}%`} />
        <KpiCard icon={TrendingUp} color={ACCENT} label={t("avgSolved")} value={data.avgSolved} />
        <KpiCard icon={Target} color={YELLOW} label={t("avgAccuracy")} value={`${data.avgAccuracy}%`} />
        <KpiCard icon={Zap} color={PINK} label={t("avgStreak")} value={`🔥 ${data.avgStreak}`} />
      </div>

      {/* Row 2: Weekly evolution + Accuracy distribution */}
      <div className="dash-row">
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("weeklyEvolution")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.weeklyEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="solved" name={t("problemsSolved")} stroke={ACCENT} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="accuracy" name={t("accuracy")} stroke={GREEN} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("accuracyDist")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.accuracyDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" name={t("students")} radius={[6, 6, 0, 0]}>
                {data.accuracyDist.map((_: unknown, i: number) => (
                  <Cell key={i} fill={ACCURACY_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Module usage + Mastery distribution */}
      <div className="dash-row">
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("moduleUsage")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.moduleUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 12 }} width={60} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" name={t("uses")} radius={[0, 6, 6, 0]}>
                {data.moduleUsage.map((_: unknown, i: number) => (
                  <Cell key={i} fill={moduleColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("masteryDist")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Pie data={data.masteryDist} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="count" nameKey="level" label={(p: any) => p.count > 0 ? `${p.level}: ${p.count}` : ""}>
                {data.masteryDist.map((_: unknown, i: number) => (
                  <Cell key={i} fill={MASTERY_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Alerts */}
      <div className="dash-row">
        {/* Inactive students */}
        <div className="dash-alert-card">
          <h3 className="dash-alert-title">
            <UserX style={{ width: 18, height: 18, color: RED }} />
            {t("inactiveStudents")} ({data.inactiveStudents.length})
          </h3>
          {data.inactiveStudents.length === 0 ? (
            <p className="dash-empty-alert">✅ {t("allActive")}</p>
          ) : (
            <div className="dash-alert-list">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.inactiveStudents.map((s: any, i: number) => (
                <div key={i} className="dash-alert-item">
                  <span className="dash-alert-name">{s.name}</span>
                  <span className="dash-alert-days">{s.daysInactive}d</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top error topics */}
        <div className="dash-alert-card">
          <h3 className="dash-alert-title">
            <AlertTriangle style={{ width: 18, height: 18, color: YELLOW }} />
            {t("topErrors")}
          </h3>
          {data.topErrors.length === 0 ? (
            <p className="dash-empty-alert">{t("noErrors")}</p>
          ) : (
            <div className="dash-alert-list">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.topErrors.map((e: any, i: number) => (
                <div key={i} className="dash-alert-item">
                  <span className="dash-alert-name">{e.topic}</span>
                  <span className="dash-alert-rate" style={{ color: e.errorRate > 60 ? RED : YELLOW }}>
                    {e.errorRate}% erro ({e.errors}/{e.total})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dash-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .dash-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .dash-chart-card { background: var(--color-bg1, #12121a); border: 1px solid var(--color-border, #1e1e2e); border-radius: 14px; padding: 20px; }
        .dash-chart-title { font-size: 14px; color: var(--color-text-secondary, #94a3b8); margin: 0 0 16px; font-weight: 600; }
        .dash-alert-card { background: var(--color-bg1, #12121a); border: 1px solid var(--color-border, #1e1e2e); border-radius: 14px; padding: 20px; }
        .dash-alert-title { font-size: 14px; color: var(--color-text-secondary, #94a3b8); margin: 0 0 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .dash-empty-alert { color: #64748b; font-size: 13px; margin: 0; }
        .dash-alert-list { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
        .dash-alert-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 13px; }
        .dash-alert-name { color: var(--color-text-primary, #e2e8f0); }
        .dash-alert-days { color: ${RED}; font-weight: 600; font-size: 12px; }
        .dash-alert-rate { font-size: 12px; font-weight: 500; }
        @media (max-width: 900px) {
          .dash-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ icon: Icon, color, label, value, sub }: { icon: React.ElementType; color: string; label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: "var(--color-bg1, #12121a)", border: "1px solid var(--color-border, #1e1e2e)", borderRadius: 14, padding: 20 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, marginBottom: 10 }}>
        <Icon style={{ color, width: 20, height: 20 }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-primary, #f1f5f9)", lineHeight: 1 }}>
        {value}
        {sub && <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6, fontWeight: 400 }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Director Dashboard ─────────────────────────────────────────────────

export function DirectorDashboard({ data, onDrillDown }: { data: DashboardData; onDrillDown?: (classId: string) => void }) {
  const t = useTranslations("Dashboard");

  if (data?.empty) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
        <BookOpen style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#334155" }} />
        <p>{t("emptySchool")}</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <HealthBadge active={data.active7d} total={data.totalStudents} />
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {data.totalStudents} {t("students")} · {data.classCount} {t("classes")}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="dash-kpi-grid">
        <KpiCard icon={Activity} color={GREEN} label={t("active7d")} value={data.active7d} sub={`${data.adoption}%`} />
        <KpiCard icon={TrendingUp} color={ACCENT} label={t("totalSolved")} value={data.totalSolved.toLocaleString()} />
        <KpiCard icon={Target} color={YELLOW} label={t("avgAccuracy")} value={`${data.overallAccuracy}%`} />
        <KpiCard icon={Zap} color={PINK} label={t("avgStreak")} value={`🔥 ${data.avgStreak}`} />
      </div>

      {/* Class comparison bar chart */}
      <div className="dash-row">
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("classComparison")} — {t("problemsSolved")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.classComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="className" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="avgSolved" name={t("avgSolved")} fill={ACCENT} radius={[6, 6, 0, 0]} cursor={onDrillDown ? "pointer" : undefined}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(d: any) => onDrillDown?.(d.classId)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("classComparison")} — {t("accuracy")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.classComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="className" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="avgAccuracy" name={t("accuracy")} fill={GREEN} radius={[6, 6, 0, 0]} />
              <Bar dataKey="adoption" name={t("adoption")} fill={BLUE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly evolution */}
      <div className="dash-chart-card" style={{ marginBottom: 20 }}>
        <h3 className="dash-chart-title">{t("weeklyEvolutionSchool")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.weeklyEvolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="solved" name={t("problemsSolved")} stroke={ACCENT} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement alerts */}
      {data.engagementAlerts.length > 0 && (
        <div className="dash-alert-card" style={{ marginBottom: 20 }}>
          <h3 className="dash-alert-title">
            <AlertTriangle style={{ width: 18, height: 18, color: RED }} />
            {t("engagementAlerts")}
          </h3>
          <div className="dash-alert-list">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.engagementAlerts.map((a: any, i: number) => (
              <div key={i} className="dash-alert-item">
                <span className="dash-alert-name">{a.className}</span>
                <span style={{ color: RED, fontSize: 12, fontWeight: 600 }}>
                  ↓ {a.dropPct}% ({a.thisWeek} vs {a.lastWeek})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .dash-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .dash-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .dash-chart-card { background: var(--color-bg1, #12121a); border: 1px solid var(--color-border, #1e1e2e); border-radius: 14px; padding: 20px; }
        .dash-chart-title { font-size: 14px; color: var(--color-text-secondary, #94a3b8); margin: 0 0 16px; font-weight: 600; }
        .dash-alert-card { background: var(--color-bg1, #12121a); border: 1px solid var(--color-border, #1e1e2e); border-radius: 14px; padding: 20px; }
        .dash-alert-title { font-size: 14px; color: var(--color-text-secondary, #94a3b8); margin: 0 0 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .dash-alert-list { display: flex; flex-direction: column; gap: 6px; }
        .dash-alert-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 13px; }
        .dash-alert-name { color: var(--color-text-primary, #e2e8f0); }
        @media (max-width: 900px) { .dash-kpi-grid { grid-template-columns: repeat(2, 1fr); } .dash-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// ─── Secretary Dashboard ────────────────────────────────────────────────

export function SecretaryDashboard({ data, onDrillDown }: { data: DashboardData; onDrillDown?: (orgId: string) => void }) {
  const t = useTranslations("Dashboard");

  if (data?.empty) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
        <BookOpen style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#334155" }} />
        <p>{t("emptyNetwork")}</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        {data.schoolCount} {t("schools")}
      </div>

      {/* School comparison */}
      <div className="dash-chart-card" style={{ marginBottom: 20 }}>
        <h3 className="dash-chart-title">{t("schoolComparison")} — {t("problemsSolved")}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.schoolComparison} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis dataKey="orgName" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={120} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="avgSolved" name={t("avgSolved")} fill={ACCENT} radius={[0, 6, 6, 0]}
              cursor={onDrillDown ? "pointer" : undefined}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) => onDrillDown?.(d.orgId)} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Adoption + accuracy comparison */}
      <div className="dash-row">
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("adoption")} (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.schoolComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="orgName" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="adoption" name={t("adoption")} fill={GREEN} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">{t("accuracy")} (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.schoolComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="orgName" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="avgAccuracy" name={t("accuracy")} fill={YELLOW} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .dash-chart-card { background: var(--color-bg1, #12121a); border: 1px solid var(--color-border, #1e1e2e); border-radius: 14px; padding: 20px; }
        .dash-chart-title { font-size: 14px; color: var(--color-text-secondary, #94a3b8); margin: 0 0 16px; font-weight: 600; }
        .dash-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        @media (max-width: 900px) { .dash-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
