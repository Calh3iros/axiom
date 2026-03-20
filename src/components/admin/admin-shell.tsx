"use client";

import { ClipboardCheck, BarChart3, Users, FlaskConical, Menu, X, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/routing";

const navItems = [
  { key: "approvals", href: "/admin", icon: ClipboardCheck },
  { key: "platform", href: "/admin/platform", icon: BarChart3 },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "seedDemo", href: "/admin/seed-demo", icon: FlaskConical },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    const clean = pathname.replace(/^\/[a-z]{2}/, "");
    if (href === "/admin") return clean === "/admin" || clean === "/admin/approvals";
    return clean.startsWith(href);
  };

  return (
    <div className="admin-root">
      {/* Mobile header — visible only on small screens */}
      <div className="admin-mobile-header">
        <div className="admin-mobile-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield style={{ width: 20, height: 20, color: "#818cf8" }} />
            <span className="admin-logo-text">Axiom Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="admin-hamburger"
          >
            {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <Shield className="admin-logo-icon" />
          <span className="admin-logo-text">Axiom Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`admin-nav-item ${isActive(item.href) ? "active" : ""}`}
            >
              <item.icon className="admin-nav-icon" />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/map" className="admin-back-link" onClick={() => setMobileMenuOpen(false)}>
            ← {t("backToApp")}
          </Link>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="admin-main">{children}</main>

      <style>{`
        .admin-root {
          display: flex;
          min-height: 100vh;
          background: #0a0a0f;
          color: #e2e8f0;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .admin-mobile-header {
          display: none;
        }
        .admin-sidebar {
          width: 240px;
          background: #12121a;
          border-right: 1px solid #1e1e2e;
          display: flex;
          flex-direction: column;
          padding: 0;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
        }
        .admin-sidebar-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #1e1e2e;
        }
        .admin-logo-icon {
          width: 24px;
          height: 24px;
          color: #818cf8;
        }
        .admin-logo-text {
          font-size: 16px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }
        .admin-nav {
          flex: 1;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .admin-nav-item:hover {
          background: #1e1e2e;
          color: #e2e8f0;
        }
        .admin-nav-item.active {
          background: linear-gradient(135deg, #312e81, #1e1b4b);
          color: #c7d2fe;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.15);
        }
        .admin-nav-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .admin-sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid #1e1e2e;
        }
        .admin-back-link {
          color: #64748b;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.15s;
        }
        .admin-back-link:hover {
          color: #94a3b8;
        }
        .admin-main {
          flex: 1;
          margin-left: 240px;
          padding: 32px;
          min-height: 100vh;
        }
        .admin-hamburger {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .admin-hamburger:hover {
          color: #e2e8f0;
          background: #1e1e2e;
        }
        .admin-backdrop {
          display: none;
        }

        /* ── MOBILE: sidebar collapses ── */
        @media (max-width: 768px) {
          .admin-mobile-header {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            background: #12121a;
            border-bottom: 1px solid #1e1e2e;
          }
          .admin-mobile-header-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
          }
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.2s ease-in-out;
            z-index: 60;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 0;
            padding: 16px;
            padding-top: 72px;
          }
          .admin-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 55;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
          }
        }
      `}</style>
    </div>
  );
}
