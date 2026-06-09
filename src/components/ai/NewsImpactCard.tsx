import { Newspaper } from "lucide-react";
import { formatRelativeTime } from "@/lib/news/relative-time";
import type { AISummaryLocale } from "@/lib/ai/locale";
import type {
  NewsSummary,
  RankedNewsItem,
} from "@/lib/ai/news-intelligence";
import { CardEmpty, CardShell, SentimentTag } from "./ai-ui";

interface NewsImpactCardProps {
  ranked: RankedNewsItem[];
  summary: NewsSummary | null;
  locale: AISummaryLocale;
}

/** Ranked news with sentiment + impact scores (server-component friendly). */
export function NewsImpactCard({ ranked, summary, locale }: NewsImpactCardProps) {
  const title = locale === "zh" ? "新闻影响" : "News Impact";
  const impactLabel = locale === "zh" ? "影响" : "Impact";
  const emptyMsg = locale === "zh" ? "暂无相关新闻" : "No relevant news";

  return (
    <CardShell
      title={title}
      accent="neutral"
      badge={
        <Newspaper className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
      }
    >
      <div className="flex flex-col gap-3">
        {summary?.summary && (
          <div className="flex flex-col gap-2 border-b border-[var(--border)]/50 pb-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {locale === "zh" ? "综述" : "Overview"}
              </span>
              <SentimentTag sentiment={summary.sentiment} locale={locale} />
            </div>
            <p className="text-xs leading-[1.6] text-[var(--foreground)]/85">
              {summary.summary}
            </p>
          </div>
        )}

        {ranked.length === 0 ? (
          <CardEmpty message={emptyMsg} />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--border)]/40">
            {ranked.map((item, i) => (
              <li key={`${item.url}-${i}`} className="py-2 first:pt-0 last:pb-0">
                <a
                  href={item.url || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 shrink-0 rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums text-[var(--accent)]"
                      title={`${impactLabel}: ${item.score}`}
                    >
                      {item.score}
                    </span>
                    <p className="text-xs leading-snug text-[var(--foreground)]/90 transition group-hover:text-[var(--accent)]">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                    <SentimentTag sentiment={item.sentiment} locale={locale} />
                    <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--muted)]">
                      {item.source}
                    </span>
                    <span className="font-mono text-[9px] text-[var(--muted)]/80">
                      {formatRelativeTime(item.publishedAt, locale)}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CardShell>
  );
}
