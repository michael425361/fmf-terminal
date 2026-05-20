"use client";

import { MacroTickerBar } from "@/components/market/MacroTickerBar";
import { MarketStatusStrip } from "@/components/market/MarketStatusStrip";

export function TopBar() {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
      <MarketStatusStrip />
      <MacroTickerBar />
    </div>
  );
}
