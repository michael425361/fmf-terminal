"use client";

import { Bell, Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthButton } from "@/components/auth/AuthButton";
import { BrandMark } from "@/components/brand/BrandMark";
import { Link, usePathname } from "@/i18n/navigation";
import { headerNavItems, isNavActive } from "@/lib/navigation/items";
import { portfolioSnapshot } from "@/lib/mock-data";
import { cn, formatPrice } from "@/lib/utils";
import { useCommandPalette } from "@/providers/CommandPaletteProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function HeaderToolbar() {
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const tPalette = useTranslations("commandPalette");
  const pathname = usePathname();
  const { openPalette } = useCommandPalette();
  const { totalValue, dayPnl, dayPnlPct } = portfolioSnapshot;
  const up = dayPnl >= 0;

  return (
    <header className="relative z-50 flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-4">
      <div className="flex items-center gap-3 sm:gap-6">
        <BrandMark className="hidden sm:flex" />
        <BrandMark compact className="sm:hidden" />
        <nav
          className="hidden items-center gap-1 border-l border-[var(--border)] pl-3 md:flex lg:gap-2 lg:pl-4"
          aria-label={tNav("dashboard")}
        >
          {headerNavItems.map(({ key, href }) => {
            const active = isNavActive(pathname, href, key);
            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition",
                  active
                    ? "bg-[var(--accent-dim)]/30 text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {tNav(key)}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-4 border-l border-[var(--border)] pl-4 xl:flex">
          <Stat label={t("portfolio")} value={`$${formatPrice(totalValue)}`} />
          <Stat
            label={t("dayPnl")}
            value={`${up ? "+" : ""}$${formatPrice(Math.abs(dayPnl))}`}
            sub={`${up ? "+" : ""}${dayPnlPct.toFixed(2)}%`}
            positive={up}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={openPalette}
          className="hidden items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] hover:shadow-[inset_0_0_20px_rgba(245,158,11,0.06)] md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>{t("search")}</span>
          <kbd className="ml-2 rounded bg-[var(--background)] px-1.5 py-0.5 font-mono text-[10px]">
            /
          </kbd>
          <kbd className="rounded bg-[var(--background)] px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={openPalette}
          className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] md:hidden"
          aria-label={tPalette("title")}
        >
          <Search className="h-4 w-4" />
        </button>
        <LanguageSwitcher />
        <IconButton icon={Bell} />
        <IconButton icon={Settings} />
        <AuthButton className="relative z-[60] ml-1 shrink-0" />
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-medium">{value}</span>
        {sub && (
          <span
            className={cn(
              "font-mono text-xs",
              positive ? "text-[var(--positive)]" : "text-[var(--negative)]"
            )}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function IconButton({ icon: Icon }: { icon: typeof Bell }) {
  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded border border-transparent text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
