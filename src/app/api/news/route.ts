import { NextResponse } from "next/server";
import { aggregateNewsFeed } from "@/lib/news/rss-aggregator";
import type { NewsCategory } from "@/lib/news/types";

export const dynamic = "force-dynamic";

const VALID: NewsCategory[] = ["us", "cn", "global"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("category") ?? "us";
  const category = VALID.includes(raw as NewsCategory)
    ? (raw as NewsCategory)
    : "us";
  const force = searchParams.get("force") === "1";

  try {
    const data = await aggregateNewsFeed(category, { force });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "News feed failed";
    return NextResponse.json(
      { error: message, category, articles: [] },
      { status: 503 }
    );
  }
}
