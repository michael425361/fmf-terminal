"use client";

import { TradingChart } from "@/components/chart/TradingChart";
import { RightPanel } from "./RightPanel";
import { MarketDetailPanel } from "./MarketDetailPanel";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { cn } from "@/lib/utils";

export function DashboardMain() {
  const { chartFullscreen } = useMobileLayout();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 p-2 lg:grid lg:grid-cols-12 lg:items-start lg:gap-3 lg:p-3",
        chartFullscreen && "h-full min-h-0 p-0 lg:p-0"
      )}
    >
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-col gap-2 lg:col-span-7 lg:gap-3",
          chartFullscreen
            ? "h-full min-h-0 flex-1"
            : "min-h-[min(72dvh,640px)] lg:min-h-0"
        )}
      >
        <TradingChart
          className={cn(
            "min-h-0 flex-1",
            chartFullscreen && "min-h-0 flex-1"
          )}
        />
        <div className="hidden shrink-0 lg:block">
          <MarketDetailPanel />
        </div>
      </div>

      <div
        className={cn(
          "hidden lg:col-span-5 lg:block",
          chartFullscreen && "lg:hidden"
        )}
      >
        <RightPanel />
      </div>
    </div>
  );
}
