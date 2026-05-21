"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { getNewsByCategory } from "@/lib/news/mock-news";
import type { NewsCategory } from "@/lib/news/types";
import { NewsCard } from "./NewsCard";
import { cn } from "@/lib/utils";

const TABS: NewsCategory[] = ["us", "cn", "global"];

export function NewsPage() {
  const t = useTranslations("news");
  const [tab, setTab] = useState<NewsCategory>("us");
  const articles = getNewsByCategory(tab);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
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
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-[4.5rem] lg:pb-8"
      >
        <div className="mx-auto max-w-3xl px-4 py-4 lg:px-6 lg:py-6">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            {t("mockNotice")}
          </p>
          <div className="flex flex-col gap-3">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
