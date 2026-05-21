"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PersonalWatchlist } from "@/components/watchlist/PersonalWatchlist";
import { MacroPanel } from "./MacroPanel";
import { EconomicCalendar } from "./EconomicCalendar";
import { cn } from "@/lib/utils";

type Tab = "mine" | "macro";

interface RightPanelProps {
  variant?: "desktop" | "sheet";
  /** Close mobile sheet after selecting a symbol */
  onSymbolSelect?: () => void;
}

export function RightPanel({
  variant = "desktop",
  onSymbolSelect,
}: RightPanelProps) {
  const t = useTranslations("personalWatchlist");
  const tMarket = useTranslations("market");
  const [tab, setTab] = useState<Tab>("mine");
  const inSheet = variant === "sheet";

  return (
    <div className={cn("flex flex-col gap-2", !inSheet && "lg:gap-3")}>
      <div className="flex shrink-0 border border-[var(--border)] bg-[var(--surface-card)]">
        {(
          [
            { id: "mine" as const, label: t("title") },
            { id: "macro" as const, label: tMarket("macroTitle") },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition",
              tab === id
                ? "border-b-2 border-[var(--accent)] bg-[var(--surface-elevated)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "flex-1",
          inSheet ? "min-h-[200px]" : "min-h-[280px] lg:min-h-[320px]"
        )}
      >
        {tab === "mine" ? (
          <PersonalWatchlist
            mobile={inSheet}
            onSymbolSelect={onSymbolSelect}
          />
        ) : (
          <MacroPanel />
        )}
      </div>

      {!inSheet && <EconomicCalendar />}
    </div>
  );
}
