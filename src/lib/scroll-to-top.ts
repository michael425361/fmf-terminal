const MOBILE_MAX_WIDTH = 1023;
const SCROLL_CHART_TOP_KEY = "fmf-scroll-chart-top";

export interface ScrollToTopOptions {
  smooth?: boolean;
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

/** Scroll window and in-app scroll roots to top (mobile-first). */
export function scrollToAppTop(options: ScrollToTopOptions = {}): void {
  if (typeof window === "undefined") return;

  const behavior = options.smooth ? "smooth" : "auto";
  const isMobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;

  const run = () => {
    window.scrollTo({ top: 0, left: 0, behavior });

    document.documentElement.scrollTo({ top: 0, left: 0, behavior });
    document.body.scrollTo({ top: 0, left: 0, behavior });

    document.querySelectorAll<HTMLElement>("[data-app-scroll-root]").forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior });
    });

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
