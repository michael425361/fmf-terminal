import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AISummaryLocale } from "@/lib/ai/locale";
import type {
  EarningsAnalysis,
  EarningsVerdict,
} from "@/lib/ai/earnings-analysis";
import { CardShell, ConfidenceBar } from "./ai-ui";

interface EarningsAnalysisCardProps {
  data: EarningsAnalysis & {
    epsVerdict: EarningsVerdict;
    epsSurprisePercent?: number;
    reportPeriod?: string;
  };
  locale: AISummaryLocale;
}

const VERDICT_LABELS: Record<EarningsVerdict, { en: string; zh: string }> = {
  beat: { en: "Beat", zh: "超预期" },
  meet: { en: "In-Line", zh: "符合预期" },
  miss: { en: "Miss", zh: "不及预期" },
  unknown: { en: "N/A", zh: "暂无" },
};

const VERDICT_STYLE: Record<EarningsVerdict, string> = {
  beat: "border-[var(--positive)]/35 bg-[var(--positive)]/10 text-[var(--positive)]",
  miss: "border-[var(--negative)]/35 bg-[var(--negative)]/10 text-[var(--negative)]",
  meet: "border-[var(--accent)]/35 bg-[var(--accent)]/10 text-[var(--accent)]",
  unknown:
    "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)]",
};

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </span>
      <p className="text-xs leading-[1.55] text-[var(--foreground)]/85">{value}</p>
    </div>
  );
}

/** Earnings beat/meet/miss assessment (server-component friendly). */
export function EarningsAnalysisCard({ data, locale }: EarningsAnalysisCardProps) {
  const zh = locale === "zh";
  const title = zh ? "财报分析" : "Earnings Analysis";
  const verdict = VERDICT_LABELS[data.epsVerdict][zh ? "zh" : "en"];

  return (
    <CardShell
      title={title}
      accent={
        data.epsVerdict === "beat"
          ? "positive"
          : data.epsVerdict === "miss"
            ? "negative"
            : "neutral"
      }
      badge={
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
            VERDICT_STYLE[data.epsVerdict]
          )}
        >
          <BarChart3 className="h-3 w-3" aria-hidden />
          {verdict}
          {typeof data.epsSurprisePercent === "number" &&
            data.epsVerdict !== "unknown" && (
              <span className="tabular-nums">
                {data.epsSurprisePercent > 0 ? "+" : ""}
                {data.epsSurprisePercent.toFixed(1)}%
              </span>
            )}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <Row label={zh ? "营收" : "Revenue"} value={data.revenueAssessment} />
        <Row label={zh ? "每股收益" : "EPS"} value={data.epsAssessment} />
        <Row label={zh ? "指引" : "Guidance"} value={data.guidanceAssessment} />

        <div className="grid gap-3 border-t border-[var(--border)]/50 pt-3 sm:grid-cols-2">
          <Row label={zh ? "亮点" : "Positives"} value={data.positives} />
          <Row label={zh ? "隐忧" : "Negatives"} value={data.negatives} />
        </div>

        <Row label={zh ? "核心要点" : "Key Takeaways"} value={data.keyTakeaways} />
        <ConfidenceBar value={data.confidence} locale={locale} />
      </div>
    </CardShell>
  );
}
