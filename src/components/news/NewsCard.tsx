"use client";

import { useLocale } from "next-intl";
import { formatRelativeTime } from "@/lib/news/relative-time";
import type { NormalizedNewsArticle } from "@/lib/news/types";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  article: NormalizedNewsArticle;
  className?: string;
}

export function NewsCard({ article, className }: NewsCardProps) {
  const locale = useLocale();
  const timeLabel = formatRelativeTime(article.publishedAt, locale);
  const isLink = article.url && article.url !== "#";

  const inner = (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {article.tag && (
          <span className="rounded bg-[var(--accent-dim)]/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            {article.tag}
          </span>
        )}
        <span className="font-mono text-[10px] text-[var(--muted)]">
          {article.source}
        </span>
        {timeLabel && (
          <>
            <span className="text-[10px] text-[var(--muted)]">·</span>
            <time
              dateTime={article.publishedAt}
              className="font-mono text-[10px] text-[var(--muted)]"
            >
              {timeLabel}
            </time>
          </>
        )}
      </div>

      <h2 className="text-sm font-semibold leading-snug text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
        {article.title}
      </h2>

      {article.summary && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
          {article.summary}
        </p>
      )}
    </>
  );

  const cardClass = cn(
    "news-card group block rounded border border-[var(--border)] bg-[var(--surface-card)] p-4 transition",
    "hover:border-[var(--accent)]/30 hover:bg-[var(--surface-elevated)] active:scale-[0.995]",
    className
  );

  if (isLink) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {inner}
      </a>
    );
  }

  return <article className={cardClass}>{inner}</article>;
}
