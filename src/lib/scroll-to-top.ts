const MOBILE_MAX_WIDTH = 1023;
const SCROLL_CHART_TOP_KEY = "fmf-scroll-chart-top";

let scrollLockCount = 0;
const scrollLockTops = new Map<HTMLElement, number>();

export interface ScrollToTopOptions {
  smooth?: boolean;
  /** Avoid on mobile — scrollIntoView can trigger iOS viewport zoom glitches. */
  scrollChartIntoView?: boolean;
}

/** Primary in-app scroll container (one per page). */
export function getAppScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-app-scroll-root]");
}

/** All in-app scroll roots (at most one visible per route). */
function getAppScrollRoots(): HTMLElement[] {
  if (typeof document === "undefined") return [];
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-app-scroll-root]")
  );
}

/** Request scroll-to-top on the next chart/dashboard paint (e.g. after /watchlist → /). */
export function markScrollChartTop(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SCROLL_CHART_TOP_KEY, "1");
}

export function consumeScrollChartTop(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  if (sessionStorage.getItem(SCROLL_CHART_TOP_KEY)) {
    sessionStorage.removeItem(SCROLL_CHART_TOP_KEY);
    return true;
  }
  return false;
}

/** Scroll the app scroll root to top (never double-scroll body + main). */
export function scrollToAppTop(options: ScrollToTopOptions = {}): void {
  if (typeof window === "undefined") return;

  const behavior = options.smooth ? "smooth" : "auto";
  const isMobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;

  const run = () => {
    const roots = getAppScrollRoots();
    if (roots.length > 0) {
      for (const root of roots) {
        root.scrollTo({ top: 0, left: 0, behavior });
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior });
    }

    if (options.scrollChartIntoView && isMobile) {
      document
        .querySelector<HTMLElement>("[data-chart-panel]")
        ?.scrollIntoView({ behavior, block: "start" });
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

function blurActiveElement(): void {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el !== document.body) {
    el.blur();
  }
}

/**
 * Lock in-app scroll while overlays (fullscreen chart, modals) are open.
 * Reference-counted; restores each scroll root position on release.
 */
export function lockDocumentScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  const html = document.documentElement;
  const body = document.body;

  if (scrollLockCount === 0) {
    blurActiveElement();
    html.classList.add("viewport-locked");

    for (const root of getAppScrollRoots()) {
      scrollLockTops.set(root, root.scrollTop);
      root.classList.add("app-scroll-lock");
    }
  }

  scrollLockCount += 1;

  return () => {
    if (scrollLockCount <= 0) return;
    scrollLockCount -= 1;

    if (scrollLockCount === 0) {
      html.classList.remove("viewport-locked");

      for (const root of getAppScrollRoots()) {
        const top = scrollLockTops.get(root) ?? 0;
        root.classList.remove("app-scroll-lock");
        root.scrollTop = top;
        scrollLockTops.delete(root);
      }

      scrollLockTops.clear();
      blurActiveElement();
      body.style.removeProperty("overflow");
      html.style.removeProperty("overflow");
    }
  };
}
