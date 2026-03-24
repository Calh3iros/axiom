"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { HelpGuide } from "./help-guide";

export function WelcomeBanner({ orgId, role }: { orgId: string; role: string }) {
  const t = useTranslations("Help");
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const key = `axiom_help_dismissed_${orgId}`;
    if (!localStorage.getItem(key)) {
      setShow(true);
    }
  }, [orgId]);

  const handleDismiss = () => {
    localStorage.setItem(`axiom_help_dismissed_${orgId}`, "true");
    setShow(false);
  };

  if (!show) return null;

  const content: Record<string, { msg: string; btn: string }> = {
    owner: { msg: t("owner.banner", { fallback: "Comece criando as escolas da sua rede →" }), btn: t("seeGuide", { fallback: "Ver Guia" }) },
    secretary: { msg: t("owner.banner", { fallback: "Comece criando as escolas da sua rede →" }), btn: t("seeGuide", { fallback: "Ver Guia" }) },
    director: { msg: t("director.banner", { fallback: "Bem-vindo! Veja como configurar sua escola em 15 minutos →" }), btn: t("seeGuide", { fallback: "Ver Guia" }) },
    admin: { msg: t("director.banner", { fallback: "Bem-vindo! Veja como configurar sua escola em 15 minutos →" }), btn: t("seeGuide", { fallback: "Ver Guia" }) },
    coordinator: { msg: t("coordinator.banner", { fallback: "Você é coordenador! Veja o que pode fazer →" }), btn: t("seeGuide", { fallback: "Ver Guia" }) },
    teacher: { msg: t("teacher.banner", { fallback: "Pronto! Agora compartilhe o código da turma com seus alunos →" }), btn: t("seeHow", { fallback: "Ver como" }) }
  };

  const text = content[role];
  if (!text) return null; // Students don't have banners in /org

  return (
    <>
      <div className="mb-6 flex w-full items-center justify-between rounded-xl bg-orange-500 p-4 text-white shadow-lg print:hidden">
        <p className="font-semibold text-sm sm:text-base">
          ✨ {text.msg}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(true)}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold transition-colors hover:bg-white/30"
          >
            {text.btn}
          </button>
          <button onClick={handleDismiss} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 print:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowGuide(false)}
          />
          <HelpGuide role={role} onClose={() => setShowGuide(false)} />
        </div>
      )}
    </>
  );
}
