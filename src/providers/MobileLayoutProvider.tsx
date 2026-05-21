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

  const openWatchlist = useCallback(() => setWatchlistOpen(true), []);
  const closeWatchlist = useCallback(() => setWatchlistOpen(false), []);
  const toggleWatchlist = useCallback(
    () => setWatchlistOpen((o) => !o),
    []
  );

  const value = useMemo(
    () => ({
      watchlistOpen,
      openWatchlist,
      closeWatchlist,
      toggleWatchlist,
    }),
    [watchlistOpen, openWatchlist, closeWatchlist, toggleWatchlist]
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
