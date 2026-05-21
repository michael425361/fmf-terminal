const MOBILE_MAX_WIDTH = 1023;
const SCROLL_CHART_TOP_KEY = "fmf-scroll-chart-top";

export interface ScrollToTopOptions {
  smooth?: boolean;
}

/** Primary in-app scroll container (one per page). */
export function getAppScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-app-scroll-root]");
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
    const root = getAppScrollRoot();
    if (root) {
      root.scrollTo({ top: 0, left: 0, behavior });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior });
    }

    if (isMobile) {
      document
        .querySelector<HTMLElement>("[data-chart-panel]")
        ?.scrollIntoView({ behavior, block: "start" });
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

/** Lock document scroll while overlays (fullscreen chart, modals) are open. */
export function lockDocumentScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  const html = document.documentElement;
  const body = document.body;
  const prevHtml = html.style.overflow;
  const prevBody = body.style.overflow;
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  return () => {
    html.style.overflow = prevHtml;
    body.style.overflow = prevBody;
  };
}
