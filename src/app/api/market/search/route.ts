import { NextResponse } from "next/server";
import { searchMarketSymbols } from "@/lib/market-data/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    30,
    Math.max(1, Number(searchParams.get("limit") ?? 16) || 16)
  );

  if (!q) {
    return NextResponse.json({ results: [], query: "" });
  }

  try {
    const results = await searchMarketSymbols(q, limit);
    return NextResponse.json(
      {
        query: q,
        results: results.map((r) => r.entry),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message, results: [] }, { status: 503 });
  }
}
