"use client";

import {
  BarChart3,
  BookOpen,
  Calendar,
  LayoutDashboard,
  LineChart,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const navKeys = [
  { icon: LayoutDashboard, key: "dashboard", active: true },
  { icon: LineChart, key: "charts", active: false },
  { icon: Wallet, key: "portfolio", active: false },
  { icon: BookOpen, key: "journal", active: false },
  { icon: Calendar, key: "calendar", active: false },
  { icon: BarChart3, key: "analytics", active: false },
] as const;

export function Sidebar() {
  const t = useTranslations("nav");

  return (
    <>
      <aside className="hidden w-14 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        <nav className="flex flex-1 flex-col items-center gap-1 py-3">
          {navKeys.map(({ icon: Icon, key, active }) => (
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-[var(--surface)] lg:hidden">
        {navKeys.slice(0, 5).map(({ icon: Icon, key, active }) => (
          <button
            key={key}
            type="button"
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
              active ? "text-[var(--accent)]" : "text-[var(--muted)]"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            <span>{t(key)}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
