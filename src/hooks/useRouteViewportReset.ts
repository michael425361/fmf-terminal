"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { scrollToAppTop } from "@/lib/scroll-to-top";

/** Blur focused fields so iOS Safari does not keep an input-zoom scale after navigation. */
function blurActiveElement(): void {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el !== document.body) {
    el.blur();
  }
}

/**
 * Stabilize viewport on client-side route changes (News / Community / Watchlist / Home).
 */
export function useRouteViewportReset() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === null || prev === pathname) return;

    blurActiveElement();
    scrollToAppTop({ smooth: false });
    window.scrollTo(0, 0);
  }, [pathname]);
}
