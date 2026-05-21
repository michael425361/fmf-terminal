"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { markScrollChartTop } from "@/lib/scroll-to-top";
import { Link, useRouter } from "@/i18n/navigation";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { PersonalWatchlist } from "./PersonalWatchlist";
import { SymbolSearchBar } from "./SymbolSearchBar";

export function MobileWatchlistPage() {
  const t = useTranslations("personalWatchlist");
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const redirect = () => {
      if (mq.matches) router.replace("/");
    };
    redirect();
    mq.addEventListener("change", redirect);
    return () => mq.removeEventListener("change", redirect);
  }, [router]);

  const goToChart = () => {
    markScrollChartTop();
    router.push("/");
  };

  return (
    <div className="app-shell w-full max-w-[100vw] overflow-hidden lg:hidden">
      <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-3">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            aria-label={t("backToChart")}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <h1 className="min-w-0 flex-1 text-sm font-semibold tracking-wide text-[var(--foreground)]">
            {t("title")}
          </h1>
        </div>
        <div className="px-3 pb-3">
          <SymbolSearchBar onSelect={goToChart} />
        </div>
      </header>

      <main
        data-app-scroll-root
        className="app-scroll scrollbar-thin min-w-0 pb-[3.75rem]"
      >
        <PersonalWatchlist variant="page" onSymbolSelect={goToChart} />
      </main>

      <MobileBottomNav />
    </div>
  );
}
