"use client";

import {
  BookOpen,
  Copy,
  Download,
  Map as MapIcon,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/routing";

export function HelpGuide({
  role,
  onClose,
}: {
  role: string;
  onClose: () => void;
}) {
  const t = useTranslations("Help");
  const [copiedPrf, setCopiedPrf] = useState(false);
  const [copiedStu, setCopiedStu] = useState(false);

  const renderDirectorGuide = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        {t("director.title", { fallback: "Como configurar sua escola" })}
      </h2>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            1
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("director.step1", { fallback: "Criar turmas" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("director.step1Desc", {
                fallback:
                  "Vá ao dashboard da escola e crie as turmas manualmente ou clique em 'Criar em Lote' para adicionar várias.",
              })}
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            2
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("director.step2", {
                fallback: "Gerar código de professores (PRF)",
              })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("director.step2Desc", {
                fallback: "Acesso a aba 'Professores' para pegar o código.",
              })}
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            3
          </div>
          <div className="w-full">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("director.step3", { fallback: "Compartilhe com a equipe" })}
            </h3>
            <div className="relative mt-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <p className="text-sm text-green-300 italic">
                {t("director.msgPrf", {
                  fallback:
                    '"Olá professores! Este é o código da nossa escola no Axiom. Cadastrem-se e entrem na nossa equipe: [SEU-CÓDIGO-AQUI]"',
                })}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    t("director.msgPrf", {
                      fallback:
                        '"Olá professores! Este é o código da nossa escola no Axiom. Cadastrem-se e entrem na nossa equipe: [SEU-CÓDIGO-AQUI]"',
                    })
                  );
                  setCopiedPrf(true);
                  setTimeout(() => setCopiedPrf(false), 2000);
                }}
                className="absolute top-2 right-2 rounded p-1.5 text-green-400 hover:bg-green-500/20"
              >
                {copiedPrf ? (
                  <span className="text-xs">Copiado!</span>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            4
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("director.step4", { fallback: "Acompanhe o painel" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("director.step4Desc", {
                fallback:
                  "Acompanhe KPIs, classificação (ranking) e engajamento da sua escola na página inicial.",
              })}
            </p>
          </div>
        </div>
      </div>

    </div>
  );

  const renderTeacherGuide = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        {t("teacher.title", { fallback: "Guia Rápido — 3 minutos" })}
      </h2>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            1
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("teacher.step1", { fallback: "Obter código da Turma" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("teacher.step1Desc", {
                fallback:
                  "Entre na sua turma em 'Minhas Turmas' e veja o código no topo.",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            2
          </div>
          <div className="w-full">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("teacher.step2", { fallback: "Enviar aos alunos" })}
            </h3>
            <div className="relative mt-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <p className="text-sm text-green-300 italic">
                {t("teacher.msgClass", {
                  fallback:
                    '"Turma, acessem axiom-solver.com e fiquem na vanguarda do aprendizado com IA! Entrem na turma com o código: [CÓDIGO-DA-TURMA]"',
                })}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    t("teacher.msgClass", {
                      fallback:
                        '"Turma, acessem axiom-solver.com e fiquem na vanguarda do aprendizado com IA! Entrem na turma com o código: [CÓDIGO-DA-TURMA]"',
                    })
                  );
                  setCopiedStu(true);
                  setTimeout(() => setCopiedStu(false), 2000);
                }}
                className="absolute top-2 right-2 rounded p-1.5 text-green-400 hover:bg-green-500/20"
              >
                {copiedStu ? (
                  <span className="text-xs">Copiado!</span>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            3
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("teacher.step3", { fallback: "Seu Painel" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("teacher.step3Desc", {
                fallback:
                  "Acompanhe evolução, notas, alertas de engajamento e o ranking da turma em cliques de distância.",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            4
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("teacher.step4", { fallback: "PDFs" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("teacher.step4Desc", {
                fallback:
                  "Imprima rapidamente boletins com diagnóstico do uso de IA da turma inteira ou individual.",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCoordinatorGuide = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        {t("coordinator.title", { fallback: "Visão pedagógica da escola" })}
      </h2>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            1
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("coordinator.step1", { fallback: "Painel Comparativo" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("coordinator.step1Desc", {
                fallback: "Analise dados cross-turma na barra do dashboard.",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            2
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("coordinator.step2", { fallback: "Alertas Pedagógicos" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("coordinator.step2Desc", {
                fallback: "Localize turmas onde a adesão está caindo e aja!",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            3
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("coordinator.step3", { fallback: "Reatribuir turmas e CSVs" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("coordinator.step3Desc", {
                fallback:
                  "Ative ou delegue novas turmas acessando a lista de turmas vazias.",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOwnerGuide = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        {t("owner.title", { fallback: "Gerenciando sua rede" })}
      </h2>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            1
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("owner.step1", { fallback: "Criar escolas" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("owner.step1Desc", { fallback: "Clique em '+ Nova Escola'." })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            2
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("owner.step2", { fallback: "Distribuir aos diretores (DIR)" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("owner.step2Desc", {
                fallback:
                  "Cada escola gera um código automático. Distribua aos gestores de cada pólo.",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            3
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t("owner.step3", { fallback: "Dashboard Geral e Drill-Down" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("owner.step3Desc", {
                fallback:
                  "Semáforo visualizando a adesão de todas as escolas; cliques levam a dados granulares.",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenericGuide = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        {t("student.title", { fallback: "Como usar o Axiom" })}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/solve"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-4 transition-colors hover:bg-[var(--color-bg3)]"
        >
          <BookOpen className="mb-2 h-6 w-6 text-orange-400" />
          <h3 className="font-medium text-[var(--color-text-primary)]">
            {t("student.step1", { fallback: "Treinar" })}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-dim)]">
            {t("student.step1Desc", {
              fallback: "A IA resolve o exercício passo a passo",
            })}
          </p>
        </Link>
        <Link
          href="/solve"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-4 transition-colors hover:bg-[var(--color-bg3)]"
        >
          <TrendingUp className="mb-2 h-6 w-6 text-blue-400" />
          <h3 className="font-medium text-[var(--color-text-primary)]">
            {t("student.step2", { fallback: "Socrático" })}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-dim)]">
            {t("student.step2Desc", {
              fallback: "A IA te guia sem dar a resposta direta",
            })}
          </p>
        </Link>
        <Link
          href="/map"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-4 transition-colors hover:bg-[var(--color-bg3)]"
        >
          <MapIcon className="mb-2 h-6 w-6 text-green-400" />
          <h3 className="font-medium text-[var(--color-text-primary)]">
            {t("student.step3", { fallback: "Mapa de Conhecimento" })}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-dim)]">
            {t("student.step3Desc", {
              fallback: "Acompanhe e reforce áreas fracas",
            })}
          </p>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative z-[9999] mx-auto w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-white p-6 text-black shadow-2xl dark:bg-[var(--color-bg1)] dark:text-[var(--color-text-primary)]">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="custom-scrollbar max-h-[70vh] overflow-y-auto pr-2">
        {role === "owner" || role === "secretary"
          ? renderOwnerGuide()
          : role === "director" || role === "admin"
            ? renderDirectorGuide()
            : role === "coordinator"
              ? renderCoordinatorGuide()
              : role === "teacher"
                ? renderTeacherGuide()
                : renderGenericGuide()}
                
        {role !== "student" && role !== "generic" && (
          <button
            onClick={async () => {
              try {
                const { exportGuidePdf } = await import("@/lib/export-guide-pdf");
                await exportGuidePdf(role);
              } catch (err) {
                console.error(err);
              }
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg3)]"
          >
            <Download className="h-4 w-4" />
            {t("downloadPdf", { fallback: "Baixar Guia Completo (PDF)" })}
          </button>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-dim); }
      `}</style>
    </div>
  );
}
