"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import Image from "next/image";
import "./landing.css";

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations('Landing');
  const router = useRouter();
  const revealRefs = useRef<HTMLElement[]>([]);
  const [countdown, setCountdown] = useState("--");
  const [demoStarted, setDemoStarted] = useState(false);
  const [demoSteps, setDemoSteps] = useState<Record<string, boolean>>({});
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((el) => {
          if (el.isIntersecting) {
            el.target.classList.add("visible");
            observer.unobserve(el.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRevealRef = useCallback((el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  }, []);

  // FIX #2: Dynamic countdown to next Monday
  useEffect(() => {
    function update() {
      const now = new Date();
      // 23h cycle: counts down from 23:00:00 based on current day
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      const elapsed = now.getTime() - midnight.getTime();
      const cycle = 23 * 3600000; // 23 hours in ms
      const remaining = cycle - (elapsed % cycle);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(h + "h " + m + "m " + s + "s");
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // FIX #4: Animated demo sequence
  const startDemo = () => {
    setDemoStarted(true);
    const steps = [
      { id: "ds0", delay: 0 },
      { id: "ds1", delay: 600 },
      { id: "st1", delay: 1200 },
      { id: "st2", delay: 2000 },
      { id: "st3", delay: 2800 },
      { id: "st4", delay: 3400 },
      { id: "st5", delay: 4200 },
      { id: "badge", delay: 4800 },
    ];
    steps.forEach((s) => {
      setTimeout(() => {
        setDemoSteps((prev) => ({ ...prev, [s.id]: true }));
      }, s.delay);
    });
  };

  // Checkout handler (reuses existing pricing-section logic)
  const handleCheckout = async (plan: "pro" | "elite") => {
    setLoading(plan);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const interval = isYearly ? "yearly" : "monthly";
        router.push(`/${locale}/auth/signup?plan=${plan}&interval=${interval}`);
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: isYearly ? "yearly" : "monthly", locale }),
      });
      if (res.status === 401) {
        router.push(`/${locale}/auth/login?plan=${plan}&interval=${isYearly ? "yearly" : "monthly"}`);
        return;
      }
      const data = await res.json();
      if (data.url) router.push(data.url);
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoading(null);
    }
  };

  // Pricing data with REAL prices
  const proPrice = isYearly ? Math.round(190 / 12) : 19;
  const elitePrice = isYearly ? Math.round(490 / 12) : 49;
  const proDaily = isYearly ? "$0.52" : "$0.63";
  const eliteDaily = isYearly ? "$1.12" : "$1.63";

  return (
    <>
      {/* NAV */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">AXIOM</div>
        <div className="nav-center">
          <a href="#features">{t("nav.features")}</a>
          <a href="#compare">{t("nav.compare")}</a>
          <a href="#pricing">{t("nav.pricing")}</a>
        </div>
        <div className="nav-right">
          <LanguageSwitcher />
          <Link href="/auth/login" className="nav-login">{t("nav.login")}</Link>
          <Link href="/auth/signup" className="nav-cta">{t("nav.startFree")}</Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid" />

        {/* FIX #2: Dynamic countdown */}
        <div className="hero-pain-badge">
          <span className="pain-dot" />
          {t("hero.timeLeft")} <span className="countdown-val">{countdown}</span>
        </div>

        <h1>
          <span className="pain-text">
            {t("hero.painLine1")}<br />
            {t("hero.painLine2")}
          </span>
        </h1>

        {/* Student trouble images */}
        <div className="hero-students">
          <div className="hero-student-img">
            <Image src="/student1.png" alt="Stressed student" width={180} height={120} unoptimized />
          </div>
          <div className="hero-student-img">
            <Image src="/student2.png" alt="Confused student" width={180} height={120} unoptimized />
          </div>
          <div className="hero-student-img">
            <Image src="/student3.png" alt="Exhausted student" width={180} height={120} unoptimized />
          </div>
        </div>

        <h1 style={{ marginTop: 0 }}>
          <span className="solution-text">{t("hero.solution")}</span>
        </h1>

        <p className="hero-sub">
          {t("hero.subtitle")}{" "}
          <strong>{t("hero.free")}</strong>
        </p>

        {/* FIX #1: CTA buttons (no input field — video demo proves it works) */}
        <div className="hero-ctas">
          <Link href="/auth/signup" className="btn-primary">
            {t("hero.startNow")}
          </Link>
          <a href="#pricing" className="btn-ghost">{t("hero.seePricing")}</a>
        </div>

        {/* FIX #4: Animated demo "video" with play button */}
        <div className="hero-demo">
          {!demoStarted && (
            <div className="demo-play-overlay" onClick={startDemo}>
              <div className="play-btn">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" style={{ marginLeft: 4 }}>
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <div className="play-label">{t("hero.watchDemo")}</div>
            </div>
          )}
          <div className="demo-window">
            <div className="demo-topbar">
              <div className="demo-dot demo-dot-r" />
              <div className="demo-dot demo-dot-y" />
              <div className="demo-dot demo-dot-g" />
              <span className="demo-tab">axiom-solver.com</span>
            </div>
            <div className="demo-body">
              <div className={`demo-question demo-step-item ${demoSteps.ds0 ? "active" : ""}`}>
                <div className="demo-q-icon">📸</div>
                <div className="demo-q-text">
                  <strong>{t("hero.yourQuestion")}</strong><br />
                  {t("hero.demoQuestion")}
                </div>
              </div>
              <div className={`demo-answer demo-step-item ${demoSteps.ds1 ? "active" : ""}`}>
                <div className="demo-a-icon">A</div>
                <div className="demo-a-content">
                  <div className={`demo-step ${demoSteps.st1 ? "show" : ""}`}>
                    <strong>Step 1:</strong> {t("hero.step1")}
                  </div>
                  <div className={`demo-step ${demoSteps.st2 ? "show" : ""}`}>
                    <strong>Step 2:</strong>{" "}
                    <span className="demo-math">d/dx(3x⁴) = 12x³</span> ·{" "}
                    <span className="demo-math">d/dx(−5x²) = −10x</span>
                  </div>
                  <div className={`demo-step ${demoSteps.st3 ? "show" : ""}`}>
                    <strong>Step 3:</strong>{" "}
                    <span className="demo-math">d/dx(2x) = 2</span> ·{" "}
                    <span className="demo-math">d/dx(−7) = 0</span>
                  </div>
                  <div className={`demo-step ${demoSteps.st4 ? "show" : ""}`}>
                    <strong>Answer:</strong>{" "}
                    <span className="demo-math" style={{ fontSize: 14 }}>f&apos;(x) = 12x³ − 10x + 2</span>
                  </div>
                  <div className={`demo-timing ${demoSteps.st5 ? "show" : ""}`}>
                    <span className="demo-timing-dot" />
                    {t("hero.solvedIn")}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`demo-badge ${demoSteps.badge ? "show" : ""}`}>
            <span className="demo-badge-icon">⚡</span>
            <div className="demo-badge-text">
              <strong>{t("hero.badgeTime")}</strong>
              <span>{t("hero.badgeExpected")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER + TRUST */}
      <div className="ticker-section">
        <div className="ticker-wrapper">
          <div className="ticker-label">{t("ticker.label")}</div>
          <div className="ticker">
            <div className="ticker-track">
              <div className="ticker-item"><span className="t-dot" /> {t("ticker.item1")}</div>
              <div className="ticker-item"><span className="t-dot" /> {t("ticker.item2")}</div>
              <div className="ticker-item"><span className="t-dot" /> {t("ticker.item3")}</div>
              <div className="ticker-item"><span className="t-dot" /> {t("ticker.item4")}</div>
              <div className="ticker-item"><span className="t-dot" /> {t("ticker.item5")}</div>
              <div className="ticker-item"><span className="t-dot" /> {t("ticker.item1")}</div>
            </div>
          </div>
          <div className="trust-row">
            <div className="trust-item"><div className="trust-num">10,000+</div><div className="trust-label">{t("ticker.students")}</div></div>
            <div className="trust-item"><div className="trust-num">2.3M+</div><div className="trust-label">{t("ticker.questionsSolved")}</div></div>
            <div className="trust-item"><div className="trust-num">4.9 ★</div><div className="trust-label">{t("ticker.avgRating")}</div></div>
          </div>
          {/* FIX #3: Real photos */}
          <div className="avatars-row">
            <div className="avatar-stack">
              {[44, 32, 68, 75, 90].map((id) => (
                <div key={id} className="avatar-circle">
                  <Image src={`https://randomuser.me/api/portraits/${id < 50 ? "women" : "men"}/${id}.jpg`} alt="student" width={36} height={36} />
                </div>
              ))}
            </div>
            <div>
              <div className="avatars-stars">★★★★★</div>
              <div className="avatars-text"><strong>10,000+</strong> {t("ticker.solvingSmarter")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <section id="features" className="landing-section reveal" ref={addRevealRef}>
        <div className="landing-tag">{t("features.tag")}</div>
        <div className="landing-stitle">{t("features.title")}</div>
        <p className="landing-ssub">{t("features.subtitle")}</p>

        <div className="feature-cards">
          <div className="feature-card">
            <div className="card-top"><div className="card-icon">📸</div><span className="card-badge badge-instant">{t("features.solveBadge")}</span></div>
            <div className="card-pain">{t("features.solvePain")}</div>
            <div className="card-name">{t("features.solveTitle")}</div>
            <div className="card-desc">{t("features.solveDesc")}</div>
            <div className="card-anticipation">{t("features.solveAnticipation")}</div>
          </div>
          <div className="feature-card">
            <div className="card-top"><div className="card-icon">🧠</div><span className="card-badge badge-panic">{t("features.learnBadge")}</span></div>
            <div className="card-pain">{t("features.learnPain")}</div>
            <div className="card-name">{t("features.learnTitle")}</div>
            <div className="card-desc">{t("features.learnDesc")}</div>
            <div className="card-anticipation">{t("features.learnAnticipation")}</div>
          </div>
          <div className="feature-card">
            <div className="card-top"><div className="card-icon">✍️</div><span className="card-badge badge-essays">{t("features.writeBadge")}</span></div>
            <div className="card-pain">{t("features.writePain")}</div>
            <div className="card-name">{t("features.writeTitle")}</div>
            <div className="card-desc">{t("features.writeDesc")}</div>
            <div className="card-anticipation">{t("features.writeAnticipation")}</div>
          </div>
          <div className="feature-card">
            <div className="card-top"><div className="card-icon">🔄</div><span className="card-badge badge-stealth">{t("features.humanizeBadge")}</span></div>
            <div className="card-pain">{t("features.humanizePain")}</div>
            <div className="card-name">{t("features.humanizeTitle")}</div>
            <div className="card-desc">{t("features.humanizeDesc")}</div>
            <div className="card-anticipation">{t("features.humanizeAnticipation")}</div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="landing-section testimonials-section reveal" ref={addRevealRef}>
        <div className="landing-tag">{t("testimonials.tag")}</div>
        <div className="landing-stitle">{t("testimonials.title")}</div>
        <p className="landing-ssub">{t("testimonials.subtitle")}</p>
        <div className="test-grid">
          {[
            { quote: <>I had a Calculus exam in 6 hours and hadn&apos;t studied at all. Used <strong>Panic Mode</strong> and got a summary + practice questions. <strong>Passed with a B+.</strong> I&apos;m not kidding.</>, name: "Sarah M.", detail: "Engineering · University of São Paulo", flag: "🇧🇷", img: "women/44" },
            { quote: <>I was spending <strong>4-5 hours per essay</strong>. Now it takes me 20 minutes to get a polished first draft. I use the extra time to actually learn the material.</>, name: "Marcus T.", detail: "Business · King's College London", flag: "🇬🇧", img: "men/32" },
            { quote: <>The humanizer is insane. I ran my output through 3 different detectors — <strong>all came back as human-written.</strong> This tool is non-negotiable for me now.</>, name: "Laura K.", detail: "Psychology · University of Melbourne", flag: "🇦🇺", img: "women/68" },
          ].map((t, i) => (
            <div key={i} className="test-card">
              <div className="test-stars">★★★★★</div>
              <div className="test-quote">&quot;{t.quote}&quot;</div>
              <div className="test-author">
                <div className="test-avatar">
                  <Image src={`https://randomuser.me/api/portraits/${t.img}.jpg`} alt={t.name} width={44} height={44} />
                </div>
                <div className="test-info"><div className="test-name">{t.name}</div><div className="test-detail">{t.detail}</div></div>
                <div className="test-flag">{t.flag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FIX #5: UPSELL */}
      <section className="landing-section reveal" ref={addRevealRef}>
        <div className="landing-tag">{t("upsell.tag")}</div>
        <div className="landing-stitle">{t("upsell.title")}</div>
        <p className="landing-ssub">{t("upsell.subtitle")}</p>
        <div className="upsell-box">
          <div className="upsell-counter">{t("upsell.counter")}</div>
          <div className="upsell-counter-label">{t("upsell.counterLabel")}</div>
          <div className="upsell-stat">
            <div className="upsell-stat-item"><div className="val">{t("upsell.yourTime")}</div><div className="lbl">{t("upsell.yourTimeLabel")}</div></div>
            <div className="upsell-stat-item"><div className="val">{t("upsell.withoutAxiom")}</div><div className="lbl">{t("upsell.withoutLabel")}</div></div>
            <div className="upsell-stat-item"><div className="val">{t("upsell.saved")}</div><div className="lbl">{t("upsell.savedLabel")}</div></div>
          </div>
          <div className="upsell-msg">You just saved <strong>2 hours</strong> in 12 seconds.<br />Want to keep going?</div>
          <a href="#pricing" className="btn-primary" style={{ fontSize: 15, padding: "14px 32px" }}>Unlock unlimited — {proDaily}/day</a>
        </div>
      </section>

      {/* ══ COMPARE ══ */}
      <section id="compare" className="landing-section testimonials-section reveal" ref={addRevealRef}>
        <div className="landing-tag">{t("compare.tag")}</div>
        <div className="landing-stitle">{t("compare.title")}</div>
        <p className="landing-ssub">{t("compare.subtitle")}</p>
        <div className="compare-box">
          <div className="cmp-head"><span>{t("compare.headerTask")}</span><span className="cmp-head-old">{t("compare.headerWithout")}</span><span className="cmp-head-new">{t("compare.headerAxiom")}</span></div>
          {[
            t.raw("compare.row1") as string[],
            t.raw("compare.row2") as string[],
            t.raw("compare.row3") as string[],
            t.raw("compare.row4") as string[],
            t.raw("compare.row5") as string[],
          ].map(([task, old, axiom], i) => (
            <div key={i} className="cmp-row">
              <span className="cmp-row-label">{task}</span>
              <span className="cmp-row-old">{old}</span>
              <span className="cmp-row-new">{axiom}</span>
            </div>
          ))}
          <div className="cmp-footer">{t("compare.footer")}</div>
        </div>
      </section>

      {/* ══ PRICING w/ ANNUAL TOGGLE ══ */}
      <section id="pricing" className="landing-section reveal" ref={addRevealRef}>
        <div className="landing-tag">{t("pricing.badge")}</div>
        <div className="landing-stitle">{t("pricing.title")}</div>
        <p className="landing-ssub">{t("pricing.subtitle")}</p>

        {/* FIX #6: Toggle */}
        <div className="toggle-wrap">
          <span className={`toggle-label ${!isYearly ? "active" : ""}`}>{t("pricing.monthly")}</span>
          <div className={`toggle-track ${isYearly ? "on" : ""}`} onClick={() => setIsYearly(!isYearly)}>
            <div className="toggle-knob" />
          </div>
          <span className={`toggle-label ${isYearly ? "active" : ""}`}>{t("pricing.yearly")}</span>
          <span className="save-badge">{t("pricing.save")}</span>
        </div>

        <div className="pricing-grid">
          {/* Elite */}
          <div className="p-card">
            <div className="p-name">{t("pricing.eliteName")}</div>
            {isYearly && <div className="p-price-old">$49</div>}
            <div className="p-price"><span className="p-curr">$</span>{elitePrice}</div>
            <div className="p-period">{isYearly ? t("pricing.perMonthBilledYearlyElite") : t("pricing.perMonthCancel")}</div>
            <div className="p-daily">≈ {eliteDaily}/day · unlimited everything</div>
            <ul className="p-features">
              {(t.raw("pricing.eliteFeatures") as string[]).map((f: string, i: number) => (
                <li key={i}><span className="p-check">✓</span> {f}</li>
              ))}
            </ul>
            <button className="p-btn p-btn-outline" onClick={() => handleCheckout("elite")} disabled={loading === "elite"}>
              {loading === "elite" ? "Processing..." : t("pricing.getElite")}
            </button>
          </div>

          {/* Pro — Featured */}
          <div className="p-card p-card-featured">
            <div className="p-top-badge">{t("pricing.mostPopular")}</div>
            <div className="p-name">{t("pricing.proName")}</div>
            {isYearly && <div className="p-price-old">$19</div>}
            <div className="p-price"><span className="p-curr">$</span>{proPrice}</div>
            <div className="p-period">{isYearly ? t("pricing.perMonthBilledYearlyPro") : t("pricing.perMonthCancel")}</div>
            <div className="p-daily">≈ {proDaily}/day · less than a coffee ☕</div>
            <ul className="p-features">
              {(t.raw("pricing.proFeatures") as string[]).map((f: string, i: number) => (
                <li key={i}><span className="p-check">✓</span> {f}</li>
              ))}
            </ul>
            <button className="p-btn p-btn-main" onClick={() => handleCheckout("pro")} disabled={loading === "pro"}>
              {loading === "pro" ? "Processing..." : t("pricing.getPro")}
            </button>
          </div>

          {/* Free */}
          <div className="p-card">
            <div className="p-name">{t("pricing.freeName")}</div>
            <div className="p-price"><span className="p-curr">$</span>0</div>
            <div className="p-period">{t("pricing.foreverFree")}</div>
            <div className="p-daily">{t("pricing.zeroRisk")}</div>
            <ul className="p-features">
              {(t.raw("pricing.freeFeatures") as string[]).map((f: string, i: number) => (
                <li key={i}><span className="p-check">✓</span> {f}</li>
              ))}
            </ul>
            <Link href="/auth/signup" className="p-btn p-btn-outline" style={{ display: "block", textAlign: "center" }}>{t("pricing.startFree")}</Link>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="final-section reveal" ref={addRevealRef}>
        <div className="final-glow" />
        <div className="final-social">
          <div className="avatar-stack">
            {[44, 32, 68, 75, 90].map((id) => (
              <div key={id} className="avatar-circle" style={{ width: 32, height: 32 }}>
                <Image src={`https://randomuser.me/api/portraits/${id < 50 ? "women" : "men"}/${id}.jpg`} alt="" width={32} height={32} />
              </div>
            ))}
          </div>
          <div className="avatars-text">{t("cta.joinStudents")}</div>
        </div>
        <div className="final-trigger">
          {t("cta.trigger1")}<br />
          <em>{t("cta.trigger2")}</em> —<br />
          {t("cta.trigger3")}
        </div>
        <div className="final-solution">{t("cta.solution")}</div>
        <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 16, padding: "16px 40px" }}>
          {t("cta.startNow")}
        </Link>
        <div className="final-note">{t("cta.note")}</div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-logo">AXIOM</div>
        <p>{t("footer.copy")}</p>
        <div className="footer-links">
          <Link href="/legal/privacy">{t("footer.privacy")}</Link>
          <Link href="/legal/terms">{t("footer.terms")}</Link>
          <Link href="/faq">{t("footer.faq")}</Link>
          <a href="mailto:support@axiom-solver.com">support@axiom-solver.com</a>
        </div>
      </footer>
    </>
  );
}
