"use client";

import { useTranslations } from "next-intl";
import { FMFLogo } from "./FMFLogo";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  const t = useTranslations("brand");

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <FMFLogo size={compact ? 28 : 34} priority />
      <div className="min-w-0 leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-[var(--foreground)]">
            FMF
          </span>
          <span className="font-mono text-[10px] font-semibold tracking-[0.28em] text-[var(--accent)]">
            {t("terminal")}
          </span>
        </div>
        {!compact && (
          <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            {t("tagline")}
          </p>
        )}
      </div>
    </div>
  );
}
