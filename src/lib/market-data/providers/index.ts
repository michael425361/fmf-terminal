import "server-only";

import type {
  CandleProvider,
  CandleProviderId,
  ProviderCandleResult,
  ProviderFetchContext,
} from "./types";
import { yahooProvider } from "./yahoo";
import { finnhubProvider } from "./finnhub";
import { twelveDataProvider } from "./twelvedata";
import { binanceProvider } from "./binance";

const PROVIDERS: Record<CandleProviderId, CandleProvider> = {
  yahoo: yahooProvider,
  finnhub: finnhubProvider,
  twelvedata: twelveDataProvider,
  binance: binanceProvider,
};

export async function fetchFromProvider(
  providerId: CandleProviderId,
  ctx: ProviderFetchContext
): Promise<ProviderCandleResult | null> {
  const provider = PROVIDERS[providerId];
  if (!provider) return null;
  return provider.fetch(ctx);
}

export { yahooProvider, finnhubProvider, twelveDataProvider, binanceProvider };
export type { ProviderFetchContext, ProviderCandleResult, CandleProviderId };
