"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Copy, Check, X, ExternalLink } from "lucide-react";
import { createOrganizationDirect } from "@/lib/actions/admin";
import type { useTranslations } from "next-intl";

export function CreateOrgModal({
  open,
  onClose,
  onCreated,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [category, setCategory] = useState<"particular" | "publica" | null>(null);
  const [type, setType] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [maxStudents, setMaxStudents] = useState<number>(500);

  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ orgId: string; code: string } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      setExpiresAt(defaultDate.toISOString().split("T")[0]);

      setStep(1);
      setCategory(null);
      setType(null);
      setName("");
      setMaxStudents(500);
      setNotes("");
      setResult(null);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleCategorySelect = (cat: "particular" | "publica") => {
    setCategory(cat);
    setStep(2);
  };

  const handleTypeSelect = (tOption: string, defaultMaxNum: number) => {
    setType(tOption);
    setMaxStudents(defaultMaxNum);
    setStep(3);
  };

  const handleCreate = async () => {
    if (!name.trim() || !type) return;
    setLoading(true);
    setError("");

    const res = await createOrganizationDirect({
      name: name.trim(),
      type,
      maxStudents,
      expiresAt: expiresAt || undefined,
      contractNotes: notes || undefined,
    });

    setLoading(false);
    if ("error" in res) {
      setError(res.error);
    } else {
      setResult({ orgId: res.orgId, code: res.code });
      setStep(4);
      onCreated();
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleCategorySelect("particular")}
          className="group flex h-36 flex-col items-center justify-center rounded-xl border border-[#2a2a3e] bg-[#0a0a12] p-6 text-left transition-all hover:border-indigo-500 hover:bg-[#12121e]"
        >
          <Building2 className="mb-3 h-8 w-8 text-indigo-400 transition-transform group-hover:scale-110" />
          <h3 className="font-bold text-white">{t("createOrg.particular")}</h3>
          <p className="mt-1 text-center text-xs text-[#94a3b8]">{t("createOrg.particularDesc")}</p>
        </button>
        <button
          onClick={() => handleCategorySelect("publica")}
          className="group flex h-36 flex-col items-center justify-center rounded-xl border border-[#2a2a3e] bg-[#0a0a12] p-6 text-left transition-all hover:border-emerald-500 hover:bg-[#12121e]"
        >
          <Users className="mb-3 h-8 w-8 text-emerald-400 transition-transform group-hover:scale-110" />
          <h3 className="font-bold text-white">{t("createOrg.publica")}</h3>
          <p className="mt-1 text-center text-xs text-[#94a3b8]">{t("createOrg.publicaDesc")}</p>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (category === "particular") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeSelect("private_school", 500)}
              className="group flex h-32 flex-col items-center justify-center rounded-xl border border-[#2a2a3e] bg-[#0a0a12] p-5 transition-all hover:border-indigo-500 hover:bg-[#12121e]"
            >
              <h3 className="text-sm font-bold tracking-wide text-white">{t("createOrg.singleSchool")}</h3>
              <p className="mt-1 text-center text-xs text-[#94a3b8]">{t("createOrg.singleSchoolDesc")}</p>
              <div className="mt-3 rounded-full border border-[#2a2a3e] bg-[#1e1e2e] py-1 px-3 font-mono text-[10px] font-bold tracking-widest text-[#f59e0b]">
                GERA: DIR
              </div>
            </button>
            <button
              onClick={() => handleTypeSelect("private_network", 5000)}
              className="group flex h-32 flex-col items-center justify-center rounded-xl border border-[#2a2a3e] bg-[#0a0a12] p-5 transition-all hover:border-indigo-500 hover:bg-[#12121e]"
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">{t("createOrg.network")}</h3>
              <p className="mt-1 text-center text-xs text-[#94a3b8]">{t("createOrg.networkDesc")}</p>
              <div className="mt-3 rounded-full border border-[#2a2a3e] bg-[#1e1e2e] py-1 px-3 font-mono text-[10px] font-bold tracking-widest text-[#f59e0b]">
                GERA: OWN
              </div>
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleTypeSelect("public_municipal", 20000)}
            className="group flex h-32 flex-col items-center justify-center rounded-xl border border-[#2a2a3e] bg-[#0a0a12] p-5 transition-all hover:border-emerald-500 hover:bg-[#12121e]"
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">{t("createOrg.municipal")}</h3>
            <p className="mt-1 text-center text-xs text-[#94a3b8]">{t("createOrg.municipalDesc")}</p>
            <div className="mt-3 rounded-full border border-[#2a2a3e] bg-[#1e1e2e] py-1 px-3 font-mono text-[10px] font-bold tracking-widest text-[#f59e0b]">
              GERA: SEC
            </div>
          </button>
          <button
            onClick={() => handleTypeSelect("public_state", 500000)}
            className="group flex h-32 flex-col items-center justify-center rounded-xl border border-[#2a2a3e] bg-[#0a0a12] p-5 transition-all hover:border-purple-500 hover:bg-[#12121e]"
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">{t("createOrg.state")}</h3>
            <p className="mt-1 text-center text-xs text-[#94a3b8]">{t("createOrg.stateDesc")}</p>
            <div className="mt-3 rounded-full border border-[#2a2a3e] bg-[#1e1e2e] py-1 px-3 font-mono text-[10px] font-bold tracking-widest text-[#f59e0b]">
              GERA: SEC
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    let typeName = "";
    if (type === "private_school") typeName = t("createOrg.singleSchool");
    if (type === "private_network") typeName = t("createOrg.network");
    if (type === "public_municipal") typeName = t("createOrg.municipal");
    if (type === "public_state") typeName = t("createOrg.state");

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#94a3b8]">{t("createOrg.name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a12] px-3 py-2.5 text-sm text-white outline-none focus:border-[#818cf8]"
            placeholder="..."
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#94a3b8]">{t("createOrg.maxStudents")}</label>
            <input
              type="number"
              value={maxStudents}
              onChange={(e) => setMaxStudents(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a12] px-3 py-2.5 text-sm text-white outline-none focus:border-[#818cf8]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#94a3b8]">{t("createOrg.expiresAt")}</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a12] px-3 py-2.5 text-sm text-white outline-none focus:border-[#818cf8]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#94a3b8]">{t("createOrg.notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a12] px-3 py-2.5 text-sm text-white outline-none focus:border-[#818cf8]"
            placeholder="..."
          />
        </div>

        <div className="mt-4 space-y-1 rounded-xl border border-[#2a2a3e] bg-[#1e1e2e]/50 p-4 text-xs text-[#cbd5e1]">
          <p>
            <span className="mr-1 font-medium text-[#94a3b8]">{t("createOrg.summary")} Tipo:</span> {typeName}
          </p>
          <p>
            <span className="mr-1 font-medium text-[#94a3b8]">{t("createOrg.summary")} Nome:</span> {name || "..."}
          </p>
          <p>
            <span className="mr-1 font-medium text-[#94a3b8]">{t("createOrg.maxStudents")}:</span> {maxStudents.toLocaleString()}
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}

        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : t("createOrg.create")}
        </button>
      </div>
    );
  };

  const renderStep4 = () => {
    if (!result) return null;
    let helpText = "";
    if (type === "private_school") helpText = t("createOrg.sendTo.privateSchool");
    if (type === "private_network") helpText = t("createOrg.sendTo.privateNetwork");
    if (type === "public_municipal") helpText = t("createOrg.sendTo.publicMunicipal");
    if (type === "public_state") helpText = t("createOrg.sendTo.publicState");

    const link = `https://axiom-solver.com/pt/join?code=${result.code}`;

    return (
      <div className="py-4 text-center">
        <Check className="mx-auto mb-4 h-12 w-12 text-green-400" />
        <h2 className="mb-2 text-xl font-bold text-white">{t("createOrg.successTitle")}</h2>

        <div className="my-6 rounded-xl border border-[#2a2a3e] bg-[#0a0a12] p-5 shadow-inner">
          <p className="font-mono text-3xl font-black tracking-[0.2em] text-[#f59e0b]">{result.code}</p>
        </div>

        <p className="mb-6 text-sm text-[#94a3b8]">{helpText}</p>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(result.code);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1e1e2e] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2a2a3e]"
          >
            {copiedCode ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {t("createOrg.copyCode")}
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1e1e2e] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2a2a3e]"
          >
            {copiedLink ? <Check className="h-4 w-4 text-green-400" /> : <ExternalLink className="h-4 w-4" />}
            {t("createOrg.copyLink")}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-[#2a2a3e] py-2.5 text-sm font-semibold text-[#94a3b8] transition-colors hover:bg-[#1a1a2e] hover:text-white"
        >
          {t("platform.close", { fallback: "Fechar" })}
        </button>
      </div>
    );
  };

  let title = "";
  if (step === 1) title = t("createOrg.step1Title");
  if (step === 2) title = t("createOrg.step2Title");
  if (step === 3) title = t("createOrg.step3Title");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#2a2a3e] bg-[#12121a] p-6 shadow-2xl transition-all">
        {step < 4 && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} className="transition-colors text-[#64748b] hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="relative">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {(step === 2 || step === 3) && (
          <button
            onClick={() => setStep((step - 1) as 1 | 2)}
            className="mt-6 w-full border-t border-[#1e1e2e] pt-4 text-center text-xs font-medium text-[#64748b] transition-colors hover:text-white"
          >
            {t("createOrg.back")}
          </button>
        )}
      </div>
    </div>
  );
}
