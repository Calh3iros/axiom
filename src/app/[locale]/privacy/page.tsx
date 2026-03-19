import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.privacy" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function PrivacyPage() {
  const t = useTranslations("Legal.privacy");
  // We'll map through the sections defined in the dictionary.
  const sections = t.raw("sections") as Array<{
    title: string;
    content: string;
    list?: string[];
  }>;

  return (
    <div className="min-h-screen bg-[var(--color-bg0)] text-[var(--color-text-primary)] py-24 px-5">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-8 inline-block"
        >
          {useTranslations("Legal")("backToHome")}
        </Link>
        <h1 className="text-4xl font-extrabold mb-8">{t("title")}</h1>
        <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            <strong className="text-[var(--color-text-primary)]">
              {t("lastUpdated").split(":")[0]}:
            </strong>{" "}
            {t("lastUpdated").split(":")[1]}
          </p>

          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8">
                {section.title}
              </h2>
              <p className="mt-2">{section.content}</p>
              {section.list && (
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
