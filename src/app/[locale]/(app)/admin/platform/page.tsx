"use client";

import { Activity, Building2, Crown, FlaskConical, TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { Link } from "@/i18n/routing";
import { getAdminPlatformStats, getDemoOrgId } from "@/lib/actions/admin";

type Stats = Awaited<ReturnType<typeof getAdminPlatformStats>>;

const PLAN_COLORS = { free: "#64748b", pro: "#818cf8", elite: "#f59e0b" };
const MODULE_COLORS = ["#818cf8", "#22c55e", "#f59e0b", "#ec4899"];

export default function AdminPlatformPage() {
  const t = useTranslations("Admin");
  const [stats, setStats] = useState<Stats | null>(null);
  const [demoOrgId, setDemoOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminPlatformStats(),
      getDemoOrgId(),
    ]).then(([d, dId]) => {
      setStats(d);
      setDemoOrgId(dId);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">{t("loading")}</div>;
  if (!stats) return <div className="admin-loading">Error loading stats</div>;

  const planData = Object.entries(stats.plans).map(([name, value]) => ({ name, value }));
  const totalPlanUsers = Object.values(stats.plans).reduce((a, b) => a + b, 0);
  const moduleData = Object.entries(stats.modules).map(([name, value]) => ({
    name: t(`platform.module.${name}`),
    value,
  }));

  const kpiCards = [
    { icon: Users, label: t("platform.totalUsers"), value: stats.totalUsers, color: "#818cf8" },
    { icon: Activity, label: t("platform.active7d"), value: stats.active7d, color: "#22c55e" },
    { icon: TrendingUp, label: t("platform.active30d"), value: stats.active30d, color: "#3b82f6" },
    { icon: Building2, label: t("platform.activeOrgs"), value: stats.activeOrgs, color: "#a855f7" },
  ];

  return (
    <div>
      <h1 className="admin-page-title">{t("platform.title")}</h1>

      {/* Demo Org Card */}
      {demoOrgId && (
        <div className="demo-org-card">
          <div className="demo-org-left">
            <FlaskConical style={{ color: "#818cf8", width: 24, height: 24 }} />
            <div>
              <h3 className="demo-org-name">Escola Demonstração</h3>
              <span className="demo-org-badge">ACTIVE</span>
            </div>
          </div>
          <Link href={`/org/${demoOrgId}`} className="demo-org-btn">
            📊 {t("platform.viewDemoDashboard")}
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-icon-wrap" style={{ background: `${kpi.color}15` }}>
              <kpi.icon style={{ color: kpi.color, width: 20, height: 20 }} />
            </div>
            <div className="kpi-value">{kpi.value.toLocaleString()}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
        {/* Plan distribution cards */}
        {Object.entries(stats.plans).map(([plan, count]) => (
          <div key={plan} className="kpi-card">
            <div className="kpi-icon-wrap" style={{ background: `${PLAN_COLORS[plan as keyof typeof PLAN_COLORS]}15` }}>
              <Crown style={{ color: PLAN_COLORS[plan as keyof typeof PLAN_COLORS], width: 20, height: 20 }} />
            </div>
            <div className="kpi-value">
              {count} <span className="kpi-pct">({totalPlanUsers ? Math.round((count / totalPlanUsers) * 100) : 0}%)</span>
            </div>
            <div className="kpi-label">{plan.charAt(0).toUpperCase() + plan.slice(1)}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="charts-grid">
        {/* Signups per week */}
        <div className="chart-card">
          <h3 className="chart-title">{t("platform.signupsPerWeek")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.weeklySignups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#e2e8f0" }} />
              <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* DAU */}
        <div className="chart-card">
          <h3 className="chart-title">{t("platform.dau")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.dailyActive}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#e2e8f0" }} />
              <Area type="monotone" dataKey="users" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution (Pie) */}
        <div className="chart-card">
          <h3 className="chart-title">{t("platform.planDist")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}>
                {planData.map((entry) => (
                  <Cell key={entry.name} fill={PLAN_COLORS[entry.name as keyof typeof PLAN_COLORS]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Module Usage (Bar) */}
        <div className="chart-card">
          <h3 className="chart-title">{t("platform.moduleUsage")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moduleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {moduleData.map((_, i) => (
                  <Cell key={i} fill={MODULE_COLORS[i % MODULE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .admin-page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #f1f5f9; }
        .admin-loading { text-align: center; padding: 60px 0; color: #64748b; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .kpi-card { background: #12121a; border: 1px solid #1e1e2e; border-radius: 12px; padding: 20px; }
        .kpi-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .kpi-value { font-size: 28px; font-weight: 700; color: #f1f5f9; line-height: 1; }
        .kpi-pct { font-size: 14px; color: #64748b; font-weight: 400; }
        .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .chart-card { background: #12121a; border: 1px solid #1e1e2e; border-radius: 12px; padding: 20px; }
        .chart-title { font-size: 14px; color: #94a3b8; margin: 0 0 16px; font-weight: 600; }
        @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
        .demo-org-card { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #12121a 0%, #1a1a30 100%); border: 1px solid #2d2d5e; border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; }
        .demo-org-left { display: flex; align-items: center; gap: 14px; }
        .demo-org-name { font-size: 16px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
        .demo-org-badge { font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 20px; background: #16513d; color: #4ade80; text-transform: uppercase; letter-spacing: 0.05em; }
        .demo-org-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
        .demo-org-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3); }
      `}</style>
    </div>
  );
}
