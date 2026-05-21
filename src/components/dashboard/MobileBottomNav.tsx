"use client";

import {
  BarChart3,
  BookOpen,
  Calendar,
  LayoutDashboard,
  LineChart,
  List,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { icon: LayoutDashboard, key: "dashboard", href: "/" as const },
  { icon: LineChart, key: "charts", href: "/" as const },
  { icon: List, key: "watchlist", href: "/watchlist" as const },
  { icon: BookOpen, key: "journal", href: null },
  { icon: Calendar, key: "calendar", href: null },
] as const;

const desktopNavKeys = [
  { icon: LayoutDashboard, key: "dashboard" },
  { icon: LineChart, key: "charts" },
  { icon: Wallet, key: "portfolio" },
  { icon: BookOpen, key: "journal" },
  { icon: Calendar, key: "calendar" },
  { icon: BarChart3, key: "analytics" },
] as const;

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { chartFullscreen } = useMobileLayout();

  const isActive = (href: string | null) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside className="hidden w-14 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        <nav className="flex flex-1 flex-col items-center gap-1 py-3">
          {desktopNavKeys.map(({ icon: Icon, key }) => (
            <button
              key={key}
              type="button"
              title={t(key)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded transition",
                key === "dashboard"
                  ? "bg-[var(--accent-dim)]/30 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          ))}
        </nav>
      </aside>

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom,0px)] transition-all duration-300 lg:hidden",
          chartFullscreen &&
            "pointer-events-none translate-y-full opacity-0"
        )}
        aria-hidden={chartFullscreen}
      >
        {mobileNavItems.map(({ icon: Icon, key, href }) => {
          const active = href ? isActive(href) : false;
          const className = cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition",
            active ? "text-[var(--accent)]" : "text-[var(--muted)]"
          );

          if (href) {
            return (
              <Link
                key={key}
                href={href}
                className={className}
                aria-label={t(key)}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{t(key)}</span>
              </Link>
            );
          }

          return (
            <button
              key={key}
              type="button"
              className={className}
              aria-label={t(key)}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span>{t(key)}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
