import type { MetadataRoute } from "next";

const BASE_URL = "https://axiom-solver.com";
const LOCALES = ["en", "pt", "es", "fr", "de", "zh"];

// Public pages that should be indexed
const PUBLIC_PAGES = ["", "/privacy", "/terms", "/faq", "/pricing"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of PUBLIC_PAGES) {
    const alternates: Record<string, string> = {};
    for (const locale of LOCALES) {
      alternates[locale] = `${BASE_URL}/${locale}${page}`;
    }

    entries.push({
      url: `${BASE_URL}/en${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? "weekly" : "monthly",
      priority: page === "" ? 1.0 : 0.7,
      alternates: { languages: alternates },
    });
  }

  // Auth pages (lower priority)
  for (const authPage of ["/auth/login", "/auth/signup"]) {
    entries.push({
      url: `${BASE_URL}/en${authPage}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    });
  }

  return entries;
}
