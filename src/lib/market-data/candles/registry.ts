import type { DetectedMarket } from "../symbol-normalize";
import type { CandleProviderId } from "../providers/types";

const PRIMARY_PROVIDER: Record<DetectedMarket, CandleProviderId> = {
  us: "finnhub",
  hk: "twelvedata",
  tw: "twelvedata",
  cn: "yahoo",
  crypto: "binance",
  unknown: "yahoo",
};

/** Ordered provider chain: primary → Yahoo fallback. */
export function getProviderChain(market: DetectedMarket): CandleProviderId[] {
  const primary = PRIMARY_PROVIDER[market] ?? "yahoo";
  if (primary === "yahoo") return ["yahoo"];
  return [primary, "yahoo"];
}

export function getPrimaryProvider(
  market: DetectedMarket
): CandleProviderId {
  return PRIMARY_PROVIDER[market] ?? "yahoo";
}
