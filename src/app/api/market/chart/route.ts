import { NextResponse } from "next/server";
import { DEFAULT_CHART_SYMBOL } from "@/lib/market-data/symbols";
import { getChartSeries } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? DEFAULT_CHART_SYMBOL;

  try {
    const series = await getChartSeries(symbol);
    if (!series) {
      return NextResponse.json(
        { error: "Chart data unavailable" },
        { status: 404 }
      );
    }
    return NextResponse.json(series, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Chart fetch failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
