"use client";

import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-2 flex items-center gap-1 text-[13px] print:hidden"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-3 w-3 text-[var(--color-dim)]" />
          )}
          {item.href && i < items.length - 1 ? (
            <Link
              href={item.href}
              className="text-orange-400 transition-colors hover:text-orange-300 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text-primary)] font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
