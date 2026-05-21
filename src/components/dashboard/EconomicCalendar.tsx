"use client";

import { economicCalendar } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const impactStyles = {
  high: "bg-[var(--negative)]/20 text-[var(--negative)]",
  medium: "bg-[var(--accent)]/15 text-[var(--accent)]",
  low: "bg-[var(--muted)]/15 text-[var(--muted)]",
} as const;

export function EconomicCalendar() {
  const t = useTranslations("calendar");
  const tImpact = useTranslations("impact");
  const tMock = useTranslations("mock.calendar");

  return (
    <section className="panel flex min-h-[240px] flex-col">
      <div className="panel-header">
        <span>{t("title")}</span>
        <span>{t("today")}</span>
      </div>
      <div>
        <ul className="divide-y divide-[var(--border)]/50">
          {economicCalendar.map((ev) => (
            <li
              key={ev.id}
              className="px-3 py-2.5 transition hover:bg-[var(--surface-elevated)] sm:px-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-[var(--accent)]">
                    {ev.time}
                  </span>
                  <span className="rounded bg-[var(--surface-elevated)] px-1 font-mono text-[10px] text-[var(--muted)]">
                    {ev.country}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      impactStyles[ev.impact]
                    )}
                  >
                    {tImpact(ev.impact)}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs font-medium text-[var(--foreground)]">
                {tMock(`${ev.id}.event`)}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[10px] text-[var(--muted)]">
                {ev.previous && (
                  <span>
                    {t("prev")} {ev.previous}
                  </span>
                )}
                {ev.forecast && (
                  <span>
                    {t("forecast")} {ev.forecast}
                  </span>
                )}
                {ev.actual && (
                  <span className="text-[var(--positive)]">
                    {t("actual")} {ev.actual}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
