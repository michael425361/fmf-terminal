"use client";

import { TradingChart } from "@/components/chart/TradingChart";
import { RightPanel } from "./RightPanel";
import { MarketDetailPanel } from "./MarketDetailPanel";
import { AIMarketSummaryClient } from "./AIMarketSummaryClient";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { cn } from "@/lib/utils";

export function DashboardMain() {
  const { chartFullscreen } = useMobileLayout();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 pb-14 lg:grid lg:grid-cols-12 lg:gap-3 lg:overflow-auto lg:p-3 lg:pb-3",
        chartFullscreen && "p-0 pb-0"
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 lg:col-span-7 lg:min-h-[320px] lg:flex-none lg:gap-3">
        <TradingChart className="min-h-0 flex-1" />
        <div className="hidden shrink-0 flex-col gap-2 lg:flex lg:gap-3">
          <MarketDetailPanel />
          <AIMarketSummaryClient />
        </div>
      </div>

      <div className="hidden lg:col-span-5 lg:block">
        <RightPanel />
      </div>
    </div>
  );
}
