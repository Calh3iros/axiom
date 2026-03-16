"use client";

import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { getAdminUsers } from "@/lib/actions/admin";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string;
  plan: string;
  created_at: string;
  last_active_date: string | null;
  current_streak: number;
  badges_count: number;
  problems_solved: number;
};

export default function AdminUsersPage() {
  const t = useTranslations("Admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const pageSize = 25;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminUsers({
        search: search || undefined,
        plan: planFilter,
        active: activeFilter,
        page,
        pageSize,
        sortBy,
        sortDir,
      });
      setUsers(result.users as UserRow[]);
      setTotal(result.total);
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, planFilter, activeFilter, page, sortBy, sortDir]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <h1 className="admin-page-title">{t("users.title")}</h1>

      {/* Filters */}
      <div className="user-filters">
        <div className="user-search">
          <Search className="user-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("users.searchPlaceholder")}
            className="user-search-input"
          />
        </div>
        <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className="user-select">
          <option value="all">{t("users.allPlans")}</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }} className="user-select">
          <option value="all">{t("users.allActivity")}</option>
          <option value="active">{t("users.active30d")}</option>
          <option value="inactive">{t("users.inactive30d")}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">{t("loading")}</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <SortTh col="full_name" label={t("users.col.name")} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="email" label={t("users.col.email")} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th>{t("users.col.plan")}</th>
                  <SortTh col="created_at" label={t("users.col.signup")} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="last_active_date" label={t("users.col.lastActive")} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="current_streak" label={t("users.col.streak")} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th>{t("users.col.solved")}</th>
                  <th>{t("users.col.badges")}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={8} className="admin-empty-cell">{t("users.empty")}</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="admin-row">
                      <td className="user-name-cell">{u.full_name || "—"}</td>
                      <td className="user-email-cell">{u.email}</td>
                      <td>
                        <span className={`plan-badge plan-${u.plan}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>{formatDate(u.last_active_date)}</td>
                      <td className="user-number">{u.current_streak > 0 ? `🔥 ${u.current_streak}` : "0"}</td>
                      <td className="user-number">{u.problems_solved}</td>
                      <td className="user-number">{u.badges_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="user-pagination">
            <span className="user-pagination-info">
              {t("users.showing", { start: (page - 1) * pageSize + 1, end: Math.min(page * pageSize, total), total })}
            </span>
            <div className="user-pagination-btns">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="user-pg-btn">
                <ChevronLeft size={16} />
              </button>
              <span className="user-pg-current">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="user-pg-btn">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .admin-page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #f1f5f9; }
        .admin-loading { text-align: center; padding: 60px 0; color: #64748b; }
        .user-filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .user-search { position: relative; flex: 1; min-width: 200px; }
        .user-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #64748b; }
        .user-search-input { width: 100%; padding: 10px 12px 10px 36px; background: #12121a; border: 1px solid #1e1e2e; border-radius: 8px; color: #e2e8f0; font-size: 14px; outline: none; }
        .user-search-input:focus { border-color: #818cf8; }
        .user-select { padding: 10px 12px; background: #12121a; border: 1px solid #1e1e2e; border-radius: 8px; color: #e2e8f0; font-size: 13px; cursor: pointer; outline: none; }
        .admin-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #1e1e2e; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #12121a; border-bottom: 1px solid #1e1e2e; white-space: nowrap; }
        .admin-table td { padding: 10px 16px; border-bottom: 1px solid #1a1a2a; font-size: 13px; }
        .admin-row:hover td { background: #14141e; }
        .admin-empty-cell { text-align: center; padding: 40px; color: #475569; }
        .user-name-cell { font-weight: 500; color: #e2e8f0; }
        .user-email-cell { color: #94a3b8; }
        .user-number { text-align: center; font-variant-numeric: tabular-nums; }
        .plan-badge { padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .plan-free { background: #1e293b; color: #94a3b8; }
        .plan-pro { background: #312e81; color: #c7d2fe; }
        .plan-elite { background: #4a3520; color: #fbbf24; }
        .sort-th { cursor: pointer; user-select: none; }
        .sort-th:hover { color: #e2e8f0; }
        .sort-icon { display: inline-block; margin-left: 4px; vertical-align: middle; }
        .user-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
        .user-pagination-info { font-size: 13px; color: #64748b; }
        .user-pagination-btns { display: flex; align-items: center; gap: 8px; }
        .user-pg-btn { background: #12121a; border: 1px solid #1e1e2e; border-radius: 6px; padding: 6px 10px; color: #94a3b8; cursor: pointer; transition: all 0.15s; }
        .user-pg-btn:hover:not(:disabled) { background: #1e1e2e; color: #e2e8f0; }
        .user-pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .user-pg-current { font-size: 13px; color: #94a3b8; }
      `}</style>
    </div>
  );
}

function SortTh({ col, label, sortBy, sortDir: _sortDir, onSort }: { col: string; label: string; sortBy: string; sortDir: string; onSort: (col: string) => void }) {
  return (
    <th className="sort-th" onClick={() => onSort(col)}>
      {label}
      <span className="sort-icon">
        <ArrowUpDown size={12} style={{ opacity: sortBy === col ? 1 : 0.3 }} />
      </span>
    </th>
  );
}
