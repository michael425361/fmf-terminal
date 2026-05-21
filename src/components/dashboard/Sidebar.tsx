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
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { cn } from "@/lib/utils";

const desktopNavKeys = [
  { icon: LayoutDashboard, key: "dashboard", active: true },
  { icon: LineChart, key: "charts", active: false },
  { icon: Wallet, key: "portfolio", active: false },
  { icon: BookOpen, key: "journal", active: false },
  { icon: Calendar, key: "calendar", active: false },
  { icon: BarChart3, key: "analytics", active: false },
] as const;

const mobileNavKeys = [
  { icon: LayoutDashboard, key: "dashboard", active: true },
  { icon: LineChart, key: "charts", active: false },
  { icon: List, key: "watchlist", active: false, opensWatchlist: true },
  { icon: BookOpen, key: "journal", active: false },
  { icon: Calendar, key: "calendar", active: false },
] as const;

export function Sidebar() {
  const t = useTranslations("nav");
  const { watchlistOpen, openWatchlist, closeWatchlist } = useMobileLayout();

  return (
    <>
      <aside className="hidden w-14 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        <nav className="flex flex-1 flex-col items-center gap-1 py-3">
          {desktopNavKeys.map(({ icon: Icon, key, active }) => (
            <button
              key={key}
              type="button"
              title={t(key)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded transition",
                active
                  ? "bg-[var(--accent-dim)]/30 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          ))}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        {mobileNavKeys.map((item) => {
          const { icon: Icon, key, active } = item;
          const opensWatchlist =
            "opensWatchlist" in item && item.opensWatchlist;
          const isWatchlistActive = opensWatchlist && watchlistOpen;

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (opensWatchlist) {
                  if (watchlistOpen) closeWatchlist();
                  else openWatchlist();
                }
              }}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition",
                isWatchlistActive || (active && !opensWatchlist)
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)]"
              )}
              aria-expanded={opensWatchlist ? watchlistOpen : undefined}
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
