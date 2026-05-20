import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  try {
    const snapshot = await getMarketSnapshot({ force });
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch market data";
    return NextResponse.json(
      {
        quotes: {},
        errors: [{ symbol: "*", message }],
        fetchedAt: Date.now(),
        stale: true,
      },
      { status: 503 }
    );
  }
}
