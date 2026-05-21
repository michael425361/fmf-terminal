"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppNavLayout } from "@/components/layout/AppNavLayout";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import type { NewsCategory } from "@/lib/news/types";
import { NewsCard } from "./NewsCard";
import { NewsSkeleton } from "./NewsSkeleton";
import { cn } from "@/lib/utils";

const TABS: NewsCategory[] = ["us", "cn", "global"];

export function NewsPage() {
  const t = useTranslations("news");
  const [tab, setTab] = useState<NewsCategory>("us");
  const { data, loading, error, refetch } = useNewsFeed(tab);

  const articles = data?.articles ?? [];
  const feedErrors = data?.errors ?? [];

  return (
    <AppNavLayout>
      <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 lg:px-6">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)] lg:hidden"
          >
            FMF
          </Link>
          <h1 className="flex-1 text-sm font-semibold tracking-wide text-[var(--foreground)] lg:text-base">
            {t("title")}
          </h1>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--accent)] disabled:opacity-50"
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
          </button>
        </div>

        <div
          role="tablist"
          aria-label={t("title")}
          className="mx-auto flex max-w-3xl gap-0 border-t border-[var(--border)]/60 px-2 lg:px-4"
        >
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition sm:text-[11px]",
                tab === id
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {t(`tabs.${id}`)}
            </button>
          ))}
        </div>
      </header>

      <main
        data-app-scroll-root
        className="app-scroll scrollbar-thin pb-[4.5rem] lg:pb-8"
      >
        <div className="mx-auto max-w-3xl px-4 py-4 lg:px-6 lg:py-6">
          {error && (
            <p className="mb-3 rounded border border-[var(--negative)]/40 bg-[var(--negative)]/10 px-3 py-2 text-xs text-[var(--negative)]">
              {error}
            </p>
          )}

          {feedErrors.length > 0 && !error && (
            <p className="mb-3 font-mono text-[10px] text-[var(--muted)]">
              {feedErrors[0]}
            </p>
          )}

          {data?.fetchedAt && !loading && (
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
              {t("updated")}{" "}
              {new Date(data.fetchedAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {data.stale ? ` · ${t("stale")}` : ""}
            </p>
          )}

          {loading && articles.length === 0 ? (
            <NewsSkeleton />
          ) : articles.length === 0 ? (
            <p className="py-12 text-center text-xs text-[var(--muted)]">
              {t("empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </main>

    </AppNavLayout>
  );
}
