import "server-only";

import { shouldIncludePrePost } from "@/lib/chart/market-config";
import { resolveTimeframeResolution } from "@/lib/chart/timeframe-resolution";
import type { ChartTimeframe } from "@/lib/chart/types";
import {
  detectMarketFromSymbol,
  type DetectedMarket,
} from "../symbol-normalize";
import { fetchFromProvider } from "../providers";
import type { ProviderFetchContext } from "../providers/types";
import { getProviderChain } from "./registry";
import { normalizeCandleSymbol } from "./normalize";
import type { GetCandlesParams } from "./types";
import type { ProviderCandleResult } from "../providers/types";

export async function getCandles(
  params: GetCandlesParams & { timeframe: ChartTimeframe }
): Promise<ProviderCandleResult | null> {
  const symbol = normalizeCandleSymbol(params.symbol, params.market);
  const market =
    params.market ?? detectMarketFromSymbol(symbol);
  const timeframe = params.timeframe;
  const resolution = resolveTimeframeResolution(timeframe, market);

  const ctx: ProviderFetchContext = {
    symbol,
    market,
    interval: params.interval ?? resolution.interval,
    fetchDays: params.fetchDays ?? resolution.fetchDays,
    includePrePost:
      params.includePrePost ??
      shouldIncludePrePost(market, timeframe),
  };

  const chain = getProviderChain(market);

  console.log("Fetching candle data:", {
    symbol,
    market,
    interval: ctx.interval,
    range: { fetchDays: ctx.fetchDays },
    providers: chain,
  });

  for (const providerId of chain) {
    try {
      const result = await fetchFromProvider(providerId, ctx);
      if (result && result.bars.length >= 2) {
        console.log("Candle API response:", {
          provider: providerId,
          barCount: result.bars.length,
          symbol: result.symbol,
          fallback: providerId !== chain[0],
        });
        return result;
      }
      console.warn("[getCandles] provider empty", {
        provider: providerId,
        symbol,
        market,
      });
    } catch (err) {
      console.warn("[getCandles] provider error", {
        provider: providerId,
        error: err instanceof Error ? err.message : err,
      });
    }
  }

  console.warn("[getCandles] all providers failed", { symbol, market, chain });
  return null;
}
