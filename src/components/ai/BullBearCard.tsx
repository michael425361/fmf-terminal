import { TrendingDown, TrendingUp } from "lucide-react";
import type { AISummaryLocale } from "@/lib/ai/locale";
import { CardShell } from "./ai-ui";

interface BullBearCardProps {
  bullCase: string;
  bearCase: string;
  locale: AISummaryLocale;
}

/** Side-by-side bull vs bear thesis (server-component friendly). */
export function BullBearCard({ bullCase, bearCase, locale }: BullBearCardProps) {
  const title = locale === "zh" ? "多空观点" : "Bull / Bear Case";
  const bullLabel = locale === "zh" ? "看多论据" : "Bull Case";
  const bearLabel = locale === "zh" ? "看空论据" : "Bear Case";

  return (
    <CardShell title={title} accent="neutral">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-[var(--positive)]/25 bg-[var(--positive)]/5 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <TrendingUp
              className="h-3.5 w-3.5 text-[var(--positive)]"
              aria-hidden
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--positive)]">
              {bullLabel}
            </span>
          </div>
          <p className="text-xs leading-[1.6] text-[var(--foreground)]/85">
            {bullCase}
          </p>
        </div>

        <div className="rounded border border-[var(--negative)]/25 bg-[var(--negative)]/5 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <TrendingDown
              className="h-3.5 w-3.5 text-[var(--negative)]"
              aria-hidden
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--negative)]">
              {bearLabel}
            </span>
          </div>
          <p className="text-xs leading-[1.6] text-[var(--foreground)]/85">
            {bearCase}
          </p>
        </div>
      </div>
    </CardShell>
  );
}
