import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AISummaryLocale } from "@/lib/ai/locale";

export type AISentiment = "bullish" | "bearish" | "neutral";

const SENTIMENT_LABELS: Record<AISentiment, { en: string; zh: string }> = {
  bullish: { en: "Bullish", zh: "看多" },
  bearish: { en: "Bearish", zh: "看空" },
  neutral: { en: "Neutral", zh: "中性" },
};

const SENTIMENT_STYLES: Record<AISentiment, { badge: string; dot: string }> = {
  bullish: {
    badge:
      "border-[var(--positive)]/35 bg-[var(--positive)]/10 text-[var(--positive)]",
    dot: "bg-[var(--positive)]",
  },
  bearish: {
    badge:
      "border-[var(--negative)]/35 bg-[var(--negative)]/10 text-[var(--negative)]",
    dot: "bg-[var(--negative)]",
  },
  neutral: {
    badge:
      "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)]",
    dot: "bg-[var(--muted)]",
  },
};

export function SentimentTag({
  sentiment,
  locale,
}: {
  sentiment: AISentiment;
  locale: AISummaryLocale;
}) {
  const style = SENTIMENT_STYLES[sentiment];
  const label = SENTIMENT_LABELS[sentiment][locale === "zh" ? "zh" : "en"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold",
        style.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {label}
    </span>
  );
}

export function ConfidenceBar({
  value,
  locale,
}: {
  value: number;
  locale: AISummaryLocale;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const tone =
    pct >= 70
      ? "var(--positive)"
      : pct >= 40
        ? "var(--accent)"
        : "var(--negative)";
  const label = locale === "zh" ? "置信度" : "Confidence";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
          {label}
        </span>
        <span
          className="font-mono text-[11px] font-bold tabular-nums"
          style={{ color: tone }}
        >
          {pct}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-elevated)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, backgroundColor: tone }}
        />
      </div>
    </div>
  );
}

export function CardShell({
  title,
  badge,
  children,
  className,
  accent,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: "positive" | "negative" | "neutral";
}) {
  const accentBar =
    accent === "positive"
      ? "before:bg-[var(--positive)]"
      : accent === "negative"
        ? "before:bg-[var(--negative)]"
        : "before:bg-[var(--accent)]";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded border border-[var(--border)] bg-[var(--surface)]",
        "before:absolute before:inset-y-0 before:left-0 before:w-0.5",
        accentBar,
        className
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--border)]/60 bg-[var(--surface-elevated)] px-3 py-2">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
          {title}
        </h3>
        {badge}
      </header>
      <div className="px-3 py-3">{children}</div>
    </section>
  );
}

export function CardEmpty({ message }: { message: string }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--muted)]">
      {message}
    </p>
  );
}

const DISCLAIMERS: Record<"en" | "zh", string> = {
  en: "AI-generated analysis for information only. Not investment advice.",
  zh: "AI 生成内容，仅供参考，不构成投资建议。",
};

export function AIDisclaimer({ locale }: { locale: AISummaryLocale }) {
  return (
    <p className="border-t border-[var(--border)]/40 pt-2 text-[9px] leading-snug text-[var(--muted)]/70">
      {DISCLAIMERS[locale === "zh" ? "zh" : "en"]}
    </p>
  );
}
