"use client";

import { TerminalBootLoader } from "@/components/brand/TerminalBootLoader";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { CommandPaletteProvider } from "@/providers/CommandPaletteProvider";
import { MarketDataProvider } from "@/providers/MarketDataProvider";
import { MobileLayoutProvider } from "@/providers/MobileLayoutProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { WatchlistProvider } from "@/providers/WatchlistProvider";

export function TerminalProviders({
  children,
  commandPalette = true,
}: {
  children: React.ReactNode;
  /** Command palette is dashboard-only */
  commandPalette?: boolean;
}) {
  return (
    <AuthProvider>
      <MarketDataProvider>
        <WatchlistProvider>
        <MobileLayoutProvider>
          <CommandPaletteProvider>
            <TerminalBootLoader>
              {children}
              {commandPalette && <CommandPalette />}
            </TerminalBootLoader>
          </CommandPaletteProvider>
        </MobileLayoutProvider>
        </WatchlistProvider>
      </MarketDataProvider>
    </AuthProvider>
  );
}
