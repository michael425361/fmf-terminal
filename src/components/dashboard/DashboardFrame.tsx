"use client";

import { useEffect } from "react";
import { HeaderToolbar } from "./HeaderToolbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { TopBar } from "./TopBar";
import { useActiveSymbolScrollReset } from "@/hooks/useActiveSymbolScrollReset";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { cn } from "@/lib/utils";

export function DashboardFrame({ main }: { main: React.ReactNode }) {
  const { chartFullscreen, closeChartFullscreen } = useMobileLayout();
  useActiveSymbolScrollReset();

  useEffect(() => {
    if (!chartFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chartFullscreen]);

  useEffect(() => {
    if (!chartFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChartFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chartFullscreen, closeChartFullscreen]);

  return (
    <div
      className={cn(
        "flex h-screen flex-col overflow-hidden bg-[var(--background)]",
        chartFullscreen && "chart-fullscreen-active"
      )}
    >
      <div
        className={cn(
          "shrink-0 transition-all duration-300 ease-out lg:!max-h-none lg:!opacity-100",
          chartFullscreen
            ? "pointer-events-none max-h-0 overflow-hidden opacity-0"
            : "max-h-[200px] opacity-100"
        )}
        aria-hidden={chartFullscreen}
      >
        <HeaderToolbar />
        <TopBar />
      </div>

      <div className="flex min-h-0 flex-1">
        <MobileBottomNav />
        <main
          data-app-scroll-root
          className={cn(
            "relative flex min-h-0 flex-1 flex-col overflow-hidden transition-[padding] duration-300 lg:pb-0",
            chartFullscreen ? "pb-0" : ""
          )}
        >
          {main}
        </main>
      </div>
    </div>
  );
}
