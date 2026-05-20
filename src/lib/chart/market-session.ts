export type SessionCompact = "LIVE" | "PRE" | "AH" | "CLOSED";

export type MarketStatusKind = "open" | "closed" | "pre" | "post";

export interface MarketSessionInfo {
  kind: MarketStatusKind;
  compact: SessionCompact;
  isLive: boolean;
}

export function resolveMarketSession(marketState?: string): MarketSessionInfo {
  const state = (marketState ?? "").toUpperCase();

  if (state === "REGULAR") {
    return { kind: "open", compact: "LIVE", isLive: true };
  }
  if (state === "PRE" || state === "PREPRE") {
    return { kind: "pre", compact: "PRE", isLive: false };
  }
  if (state === "POST" || state === "POSTPOST") {
    return { kind: "post", compact: "AH", isLive: false };
  }
  return { kind: "closed", compact: "CLOSED", isLive: false };
}
