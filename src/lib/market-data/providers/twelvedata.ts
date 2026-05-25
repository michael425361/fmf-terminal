import "server-only";

import { getChartTimezone } from "@/lib/chart/market-config";
import type { OHLCVBar } from "@/lib/chart/types";
import type { CandleProvider, ProviderFetchContext } from "./types";
import {
  toProviderSymbol,
  twelveDataExchange,
} from "../candles/normalize";
import {
  mapIntervalToTwelveData,
  sortBars,
  withRetries,
  withTimeout,
} from "./shared";

function getApiKey(): string | undefined {
  return (
    process.env.TWELVE_DATA_API_KEY ??
    process.env.TWELVEDATA_API_KEY
  );
}

const TZ_OFFSET: Partial<Record<string, string>> = {
  hk: "+08:00",
  tw: "+08:00",
  cn: "+08:00",
};

function parseTwelveDataDatetime(
  datetime: string,
  market: ProviderFetchContext["market"]
): number | null {
  const iso = datetime.includes("T")
    ? datetime
    : datetime.replace(" ", "T");
  const offset = TZ_OFFSET[market];
  const ms = offset
    ? Date.parse(`${iso}${offset}`)
    : Date.parse(iso.endsWith("Z") ? iso : `${iso}Z`);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

function parseTwelveDataRows(
  values: Array<Record<string, string>>,
  market: ProviderFetchContext["market"]
): OHLCVBar[] {
  const bars: OHLCVBar[] = [];

  for (const row of values) {
    const datetime = row.datetime;
    const open = Number(row.open);
    const high = Number(row.high);
    const low = Number(row.low);
    const close = Number(row.close);
    const volume = Number(row.volume ?? 0);

    if (!datetime || !Number.isFinite(close) || close <= 0) continue;

    const time = parseTwelveDataDatetime(datetime, market);
    if (time == null) continue;

    bars.push({
      time,
      open: Number.isFinite(open) ? open : close,
      high: Number.isFinite(high) ? high : close,
      low: Number.isFinite(low) ? low : close,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
    });
  }

  return sortBars(bars);
}

export const twelveDataProvider: CandleProvider = {
  id: "twelvedata",
  async fetch(ctx) {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    if (ctx.market !== "hk" && ctx.market !== "tw") return null;

    const symbol = toProviderSymbol(ctx.symbol, ctx.market, "twelvedata");
    const exchange = twelveDataExchange(ctx.market);
    const interval = mapIntervalToTwelveData(ctx.interval);
    const outputsize = Math.min(5000, ctx.fetchDays * (interval.includes("min") ? 80 : 30));

    const params = new URLSearchParams({
      symbol,
      interval,
      outputsize: String(outputsize),
      apikey: apiKey,
      timezone: getChartTimezone(ctx.market),
    });
    if (exchange) params.set("exchange", exchange);

    const url = `https://api.twelvedata.com/time_series?${params.toString()}`;

    try {
      const json = await withRetries(
        async () => {
          const res = await withTimeout(fetch(url, { cache: "no-store" }));
          if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
          return (await res.json()) as {
            status?: string;
            values?: Array<Record<string, string>>;
            message?: string;
          };
        },
        2,
        "twelvedata"
      );

      if (json.status === "error" || !json.values?.length) {
        console.warn("[provider:twelvedata] empty", json.message);
        return null;
      }

      const bars = parseTwelveDataRows(json.values, ctx.market);
      if (bars.length < 2) return null;

      return {
        provider: "twelvedata",
        symbol: ctx.symbol,
        bars,
        timezone: getChartTimezone(ctx.market),
      };
    } catch (err) {
      console.warn("[provider:twelvedata] failed", {
        symbol,
        market: ctx.market,
        error: err instanceof Error ? err.message : err,
      });
      return null;
    }
  },
};
