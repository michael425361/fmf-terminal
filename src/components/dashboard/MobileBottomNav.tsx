"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  isNavActive,
  primaryNavItems,
  secondaryNavItems,
  type AppNavHref,
} from "@/lib/navigation/items";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { chartFullscreen } = useMobileLayout();

  return (
    <>
      <aside className="hidden w-14 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        <nav
          className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3 scrollbar-thin"
          aria-label={t("home")}
        >
          {primaryNavItems.map(({ icon: Icon, key, href }) => {
            if (!href) return null;
            const active = isNavActive(pathname, href, key);
            return (
              <Link
                key={key}
                href={href}
                title={t(key)}
                aria-label={t(key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded transition",
                  active
                    ? "bg-[var(--accent-dim)]/30 text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </Link>
            );
          })}
          <div className="my-1 h-px w-8 bg-[var(--border)]" aria-hidden />
          {secondaryNavItems.map(({ icon: Icon, key }) => (
            <button
              key={key}
              type="button"
              disabled
              title={`${t(key)} (soon)`}
              className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded text-[var(--muted)]/40"
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
        {primaryNavItems.map(({ icon: Icon, key, href }) => {
          if (!href) return null;
          const active = isNavActive(pathname, href as AppNavHref, key);
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition",
                active ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
              aria-label={t(key)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
