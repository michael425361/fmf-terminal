"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getExchangeSessionStatuses,
  getRegionShortCode,
  type ExchangeSessionStatus,
} from "@/lib/market-data/market-status";
import { cn } from "@/lib/utils";

const REFRESH_MS = 30_000;

export function MarketSessionChips() {
  const t = useTranslations("marketStatus");
  const [statuses, setStatuses] = useState<ExchangeSessionStatus[]>(() =>
    getExchangeSessionStatuses()
  );

  useEffect(() => {
    const tick = () => setStatuses(getExchangeSessionStatuses());
    tick();
    const timer = setInterval(tick, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex shrink-0 items-stretch gap-0 border-r border-[var(--border)]"
      aria-label={t("stripLabel")}
    >
      {statuses.map((s) => (
        <SessionChip key={s.region} status={s} label={t(s.labelKey)} />
      ))}
    </div>
  );
}

function SessionChip({
  status,
  label,
}: {
  status: ExchangeSessionStatus;
  label: string;
}) {
  const code = getRegionShortCode(status.region);

  return (
    <div
      className={cn(
        "flex min-w-[52px] flex-col justify-center px-1.5 py-1 lg:min-w-[58px] lg:px-2 lg:py-1.5",
        status.isLive && "bg-[var(--positive)]/5"
      )}
      title={label}
    >
      <span className="font-mono text-[8px] font-semibold uppercase tracking-wider text-[var(--muted)] lg:text-[9px]">
        {code}
      </span>
      <span
        className={cn(
          "truncate font-mono text-[8px] leading-tight lg:text-[9px]",
          status.isLive && "text-[var(--positive)]",
          status.phase === "lunch" && "text-[var(--accent)]",
          status.phase === "pre" && "text-[var(--accent)]",
          status.phase === "post" && "text-[var(--muted)]",
          status.phase === "closed" && "text-[var(--muted)]"
        )}
      >
        {status.isLive && (
          <span className="mr-0.5 inline-block h-1 w-1 rounded-full bg-[var(--positive)] align-middle" />
        )}
        {label}
      </span>
    </div>
  );
}
