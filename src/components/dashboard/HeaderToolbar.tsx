"use client";

import { Bell, Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand/BrandMark";
import { portfolioSnapshot } from "@/lib/mock-data";
import { cn, formatPrice } from "@/lib/utils";
import { useCommandPalette } from "@/providers/CommandPaletteProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function HeaderToolbar() {
  const t = useTranslations("header");
  const tPalette = useTranslations("commandPalette");
  const { openPalette } = useCommandPalette();
  const { totalValue, dayPnl, dayPnlPct } = portfolioSnapshot;
  const up = dayPnl >= 0;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-4">
      <div className="flex items-center gap-3 sm:gap-6">
        <BrandMark className="hidden sm:flex" />
        <BrandMark compact className="sm:hidden" />
        <div className="hidden items-center gap-4 border-l border-[var(--border)] pl-4 md:flex">
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
        <div className="ml-1 hidden h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[10px] font-bold text-[var(--accent)] sm:flex">
          M
        </div>
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
