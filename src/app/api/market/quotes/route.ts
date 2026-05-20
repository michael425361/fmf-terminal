import { NextResponse } from "next/server";
import { getQuotesForSymbols } from "@/lib/market-data/service";
import { CATALOG_BY_ID } from "@/lib/watchlist/catalog";
import { catalogToMarketDef } from "@/lib/watchlist/market-bridge";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (ids.length === 0) {
    return NextResponse.json({ quotes: {}, errors: [], fetchedAt: Date.now() });
  }

  const definitions = ids
    .map((id) => CATALOG_BY_ID[id])
    .filter(Boolean)
    .map(catalogToMarketDef);

  try {
    const result = await getQuotesForSymbols(definitions);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote fetch failed";
    return NextResponse.json(
      { quotes: {}, errors: [{ symbol: "*", message }], fetchedAt: Date.now() },
      { status: 503 }
    );
  }
}
