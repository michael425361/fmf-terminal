import "server-only";

import YahooFinance from "yahoo-finance2";
import { MARKET_SYMBOLS, SYMBOL_BY_YAHOO } from "./symbols";
import type {
  ChartPoint,
  MarketChartSeries,
  MarketQuote,
  MarketQuoteError,
  MarketSymbolDefinition,
} from "./types";

let yahooClient: InstanceType<typeof YahooFinance> | null = null;

function getYahooClient() {
  if (!yahooClient) {
    yahooClient = new YahooFinance();
  }
  return yahooClient;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

interface YahooQuoteResult {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  averageDailyVolume10Day?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  earningsTimestamp?: number;
  earningsTimestampStart?: number;
  exchange?: string;
  fullExchangeName?: string;
  quoteType?: string;
  currency?: string;
  marketState?: string;
  volume24Hr?: number;
  openInterest?: number;
  expireDate?: Date | number;
  contractSymbol?: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

function mapRowToQuote(
  row: YahooQuoteResult,
  def: MarketSymbolDefinition
): MarketQuote | null {
  const price = row.regularMarketPrice;
  if (price == null || Number.isNaN(price)) return null;

  let change = row.regularMarketChange ?? 0;
  let changePercent = row.regularMarketChangePercent ?? 0;

  if (
    change === 0 &&
    changePercent === 0 &&
    row.regularMarketPreviousClose != null
  ) {
    change = price - row.regularMarketPreviousClose;
    changePercent =
      row.regularMarketPreviousClose !== 0
        ? (change / row.regularMarketPreviousClose) * 100
        : 0;
  }

  const expire =
    row.expireDate instanceof Date
      ? row.expireDate
      : row.expireDate
        ? new Date(row.expireDate)
        : null;

  return {
    id: def.id,
    symbol: def.symbol,
    shortLabel: def.shortLabel,
    category: def.category,
    name: row.longName ?? row.shortName ?? def.shortLabel,
    price,
    change,
    changePercent,
    currency: row.currency,
    marketState: row.marketState,
    updatedAt: Date.now(),
    invertColors: def.invertColors,
    priceDecimals: def.priceDecimals,
    open: row.regularMarketOpen,
    high: row.regularMarketDayHigh,
    low: row.regularMarketDayLow,
    previousClose: row.regularMarketPreviousClose,
    volume: row.regularMarketVolume,
    averageVolume:
      row.averageDailyVolume10Day ?? row.averageDailyVolume3Month,
    marketCap: row.marketCap,
    trailingPE: row.trailingPE,
    forwardPE: row.forwardPE,
    earningsTimestamp:
      row.earningsTimestamp ?? row.earningsTimestampStart,
    exchange: row.exchange ?? row.fullExchangeName,
    fullExchangeName: row.fullExchangeName,
    quoteType: row.quoteType,
    volume24h: row.volume24Hr,
    openInterest: row.openInterest,
    contractMonth: expire
      ? expire.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      : row.contractSymbol,
    fiftyTwoWeekHigh: row.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: row.fiftyTwoWeekLow,
  };
}

export async function fetchYahooQuotes(
  definitions: MarketSymbolDefinition[] = MARKET_SYMBOLS
): Promise<{ quotes: MarketQuote[]; errors: MarketQuoteError[] }> {
  const quotes: MarketQuote[] = [];
  const errors: MarketQuoteError[] = [];
  const yf = getYahooClient();
  const batches = chunk(definitions, 25);

  for (const batch of batches) {
    const symbols = batch.map((d) => d.symbol);

    try {
      const raw = await yf.quote(symbols);
      const rows = (
        Array.isArray(raw) ? raw : raw ? [raw] : []
      ) as YahooQuoteResult[];

      const rowBySymbol = new Map(
        rows.filter((r) => r.symbol).map((r) => [r.symbol!, r])
      );

      for (const def of batch) {
        const row = rowBySymbol.get(def.symbol);
        if (!row) {
          errors.push({
            id: def.id,
            symbol: def.symbol,
            message: "No quote returned",
          });
          continue;
        }
        const quote = mapRowToQuote(row, def);
        if (quote) {
          quotes.push(quote);
        } else {
          errors.push({
            id: def.id,
            symbol: def.symbol,
            message: "Invalid price data",
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fetch failed";
      batch.forEach((d) =>
        errors.push({ id: d.id, symbol: d.symbol, message })
      );
    }
  }

  return { quotes, errors };
}

export async function fetchYahooChart(
  symbol: string,
  range = "1d" as const
): Promise<MarketChartSeries | null> {
  const yf = getYahooClient();

  try {
    const result = await yf.chart(symbol, {
      period1: new Date(Date.now() - 24 * 60 * 60 * 1000),
      interval: "5m",
    });

    const timestamps = result.quotes
      ?.map((q) => q.date)
      .filter((d): d is Date => d != null);

    const closes = result.quotes
      ?.map((q) => q.close)
      .filter((c): c is number => c != null && !Number.isNaN(c));

    if (!timestamps?.length || !closes?.length) return null;

    const points: ChartPoint[] = timestamps.map((date, i) => ({
      time: Math.floor(date.getTime() / 1000),
      close: closes[i] ?? closes[closes.length - 1],
    }));

    if (points.length < 2) return null;

    const first = points[0].close;
    const last = points[points.length - 1].close;
    const changePercent = first !== 0 ? ((last - first) / first) * 100 : 0;

    return { symbol, points, changePercent };
  } catch {
    return null;
  }
}

export function mergeQuotesWithDefinitions(
  quotes: MarketQuote[]
): Record<string, MarketQuote> {
  return Object.fromEntries(quotes.map((q) => [q.id, q]));
}

export function resolveDefinition(
  symbol: string
): MarketSymbolDefinition | undefined {
  return SYMBOL_BY_YAHOO[symbol];
}

/** Lightweight intraday closes for sparklines (last ~24 points). */
export async function fetchYahooSparklines(
  symbols: string[]
): Promise<Record<string, number[]>> {
  const yf = getYahooClient();
  const out: Record<string, number[]> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const result = await yf.chart(symbol, {
          period1: new Date(Date.now() - 24 * 60 * 60 * 1000),
          interval: "15m",
        });
        const closes =
          result.quotes
            ?.map((q) => q.close)
            .filter((c): c is number => c != null && !Number.isNaN(c)) ?? [];
        if (closes.length >= 2) {
          out[symbol] = closes.slice(-24);
        }
      } catch {
        // skip failed symbol
      }
    })
  );

  return out;
}
