"use client";

import { useEffect, useState } from "react";
import { BookOpen, TrendingUp, CheckSquare } from "lucide-react";
import { useTranslations } from "next-intl";

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
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-[var(--color-bg1)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--color-border)] p-6 md:p-8 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[var(--color-text-primary)] mb-2">
          {t("welcomeTitle", { fallback: "Bem-vindo ao Axiom!" })}
        </h2>
        <p className="text-center text-[var(--color-dim)] mb-8">
          {t("welcomeDesc", { fallback: "Escolha como quer estudar:" })}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-5 text-center transition-transform hover:-translate-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 mb-4">
              <BookOpen className="h-6 w-6 text-orange-400" />
            </div>
            <h3 className="font-bold text-[var(--color-text-primary)] mb-2">{t("modeTrain", { fallback: "Treinar" })}</h3>
            <p className="text-sm text-[var(--color-dim)]">{t("modeTrainDesc", { fallback: "A IA resolve o exercício passo a passo e te explica" })}</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-5 text-center transition-transform hover:-translate-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 mb-4">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="font-bold text-[var(--color-text-primary)] mb-2">{t("modeSocratic", { fallback: "Socrático" })}</h3>
            <p className="text-sm text-[var(--color-dim)]">{t("modeSocraticDesc", { fallback: "A IA te guia com perguntas, sem dar a resposta" })}</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-5 text-center transition-transform hover:-translate-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 mb-4">
              <CheckSquare className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="font-bold text-[var(--color-text-primary)] mb-2">{t("modeVerify", { fallback: "Verificar" })}</h3>
            <p className="text-sm text-[var(--color-dim)]">{t("modeVerifyDesc", { fallback: "Cole sua resposta e a IA confere se está certa" })}</p>
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
