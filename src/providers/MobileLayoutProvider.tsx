"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface MobileLayoutContextValue {
  watchlistOpen: boolean;
  openWatchlist: () => void;
  closeWatchlist: () => void;
  toggleWatchlist: () => void;
  chartFullscreen: boolean;
  openChartFullscreen: () => void;
  closeChartFullscreen: () => void;
  toggleChartFullscreen: () => void;
}

const MobileLayoutContext = createContext<MobileLayoutContextValue | null>(
  null
);

export function MobileLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [chartFullscreen, setChartFullscreen] = useState(false);

  const openWatchlist = useCallback(() => setWatchlistOpen(true), []);
  const closeWatchlist = useCallback(() => setWatchlistOpen(false), []);
  const toggleWatchlist = useCallback(
    () => setWatchlistOpen((o) => !o),
    []
  );

  const openChartFullscreen = useCallback(() => {
    setWatchlistOpen(false);
    setChartFullscreen(true);
  }, []);

  const closeChartFullscreen = useCallback(() => setChartFullscreen(false), []);

  const toggleChartFullscreen = useCallback(
    () =>
      setChartFullscreen((on) => {
        if (!on) setWatchlistOpen(false);
        return !on;
      }),
    []
  );

  const value = useMemo(
    () => ({
      watchlistOpen,
      openWatchlist,
      closeWatchlist,
      toggleWatchlist,
      chartFullscreen,
      openChartFullscreen,
      closeChartFullscreen,
      toggleChartFullscreen,
    }),
    [
      watchlistOpen,
      openWatchlist,
      closeWatchlist,
      toggleWatchlist,
      chartFullscreen,
      openChartFullscreen,
      closeChartFullscreen,
      toggleChartFullscreen,
    ]
  );

  return (
    <MobileLayoutContext.Provider value={value}>
      {children}
    </MobileLayoutContext.Provider>
  );
}

export function useMobileLayout() {
  const ctx = useContext(MobileLayoutContext);
  if (!ctx) {
    throw new Error("useMobileLayout must be used within MobileLayoutProvider");
  }
  return ctx;
}
