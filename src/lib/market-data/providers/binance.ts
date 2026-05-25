import "server-only";

import { getChartTimezone } from "@/lib/chart/market-config";
import type { OHLCVBar } from "@/lib/chart/types";
import type { CandleProvider } from "./types";
import { toProviderSymbol } from "../candles/normalize";
import {
  mapIntervalToBinance,
  sortBars,
  withRetries,
  withTimeout,
} from "./shared";

export const binanceProvider: CandleProvider = {
  id: "binance",
  async fetch(ctx) {
    if (ctx.market !== "crypto") return null;

    const symbol = toProviderSymbol(ctx.symbol, ctx.market, "binance");
    const interval = mapIntervalToBinance(ctx.interval);
    const limit = Math.min(1000, ctx.fetchDays * 288);

    const url =
      `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;

    try {
      const rows = await withRetries(
        async () => {
          const res = await withTimeout(fetch(url, { cache: "no-store" }));
          if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
          return (await res.json()) as Array<
            [number, string, string, string, string, string, ...unknown[]]
          >;
        },
        2,
        "binance"
      );

      const bars: OHLCVBar[] = [];
      for (const row of rows) {
        const open = Number(row[1]);
        const high = Number(row[2]);
        const low = Number(row[3]);
        const close = Number(row[4]);
        const volume = Number(row[5]);
        if (!Number.isFinite(close) || close <= 0) continue;

        bars.push({
          time: Math.floor(row[0] / 1000),
          open,
          high,
          low,
          close,
          volume: Number.isFinite(volume) ? volume : 0,
        });
      }

      const sorted = sortBars(bars);
      if (sorted.length < 2) return null;

      return {
        provider: "binance",
        symbol: ctx.symbol,
        bars: sorted,
        timezone: getChartTimezone("crypto"),
      };
    } catch (err) {
      console.warn("[provider:binance] failed", {
        symbol,
        error: err instanceof Error ? err.message : err,
      });
      return null;
    }
  },
};
