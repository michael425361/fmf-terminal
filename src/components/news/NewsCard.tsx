"use client";

import { useLocale } from "next-intl";
import type { NewsArticle } from "@/lib/news/types";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  article: NewsArticle;
  className?: string;
}

export function NewsCard({ article, className }: NewsCardProps) {
  const locale = useLocale();
  const lang = locale === "zh" ? "zh" : "en";

  return (
    <article
      className={cn(
        "news-card group rounded border border-[var(--border)] bg-[var(--surface-card)] p-4 transition",
        "hover:border-[var(--accent)]/30 hover:bg-[var(--surface-elevated)] active:scale-[0.995]",
        className
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {article.tag && (
          <span className="rounded bg-[var(--accent-dim)]/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            {article.tag[lang]}
          </span>
        )}
        <span className="font-mono text-[10px] text-[var(--muted)]">
          {article.source[lang]}
        </span>
        <span className="text-[10px] text-[var(--muted)]">·</span>
        <time className="font-mono text-[10px] text-[var(--muted)]">
          {article.time}
        </time>
      </div>

      <h2 className="text-sm font-semibold leading-snug text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
        {article.title[lang]}
      </h2>

      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
        {article.summary[lang]}
      </p>
    </article>
  );
}
