import "server-only";

import { getChartTimezone } from "@/lib/chart/market-config";
import type { OHLCVBar } from "@/lib/chart/types";
import type { CandleProvider, ProviderFetchContext } from "./types";
import { toProviderSymbol } from "../candles/normalize";
import {
  mapIntervalToFinnhub,
  sortBars,
  withRetries,
  withTimeout,
} from "./shared";

function getApiKey(): string | undefined {
  return process.env.FINNHUB_API_KEY;
}

export const finnhubProvider: CandleProvider = {
  id: "finnhub",
  async fetch(ctx) {
    const token = getApiKey();
    if (!token || ctx.market !== "us") return null;

    const symbol = toProviderSymbol(ctx.symbol, ctx.market, "finnhub");
    const resolution = mapIntervalToFinnhub(ctx.interval);
    const to = Math.floor(Date.now() / 1000);
    const from = to - ctx.fetchDays * 24 * 60 * 60;

    const url =
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${token}`;

    try {
      const json = await withRetries(
        async () => {
          const res = await withTimeout(fetch(url, { cache: "no-store" }));
          if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
          return (await res.json()) as {
            s?: string;
            t?: number[];
            o?: number[];
            h?: number[];
            l?: number[];
            c?: number[];
            v?: number[];
          };
        },
        2,
        "finnhub"
      );

      if (json.s !== "ok" || !json.t?.length) return null;

      const bars: OHLCVBar[] = [];
      for (let i = 0; i < json.t.length; i++) {
        const close = json.c?.[i];
        if (close == null || close <= 0) continue;
        bars.push({
          time: json.t[i],
          open: json.o?.[i] ?? close,
          high: json.h?.[i] ?? close,
          low: json.l?.[i] ?? close,
          close,
          volume: json.v?.[i] ?? 0,
        });
      }

      const sorted = sortBars(bars);
      if (sorted.length < 2) return null;

      return {
        provider: "finnhub",
        symbol: ctx.symbol,
        bars: sorted,
        timezone: getChartTimezone("us"),
      };
    } catch (err) {
      console.warn("[provider:finnhub] failed", {
        symbol,
        error: err instanceof Error ? err.message : err,
      });
      return null;
    }
  },
};
