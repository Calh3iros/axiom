"use client";

import { ClipboardCheck, BarChart3, Users, Shield, FlaskConical } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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

  const isActive = (href: string) => {
    const clean = pathname.replace(/^\/[a-z]{2}/, "");
    if (href === "/admin") return clean === "/admin" || clean === "/admin/approvals";
    return clean.startsWith(href);
  };

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Shield className="admin-logo-icon" />
          <span className="admin-logo-text">Axiom Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`admin-nav-item ${isActive(item.href) ? "active" : ""}`}
            >
              <item.icon className="admin-nav-icon" />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/map" className="admin-back-link">
            ← {t("backToApp")}
          </Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>

      <style>{`
        .admin-root {
          display: flex;
          min-height: 100vh;
          background: #0a0a0f;
          color: #e2e8f0;
          font-family: 'Inter', system-ui, sans-serif;
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
      `}</style>
    </div>
  );
}
