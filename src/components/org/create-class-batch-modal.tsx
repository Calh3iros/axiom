"use client";

import { X, Check, Copy } from "lucide-react";
import { useState } from "react";

import { createClassesBatch } from "@/lib/actions/organization";

export function CreateClassesBatchModal({
  orgId,
  open,
  onClose,
  onCreated,
  t,
}: {
  orgId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [sectionsStr, setSectionsStr] = useState("A, B, C"); // Default preset
  const [shifts, setShifts] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    created: number;
    classes: { name: string; code: string }[];
  } | null>(null);

  if (!open) return null;

  const FUNDAMENTAL = ["5º", "6º", "7º", "8º", "9º"];
  const MEDIO = ["1ºEM", "2ºEM", "3ºEM"];

  const getSectionsArray = () => {
    return sectionsStr
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
  };

  const previewCount = selectedGrades.size * getSectionsArray().length;

  const toggleGrade = (g: string) => {
    const next = new Set(selectedGrades);
    if (next.has(g)) next.delete(g);
    else next.add(g);
    setSelectedGrades(next);
  };

  const selectAllFund = () => {
    const next = new Set(selectedGrades);
    let allSelected = true;
    for (const g of FUNDAMENTAL) {
      if (!next.has(g)) allSelected = false;
    }
    for (const g of FUNDAMENTAL) {
      if (allSelected) next.delete(g);
      else next.add(g);
    }
    setSelectedGrades(next);
  };

  const selectAllEM = () => {
    const next = new Set(selectedGrades);
    let allSelected = true;
    for (const g of MEDIO) {
      if (!next.has(g)) allSelected = false;
    }
    for (const g of MEDIO) {
      if (allSelected) next.delete(g);
      else next.add(g);
    }
    setSelectedGrades(next);
  };

  const overrideShifts = (sections: string[], shiftVal: string) => {
    const nextShifts: Record<string, string> = {};
    sections.forEach((s) => (nextShifts[s] = shiftVal));
    setSectionsStr(sections.join(", "));
    setShifts(nextShifts);
  };

  const handleCreate = async () => {
    const sections = getSectionsArray();
    if (selectedGrades.size === 0 || sections.length === 0) {
      setError(t("batch.errorEmpty"));
      return;
    }

    setLoading(true);
    setError("");

    const res = await createClassesBatch({
      orgId,
      grades: Array.from(selectedGrades),
      sections,
      shifts,
    });

    setLoading(false);
    if ("error" in res) {
      setError(res.error);
    } else {
      setResult(res);
      onCreated();
    }
  };

  const renderResult = () => {
    if (!result) return null;
    const textData = result.classes
      .map((c) => `${c.name}: ${c.code}`)
      .join("\n");

    return (
      <div className="text-center">
        <Check className="mx-auto mb-2 h-12 w-12 text-green-400" />
        <h3 className="mb-1 text-lg font-bold text-[var(--color-text-primary)]">
          {t("batch.createdSuccess", { count: result.created })}
        </h3>

        <div className="my-4 max-h-60 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] p-4 text-left">
          {result.classes.map((c) => (
            <div
              key={c.code}
              className="flex justify-between border-b border-[var(--color-border)] py-1 font-mono text-sm text-[var(--color-text-primary)] last:border-0"
            >
              <span>{c.name}</span>
              <span className="font-bold text-[var(--color-ax-yellow)]">
                {c.code}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigator.clipboard.writeText(textData)}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg2)] py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg1)]"
        >
          <Copy className="h-4 w-4" />
          {t("batch.printCodes")}
        </button>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-[var(--color-bg2)] py-2 text-sm font-medium text-[var(--color-dim)] hover:text-white"
        >
          {t("close", { fallback: "Fechar" })}
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {result ? (
          renderResult()
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {t("batch.title", { fallback: "Criar Turmas em Lote" })}
              </h2>
              <button
                onClick={onClose}
                className="text-[var(--color-dim)] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1: Grades */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-dim)]">
                  1. Séries
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Fundamental II
                      </span>
                      <button
                        onClick={selectAllFund}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Selecionar Todos
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {FUNDAMENTAL.map((g) => (
                        <button
                          key={g}
                          onClick={() => toggleGrade(g)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${selectedGrades.has(g) ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-[var(--color-border)] bg-[var(--color-bg1)] text-[var(--color-dim)] hover:border-gray-500"}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Ensino Médio
                      </span>
                      <button
                        onClick={selectAllEM}
                        className="text-xs text-purple-400 hover:underline"
                      >
                        Selecionar Todos
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MEDIO.map((g) => (
                        <button
                          key={g}
                          onClick={() => toggleGrade(g)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${selectedGrades.has(g) ? "border-purple-500 bg-purple-500/20 text-purple-400" : "border-[var(--color-border)] bg-[var(--color-bg1)] text-[var(--color-dim)] hover:border-gray-500"}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Sections */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-dim)]">
                  2. Turmas por Série (ex: A, B, C)
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => overrideShifts(["A", "B", "C"], "morning")}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-bg1)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[#1a1a2e]"
                  >
                    A, B, C (Manhã)
                  </button>
                  <button
                    onClick={() =>
                      overrideShifts(["A", "B", "C", "D", "E"], "morning")
                    }
                    className="rounded border border-[var(--color-border)] bg-[var(--color-bg1)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[#1a1a2e]"
                  >
                    A à E (Manhã)
                  </button>
                  <button
                    onClick={() => overrideShifts(["A", "B", "C"], "afternoon")}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-bg1)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[#1a1a2e]"
                  >
                    A, B, C (Tarde)
                  </button>
                </div>
                <input
                  type="text"
                  value={sectionsStr}
                  onChange={(e) => setSectionsStr(e.target.value)}
                  placeholder="Digitar: A, B, C, D..."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg1)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[#1e1e2e]/50 p-4">
                <p className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  3. Preview: {previewCount} turmas
                </p>
                {previewCount > 0 ? (
                  <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                    {Array.from(selectedGrades).map((g) =>
                      getSectionsArray().map((s) => (
                        <span
                          key={`${g}-${s}`}
                          className="rounded border border-[var(--color-border)] bg-[var(--color-bg1)] px-2 py-1 text-xs text-[var(--color-dim)]"
                        >
                          {g} {s}
                        </span>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-dim)]">
                    Selecione séries e digite as turmas para preview.
                  </p>
                )}
              </div>

              {error && <div className="text-sm text-red-500">{error}</div>}

              <button
                onClick={handleCreate}
                disabled={loading || previewCount === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading
                  ? "Criando..."
                  : t("batch.create", { fallback: "Criar Turmas" })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
