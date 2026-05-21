import { DashboardFrame } from "./DashboardFrame";
import { DashboardMain } from "./DashboardMain";
import { TerminalBootLoader } from "@/components/brand/TerminalBootLoader";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { CommandPaletteProvider } from "@/providers/CommandPaletteProvider";
import { MarketDataProvider } from "@/providers/MarketDataProvider";
import { WatchlistProvider } from "@/providers/WatchlistProvider";
import { MobileLayoutProvider } from "@/providers/MobileLayoutProvider";

export async function Dashboard() {
  return (
    <MarketDataProvider>
      <WatchlistProvider>
        <MobileLayoutProvider>
          <CommandPaletteProvider>
            <TerminalBootLoader>
              <DashboardFrame main={<DashboardMain />} />
              <CommandPalette />
            </TerminalBootLoader>
          </CommandPaletteProvider>
        </MobileLayoutProvider>
      </WatchlistProvider>
    </MarketDataProvider>
  );
}
