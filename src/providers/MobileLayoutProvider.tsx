"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface MobileLayoutContextValue {
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
  const [chartFullscreen, setChartFullscreen] = useState(false);

  const openChartFullscreen = useCallback(() => setChartFullscreen(true), []);
  const closeChartFullscreen = useCallback(() => setChartFullscreen(false), []);

  const toggleChartFullscreen = useCallback(
    () => setChartFullscreen((on) => !on),
    []
  );

  const value = useMemo(
    () => ({
      chartFullscreen,
      openChartFullscreen,
      closeChartFullscreen,
      toggleChartFullscreen,
    }),
    [
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
