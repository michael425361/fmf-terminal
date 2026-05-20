import { NextResponse } from "next/server";
import { getSparklinesForSymbols } from "@/lib/market-data/service";
import { CATALOG_BY_ID } from "@/lib/watchlist/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  const symbols = ids
    .map((id) => CATALOG_BY_ID[id]?.symbol)
    .filter((s): s is string => Boolean(s));

  if (symbols.length === 0) {
    return NextResponse.json({});
  }

  try {
    const sparklines = await getSparklinesForSymbols(symbols);
    const byId: Record<string, number[]> = {};
    ids.forEach((id) => {
      const sym = CATALOG_BY_ID[id]?.symbol;
      if (sym && sparklines[sym]) {
        byId[id] = sparklines[sym];
      }
    });
    return NextResponse.json(byId, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({}, { status: 503 });
  }
}
