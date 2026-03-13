"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/routing";

function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-[var(--color-ax-blue)]"
      >
        <span className="pr-4 text-base font-semibold text-[var(--color-text-primary)]">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-[var(--color-dim)] transition-transform duration-200 ${
            open ? "rotate-180 text-[var(--color-ax-blue)]" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const t = useTranslations("FAQ");
  const items = t.raw("items") as Array<{ q: string; a: string }>;

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] px-5 py-24 text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          ← {t("backToHome")}
        </Link>

        <div className="mb-2 font-mono text-xs font-semibold tracking-wider text-[var(--color-ax-blue)] uppercase">
          {t("subtitle")}
        </div>
        <h1 className="mb-2 text-4xl font-extrabold">{t("title")}</h1>
        <p className="mb-10 text-[var(--color-text-secondary)]">
          {t("description")}
        </p>

        <div className="rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] px-6">
          {items.map((item, idx) => (
            <AccordionItem key={idx} question={item.q} answer={item.a} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[var(--color-border2)] bg-[var(--color-bg1)] p-6 text-center">
          <p className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
            {t("stillNeedHelp")}
          </p>
          <a
            href="mailto:mysupport@axiom-solver.com"
            className="text-sm font-medium text-[var(--color-ax-blue)] transition-colors hover:text-orange-400"
          >
            mysupport@axiom-solver.com
          </a>
        </div>
      </div>
    </div>
  );
}
