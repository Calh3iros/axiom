"use client";

import { Check, X, Ban, Clock, Building2, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { getAllOrgs, approveOrg, rejectOrg, suspendOrg, getPendingOrgsCount } from "@/lib/actions/admin";

type OrgRequest = {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  requested_at: string;
  requested_by_name: string;
  requested_by_email: string;
  requested_by_role: string;
  requested_by_phone: string;
  institution_id: string;
  request_message: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
};

const STATUS_TABS = ["pending", "active", "rejected", "suspended"] as const;

export default function AdminApprovalsPage() {
  const t = useTranslations("Admin");
  const [tab, setTab] = useState<string>("pending");
  const [orgs, setOrgs] = useState<OrgRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        getAllOrgs(tab),
        getPendingOrgsCount(),
      ]);
      setOrgs(data as OrgRequest[]);
      setPendingCount(count);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveOrg(id);
      await fetchData();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionLoading(rejectId);
    try {
      await rejectOrg(rejectId, rejectReason);
      setRejectId(null);
      setRejectReason("");
      await fetchData();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleSuspend = async (id: string) => {
    setActionLoading(id);
    try {
      await suspendOrg(id);
      await fetchData();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div>
      <h1 className="admin-page-title">{t("approvals.title")}</h1>

      {/* Tabs */}
      <div className="admin-tabs">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`admin-tab ${tab === s ? "active" : ""}`}
          >
            {t(`approvals.tab.${s}`)}
            {s === "pending" && pendingCount > 0 && (
              <span className="admin-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">{t("loading")}</div>
      ) : orgs.length === 0 ? (
        <div className="admin-empty">
          <Clock className="admin-empty-icon" />
          <p>{t("approvals.empty")}</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("approvals.col.name")}</th>
                <th>{t("approvals.col.type")}</th>
                <th>{t("approvals.col.requester")}</th>
                <th>{t("approvals.col.date")}</th>
                <th>{t("approvals.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <>
                  <tr key={org.id} className="admin-row">
                    <td>
                      <button
                        className="admin-expand-btn"
                        onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}
                      >
                        <Building2 className="admin-cell-icon" />
                        <span>{org.name}</span>
                        {expandedId === org.id ? (
                          <ChevronUp className="admin-chevron" />
                        ) : (
                          <ChevronDown className="admin-chevron" />
                        )}
                      </button>
                    </td>
                    <td><span className="admin-type-badge">{org.type}</span></td>
                    <td>{org.requested_by_name || "—"}</td>
                    <td>{formatDate(org.requested_at)}</td>
                    <td className="admin-actions">
                      {tab === "pending" && (
                        <>
                          <button
                            className="admin-btn approve"
                            onClick={() => handleApprove(org.id)}
                            disabled={actionLoading === org.id}
                          >
                            <Check size={14} /> {t("approvals.approve")}
                          </button>
                          <button
                            className="admin-btn reject"
                            onClick={() => { setRejectId(org.id); setRejectReason(""); }}
                            disabled={actionLoading === org.id}
                          >
                            <X size={14} /> {t("approvals.reject")}
                          </button>
                        </>
                      )}
                      {tab === "active" && (
                        <button
                          className="admin-btn suspend"
                          onClick={() => handleSuspend(org.id)}
                          disabled={actionLoading === org.id}
                        >
                          <Ban size={14} /> {t("approvals.suspend")}
                        </button>
                      )}
                      {tab === "rejected" && (
                        <span className="admin-reason">{org.rejection_reason}</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === org.id && (
                    <tr key={`${org.id}-detail`} className="admin-detail-row">
                      <td colSpan={5}>
                        <div className="admin-detail-grid">
                          <div><Mail size={14} /> {org.requested_by_email || "—"}</div>
                          <div><Phone size={14} /> {org.requested_by_phone || "—"}</div>
                          <div><strong>CNPJ:</strong> {org.institution_id || "—"}</div>
                          <div><strong>{t("approvals.col.role")}:</strong> {org.requested_by_role || "—"}</div>
                          {org.request_message && (
                            <div className="admin-detail-msg">
                              <strong>{t("approvals.col.message")}:</strong> {org.request_message}
                            </div>
                          )}
                          {org.approved_at && (
                            <div><strong>{t("approvals.approvedAt")}:</strong> {formatDate(org.approved_at)}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="admin-modal-overlay" onClick={() => setRejectId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("approvals.rejectTitle")}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("approvals.rejectPlaceholder")}
              className="admin-textarea"
              rows={3}
            />
            <div className="admin-modal-actions">
              <button className="admin-btn cancel" onClick={() => setRejectId(null)}>
                {t("cancel")}
              </button>
              <button
                className="admin-btn reject"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === rejectId}
              >
                {t("approvals.confirmReject")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #f1f5f9; }
        .admin-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: #12121a; padding: 4px; border-radius: 10px; }
        .admin-tab { flex: 1; padding: 10px 16px; background: transparent; border: none; color: #94a3b8; cursor: pointer; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s; }
        .admin-tab:hover { color: #e2e8f0; }
        .admin-tab.active { background: #1e1e2e; color: #c7d2fe; }
        .admin-badge { background: #ef4444; color: white; font-size: 11px; padding: 1px 7px; border-radius: 10px; font-weight: 600; }
        .admin-loading { text-align: center; padding: 60px 0; color: #64748b; }
        .admin-empty { text-align: center; padding: 60px 0; color: #475569; }
        .admin-empty-icon { width: 40px; height: 40px; margin: 0 auto 12px; color: #334155; }
        .admin-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #1e1e2e; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #12121a; border-bottom: 1px solid #1e1e2e; }
        .admin-table td { padding: 12px 16px; border-bottom: 1px solid #1a1a2a; font-size: 14px; }
        .admin-row:hover td { background: #14141e; }
        .admin-expand-btn { background: none; border: none; color: #e2e8f0; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
        .admin-cell-icon { width: 16px; height: 16px; color: #818cf8; }
        .admin-chevron { width: 14px; height: 14px; color: #64748b; }
        .admin-type-badge { background: #1e1e2e; padding: 3px 10px; border-radius: 6px; font-size: 12px; color: #94a3b8; text-transform: capitalize; }
        .admin-actions { display: flex; gap: 6px; }
        .admin-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .admin-btn.approve { background: #16513d; color: #4ade80; }
        .admin-btn.approve:hover { background: #166534; }
        .admin-btn.reject { background: #4c1d1d; color: #f87171; }
        .admin-btn.reject:hover { background: #7f1d1d; }
        .admin-btn.suspend { background: #4a3520; color: #fbbf24; }
        .admin-btn.suspend:hover { background: #713f12; }
        .admin-btn.cancel { background: #1e1e2e; color: #94a3b8; }
        .admin-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-reason { font-size: 12px; color: #64748b; font-style: italic; }
        .admin-detail-row td { background: #0f0f18; }
        .admin-detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; font-size: 13px; color: #94a3b8; }
        .admin-detail-grid div { display: flex; align-items: center; gap: 6px; }
        .admin-detail-msg { grid-column: 1 / -1; }
        .admin-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .admin-modal { background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 12px; padding: 24px; width: 400px; max-width: 90vw; }
        .admin-modal h3 { margin: 0 0 16px; font-size: 16px; color: #f1f5f9; }
        .admin-textarea { width: 100%; background: #12121a; border: 1px solid #2a2a3e; border-radius: 8px; padding: 10px; color: #e2e8f0; resize: none; font-size: 14px; }
        .admin-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
      `}</style>
    </div>
  );
}
