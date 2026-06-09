import { TrendingUp } from "lucide-react";
import type { AISummaryLocale } from "@/lib/ai/locale";
import type { ExplainMove } from "@/lib/ai/explain-move";
import { CardShell, ConfidenceBar } from "./ai-ui";

interface ExplainMoveCardProps {
  data: ExplainMove;
  locale: AISummaryLocale;
}

/** Presentational "why did it move" card (server-component friendly). */
export function ExplainMoveCard({ data, locale }: ExplainMoveCardProps) {
  const title = locale === "zh" ? "异动解读" : "Explain Move";
  const catalystsLabel = locale === "zh" ? "催化剂" : "Catalysts";
  const catalysts = data.catalysts
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <CardShell
      title={title}
      accent="neutral"
      badge={
        <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold leading-snug text-[var(--foreground)]">
          {data.headline}
        </p>
        <p className="text-xs leading-[1.65] text-[var(--foreground)]/85">
          {data.explanation}
        </p>

        {catalysts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
              {catalystsLabel}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {catalysts.map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground)]/85"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <ConfidenceBar value={data.confidence} locale={locale} />
      </div>
    </CardShell>
  );
}
