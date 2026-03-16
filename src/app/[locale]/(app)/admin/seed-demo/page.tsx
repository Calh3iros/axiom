"use client";

import { Database, FlaskConical, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { seedDemoData, removeDemoData, checkDemoStatus } from "@/lib/actions/seed-demo";

export default function SeedDemoPage() {
  const t = useTranslations("Admin");
  const [demoExists, setDemoExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    checkDemoStatus().then((r) => { setDemoExists(r.exists); setLoading(false); });
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const result = await seedDemoData();
      setMessage({ text: result.message, type: result.success ? "success" : "error" });
      if (result.success) setDemoExists(true);
    } catch (e) {
      setMessage({ text: String(e), type: "error" });
    }
    setSeeding(false);
  };

  const handleRemove = async () => {
    if (!confirm(t("seedDemo.confirmRemove"))) return;
    setRemoving(true);
    setMessage(null);
    try {
      const result = await removeDemoData();
      setMessage({ text: result.message, type: result.success ? "success" : "error" });
      if (result.success) setDemoExists(false);
    } catch (e) {
      setMessage({ text: String(e), type: "error" });
    }
    setRemoving(false);
  };

  return (
    <div>
      <h1 className="admin-page-title">
        <FlaskConical style={{ display: "inline", width: 24, height: 24, marginRight: 8, color: "#818cf8" }} />
        {t("seedDemo.title")}
      </h1>

      <div className="seed-card">
        <div className="seed-card-header">
          <Database style={{ width: 20, height: 20, color: "#818cf8" }} />
          <h2 className="seed-card-title">{t("seedDemo.schoolName")}</h2>
          <span className={`seed-status ${demoExists ? "active" : "inactive"}`}>
            {loading ? "..." : demoExists ? t("seedDemo.active") : t("seedDemo.inactive")}
          </span>
        </div>

        <div className="seed-info">
          <p>{t("seedDemo.description")}</p>
          <ul className="seed-list">
            <li>🏫 1 escola, 3 turmas (9º Ano A, 9º Ano B, 8º Ano A)</li>
            <li>👨‍🏫 3 professores + 1 diretor</li>
            <li>👨‍🎓 75 alunos (25 por turma) — nomes brasileiros</li>
            <li>📊 3 meses de atividade simulada (challenge_log, usage, knowledge_map)</li>
            <li>📈 Distribuição realista: excelentes, medianos e com dificuldade</li>
            <li>🏆 Badges desbloqueados proporcionais à atividade</li>
          </ul>
        </div>

        <div className="seed-actions">
          {!demoExists ? (
            <button
              onClick={handleSeed}
              disabled={seeding || loading}
              className="seed-btn activate"
            >
              {seeding ? (
                <><Loader2 className="seed-spin" style={{ width: 16, height: 16 }} /> {t("seedDemo.seeding")}</>
              ) : (
                <><FlaskConical style={{ width: 16, height: 16 }} /> {t("seedDemo.activate")}</>
              )}
            </button>
          ) : (
            <button
              onClick={handleRemove}
              disabled={removing || loading}
              className="seed-btn remove"
            >
              {removing ? (
                <><Loader2 className="seed-spin" style={{ width: 16, height: 16 }} /> {t("seedDemo.removing")}</>
              ) : (
                <><Trash2 style={{ width: 16, height: 16 }} /> {t("seedDemo.remove")}</>
              )}
            </button>
          )}
        </div>

        {message && (
          <div className={`seed-message ${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle2 style={{ width: 16, height: 16 }} />
            ) : (
              <XCircle style={{ width: 16, height: 16 }} />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <style>{`
        .admin-page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #f1f5f9; display: flex; align-items: center; }
        .seed-card { background: #12121a; border: 1px solid #1e1e2e; border-radius: 16px; padding: 28px; }
        .seed-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .seed-card-title { font-size: 18px; font-weight: 600; color: #f1f5f9; flex: 1; margin: 0; }
        .seed-status { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
        .seed-status.active { background: #16513d; color: #4ade80; }
        .seed-status.inactive { background: #1e293b; color: #94a3b8; }
        .seed-info p { color: #94a3b8; font-size: 14px; margin: 0 0 16px; }
        .seed-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
        .seed-list li { font-size: 13px; color: #cbd5e1; padding: 8px 12px; background: #0f0f18; border-radius: 8px; }
        .seed-actions { margin-top: 24px; display: flex; gap: 12px; }
        .seed-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .seed-btn.activate { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; }
        .seed-btn.activate:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3); }
        .seed-btn.remove { background: #4c1d1d; color: #f87171; }
        .seed-btn.remove:hover:not(:disabled) { background: #7f1d1d; }
        .seed-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .seed-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .seed-message { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 12px 16px; border-radius: 10px; font-size: 13px; }
        .seed-message.success { background: #16513d22; color: #4ade80; border: 1px solid #16513d; }
        .seed-message.error { background: #4c1d1d22; color: #f87171; border: 1px solid #4c1d1d; }
      `}</style>
    </div>
  );
}
