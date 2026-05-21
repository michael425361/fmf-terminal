"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import {
  consumeScrollChartTop,
  scrollToAppTop,
} from "@/lib/scroll-to-top";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";

/**
 * Resets scroll when the active symbol changes or when returning to the chart page.
 * Skips while chart fullscreen is active.
 */
export function useActiveSymbolScrollReset() {
  const pathname = usePathname();
  const { chartFullscreen } = useMobileLayout();
  const { activeId, hydrated } = useWatchlist();
  const prevActiveIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || chartFullscreen || pathname !== "/") {
      if (pathname !== "/" && activeId) {
        prevActiveIdRef.current = activeId;
      }
      return;
    }

    if (consumeScrollChartTop()) {
      scrollToAppTop({ smooth: true });
      prevActiveIdRef.current = activeId;
      return;
    }

    const prev = prevActiveIdRef.current;
    if (prev !== null && activeId !== null && prev !== activeId) {
      scrollToAppTop({ smooth: true });
    }

    prevActiveIdRef.current = activeId;
  }, [activeId, hydrated, chartFullscreen, pathname]);
}
