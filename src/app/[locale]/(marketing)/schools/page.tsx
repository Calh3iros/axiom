import type { Metadata } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Link } from "@/i18n/routing";

import "../../landing.css";
import "./schools.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Schools" });
  return {
    title: t("hero.title") + " — Axiom",
    description: t("hero.subtitle"),
    openGraph: {
      title: t("hero.title") + " — Axiom",
      description: t("hero.subtitle"),
    },
  };
}

function SchoolsContent() {
  const t = useTranslations("Schools");
  const lt = useTranslations("Landing");

  const WA_LINK =
    "https://wa.me/5581996800181?text=Ol%C3%A1!%20Tenho%20interesse%20no%20Axiom%20para%20minha%20institui%C3%A7%C3%A3o.";
  const EMAIL_LINK =
    "mailto:mysupport@axiom-solver.com?subject=Cota%C3%A7%C3%A3o%20Institucional%20Axiom";

  const steps = [
    { icon: "📄", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { icon: "⚡", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { icon: "📱", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
    { icon: "📊", title: t("howItWorks.step4Title"), desc: t("howItWorks.step4Desc") },
  ];

  const features = [
    { icon: "📸", label: t("features.feat1"), desc: t("features.feat1desc") },
    { icon: "✍️", label: t("features.feat2"), desc: t("features.feat2desc") },
    { icon: "🔄", label: t("features.feat3"), desc: t("features.feat3desc") },
    { icon: "🧠", label: t("features.feat4"), desc: t("features.feat4desc") },
    { icon: "📋", label: t("features.feat5"), desc: t("features.feat5desc") },
    { icon: "🔐", label: t("features.feat6"), desc: t("features.feat6desc") },
  ];

  return (
    <>
      {/* NAV */}
      <nav className="landing-nav">
        <Link href="/" className="landing-nav-logo">AXIOM</Link>
        <div className="nav-center">
          <Link href="/">{lt("nav.features")}</Link>
          <Link href="/schools" className="nav-active">{lt("nav.forSchools")}</Link>
          <a href="#pricing">{lt("nav.pricing")}</a>
        </div>
        <div className="nav-right">
          <LanguageSwitcher />
          <Link href="/auth/login" className="nav-login">{lt("nav.login")}</Link>
          <Link href="/auth/signup" className="nav-cta">{lt("nav.startFree")}</Link>
        </div>
      </nav>

      {/* SECTION 1 — HERO B2B */}
      <section className="sch-hero">
        <div className="sch-hero-glow" />
        <div className="sch-hero-badge">🏫 B2B</div>
        <h1>{t("hero.title")}</h1>
        <p className="sch-hero-sub">{t("hero.subtitle")}</p>
        <div className="sch-hero-ctas">
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary sch-btn-wa">
            <span>💬</span> {t("hero.ctaWhatsApp")}
          </a>
          <a href={EMAIL_LINK} className="btn-ghost sch-btn-email">
            <span>✉️</span> {t("hero.ctaEmail")}
          </a>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section className="sch-section">
        <div className="sch-tag">{t("problem.tag")}</div>
        <h2 className="sch-title">{t("problem.title")}</h2>
        <div className="sch-problem-grid">
          {[t("problem.card1"), t("problem.card2"), t("problem.card3"), t("problem.card4")].map(
            (text, i) => (
              <div key={i} className="sch-problem-card">
                <div className="sch-problem-icon">😩</div>
                <p>{text}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* SECTION 3 — THE SOLUTION (Dashboards) */}
      <section className="sch-section sch-solution-section">
        <div className="sch-tag">{t("solution.tag")}</div>
        <h2 className="sch-title">{t("solution.title")}</h2>
        <div className="sch-dashboards">
          {[
            {
              title: t("solution.teacherTitle"),
              icon: "👩‍🏫",
              bullets: [t("solution.teacherBullet1"), t("solution.teacherBullet2"), t("solution.teacherBullet3")],
              color: "#3b82f6",
            },
            {
              title: t("solution.directorTitle"),
              icon: "🎓",
              bullets: [t("solution.directorBullet1"), t("solution.directorBullet2"), t("solution.directorBullet3")],
              color: "#8b5cf6",
            },
            {
              title: t("solution.secretaryTitle"),
              icon: "🏛️",
              bullets: [t("solution.secretaryBullet1"), t("solution.secretaryBullet2"), t("solution.secretaryBullet3")],
              color: "#f59e0b",
            },
          ].map((dash, i) => {
            const dashImages = [
              "/images/schools/teacher-dashboard.png",
              "/images/schools/director-dashboard.png",
              "/images/schools/secretary-dashboard.png",
            ];
            return (
            <div key={i} className="sch-dash-card">
              <div className="sch-dash-header" style={{ borderColor: dash.color }}>
                <span className="sch-dash-icon">{dash.icon}</span>
                <h3>{dash.title}</h3>
              </div>
              <div className="sch-dash-screenshot">
                <Image
                  src={dashImages[i]}
                  alt={dash.title}
                  width={900}
                  height={500}
                  className="sch-dash-img"
                  unoptimized
                />
                <div className="sch-dash-label">{t("solution.demoLabel")}</div>
              </div>
              <div className="sch-dash-preview" style={{ borderColor: dash.color }}>
                <div className="sch-dash-mock">
                  <div className="sch-mock-row">
                    <div className="sch-mock-stat" style={{ background: dash.color + "22" }}>
                      <div className="sch-mock-num" style={{ color: dash.color }}>87%</div>
                      <div className="sch-mock-label">Engagement</div>
                    </div>
                    <div className="sch-mock-stat" style={{ background: dash.color + "22" }}>
                      <div className="sch-mock-num" style={{ color: dash.color }}>342</div>
                      <div className="sch-mock-label">Active</div>
                    </div>
                    <div className="sch-mock-stat" style={{ background: dash.color + "22" }}>
                      <div className="sch-mock-num" style={{ color: dash.color }}>24</div>
                      <div className="sch-mock-label">Alerts</div>
                    </div>
                  </div>
                  <div className="sch-mock-bars">
                    {[85, 72, 93, 68, 78].map((v, j) => (
                      <div key={j} className="sch-mock-bar-wrap">
                        <div className="sch-mock-bar" style={{ width: `${v}%`, background: dash.color }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <ul className="sch-dash-bullets">
                {dash.bullets.map((b, j) => (
                  <li key={j}><span className="sch-check" style={{ color: dash.color }}>✓</span> {b}</li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="sch-section">
        <div className="sch-tag">{t("howItWorks.tag")}</div>
        <h2 className="sch-title">{t("howItWorks.title")}</h2>
        <div className="sch-steps">
          {steps.map((s, i) => (
            <div key={i} className="sch-step">
              <div className="sch-step-number">{i + 1}</div>
              <div className="sch-step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 — FEATURES */}
      <section className="sch-section">
        <div className="sch-tag">{t("features.tag")}</div>
        <h2 className="sch-title">{t("features.title")}</h2>
        <div className="sch-features-grid">
          {features.map((f, i) => (
            <div key={i} className="sch-feature-card">
              <div className="sch-feature-icon">{f.icon}</div>
              <h3>{f.label}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 — PRICING */}
      <section id="pricing" className="sch-section sch-pricing-section">
        <div className="sch-tag">{t("pricing.tag")}</div>
        <h2 className="sch-title">{t("pricing.title")}</h2>
        <div className="sch-pricing-card">
          <div className="sch-pricing-badge">🏫 INSTITUTIONAL</div>
          <ul>
            <li><span className="sch-check-p">✓</span> {t("pricing.bullet1")}</li>
            <li><span className="sch-check-p">✓</span> {t("pricing.bullet2")}</li>
            <li><span className="sch-check-p">✓</span> {t("pricing.bullet3")}</li>
            <li><span className="sch-check-p">✓</span> {t("pricing.bullet4")}</li>
            <li><span className="sch-check-p">✓</span> {t("pricing.bullet5")}</li>
          </ul>
          <div className="sch-pricing-label">{t("pricing.priceLabel")}</div>
          <a href={EMAIL_LINK} className="btn-primary sch-pricing-cta">
            {t("pricing.ctaQuote")}
          </a>
        </div>
      </section>

      {/* SECTION 7 — FINAL CTA */}
      <section className="sch-cta-section">
        <div className="sch-cta-glow" />
        <h2>{t("cta.title")}</h2>
        <div className="sch-cta-buttons">
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary sch-btn-wa-lg">
            💬 {t("cta.ctaWhatsApp")}
          </a>
          <a href={EMAIL_LINK} className="btn-ghost sch-btn-email-lg">
            ✉️ {t("cta.ctaEmail")}
          </a>
        </div>
        <p className="sch-cta-note">{t("cta.responseTime")}</p>
      </section>

      {/* SECTION 8 — FOOTER */}
      <footer className="landing-footer">
        <div className="footer-logo">AXIOM</div>
        <p>{t("footer.copy")}</p>
        <div className="footer-links">
          <Link href="/privacy">{t("footer.privacy")}</Link>
          <Link href="/terms">{t("footer.terms")}</Link>
          <Link href="/faq">{t("footer.faq")}</Link>
          <Link href="/schools">{t("footer.forSchools")}</Link>
          <a href="mailto:support@axiom-solver.com">support@axiom-solver.com</a>
        </div>
      </footer>
    </>
  );
}

export default function SchoolsPage() {
  return <SchoolsContent />;
}
