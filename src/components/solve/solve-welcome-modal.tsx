"use client";

import { BookOpen, TrendingUp, CheckSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function SolveWelcomeModal() {
  const [show, setShow] = useState(false);
  const t = useTranslations("Help.student"); // We'll reuse Student definitions

  useEffect(() => {
    const key = "axiom_solve_welcome_seen";
    if (!localStorage.getItem(key)) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("axiom_solve_welcome_seen", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
      <div className="animate-in fade-in zoom-in w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl duration-300 md:p-8 dark:bg-[var(--color-bg1)]">
        <h2 className="mb-2 text-center text-2xl font-extrabold text-[var(--color-text-primary)] md:text-3xl">
          {t("welcomeTitle", { fallback: "Bem-vindo ao Axiom!" })}
        </h2>
        <p className="mb-8 text-center text-[var(--color-dim)]">
          {t("welcomeDesc", { fallback: "Escolha como quer estudar:" })}
        </p>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-5 text-center transition-transform hover:-translate-y-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
              <BookOpen className="h-6 w-6 text-orange-400" />
            </div>
            <h3 className="mb-2 font-bold text-[var(--color-text-primary)]">
              {t("modeTrain", { fallback: "Treinar" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("modeTrainDesc", {
                fallback: "A IA resolve o exercício passo a passo e te explica",
              })}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-5 text-center transition-transform hover:-translate-y-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="mb-2 font-bold text-[var(--color-text-primary)]">
              {t("modeSocratic", { fallback: "Socrático" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("modeSocraticDesc", {
                fallback: "A IA te guia com perguntas, sem dar a resposta",
              })}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-5 text-center transition-transform hover:-translate-y-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <CheckSquare className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="mb-2 font-bold text-[var(--color-text-primary)]">
              {t("modeVerify", { fallback: "Verificar" })}
            </h3>
            <p className="text-sm text-[var(--color-dim)]">
              {t("modeVerifyDesc", {
                fallback: "Cole sua resposta e a IA confere se está certa",
              })}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full rounded-xl bg-[var(--color-ax-blue)] py-4 text-center font-bold text-black transition-colors hover:bg-orange-400 active:scale-[0.98]"
        >
          {t("letsGo", { fallback: "Vamos lá!" })}
        </button>
      </div>
    </div>
  );
}
