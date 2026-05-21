"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { cn } from "@/lib/utils";

export function ChartFullscreenButton({ className }: { className?: string }) {
  const t = useTranslations("tradingChart");
  const { chartFullscreen, toggleChartFullscreen } = useMobileLayout();

  return (
    <button
      type="button"
      onClick={toggleChartFullscreen}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-elevated)] hover:text-[var(--accent)] lg:hidden",
        chartFullscreen &&
          "border-[var(--accent)]/50 bg-[var(--accent-dim)]/25 text-[var(--accent)]",
        className
      )}
      aria-label={
        chartFullscreen ? t("exitFullscreen") : t("enterFullscreen")
      }
      aria-pressed={chartFullscreen}
    >
      {chartFullscreen ? (
        <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      ) : (
        <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
    </button>
  );
}
