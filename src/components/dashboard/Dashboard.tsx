import { HeaderToolbar } from "./HeaderToolbar";
import { TradingChart } from "@/components/chart/TradingChart";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { RightPanel } from "./RightPanel";
import { MarketDetailPanel } from "./MarketDetailPanel";
import { AIMarketSummaryClient } from "./AIMarketSummaryClient";
import { TerminalBootLoader } from "@/components/brand/TerminalBootLoader";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { CommandPaletteProvider } from "@/providers/CommandPaletteProvider";
import { MarketDataProvider } from "@/providers/MarketDataProvider";
import { WatchlistProvider } from "@/providers/WatchlistProvider";
import { portfolioSnapshot } from "@/lib/mock-data";
import { cn, formatPrice } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export async function Dashboard() {
  const t = await getTranslations("header");
  const { totalValue, dayPnl, dayPnlPct } = portfolioSnapshot;
  const up = dayPnl >= 0;

  return (
    <MarketDataProvider>
      <WatchlistProvider>
        <CommandPaletteProvider>
        <TerminalBootLoader>
        <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
          <HeaderToolbar />
          <TopBar />

          <div className="flex min-h-0 flex-1">
            <Sidebar />

            <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-14 lg:pb-0">
              <div className="flex gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 md:hidden">
                <MobileStat
                  label={t("portfolio")}
                  value={`$${formatPrice(totalValue)}`}
                />
                <MobileStat
                  label={t("dayPnl")}
                  value={`${up ? "+" : ""}$${formatPrice(Math.abs(dayPnl))}`}
                  positive={up}
                  sub={`${up ? "+" : ""}${dayPnlPct.toFixed(2)}%`}
                />
              </div>

              <div className="scrollbar-thin grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-auto p-2 lg:grid-cols-12 lg:gap-3 lg:p-3">
                <div className="flex min-h-[320px] flex-col gap-2 lg:col-span-7 lg:gap-3">
                  <TradingChart />
                  <MarketDetailPanel />
                  <AIMarketSummaryClient />
                </div>

                <div className="lg:col-span-5">
                  <RightPanel />
                </div>
              </div>
            </main>
          </div>
        </div>
        <CommandPalette />
        </TerminalBootLoader>
        </CommandPaletteProvider>
      </WatchlistProvider>
    </MarketDataProvider>
  );
}

function MobileStat({
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
      <div className="flex items-baseline gap-1.5">
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
