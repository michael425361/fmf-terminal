/**
 * Per-model OpenAI pricing (USD per 1M tokens) used to estimate AI cost.
 *
 * These are estimates for internal cost analytics / margin tracking — keep them
 * roughly aligned with the live OpenAI price list. Unknown models fall back to a
 * conservative default so cost is never silently zero.
 */

export interface ModelPrice {
  /** USD per 1M input (prompt) tokens. */
  inputPerMillion: number;
  /** USD per 1M output (completion) tokens. */
  outputPerMillion: number;
}

const DEFAULT_PRICE: ModelPrice = {
  inputPerMillion: 5,
  outputPerMillion: 15,
};

const PRICES: Record<string, ModelPrice> = {
  "gpt-5": { inputPerMillion: 1.25, outputPerMillion: 10 },
  "gpt-4.1": { inputPerMillion: 2, outputPerMillion: 8 },
  "gpt-4.1-mini": { inputPerMillion: 0.4, outputPerMillion: 1.6 },
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
};

/** Normalizes a model id (e.g. "gpt-4o-mini-2024-07-18" -> "gpt-4o-mini"). */
function normalizeModel(model: string): string {
  const lower = model.toLowerCase();
  const known = Object.keys(PRICES)
    .sort((a, b) => b.length - a.length)
    .find((key) => lower.startsWith(key));
  return known ?? lower;
}

export function getModelPrice(model: string | null | undefined): ModelPrice {
  if (!model) return DEFAULT_PRICE;
  return PRICES[normalizeModel(model)] ?? DEFAULT_PRICE;
}

/** Estimated cost in USD for a single completion. */
export function estimateCostUsd(
  model: string | null | undefined,
  promptTokens: number,
  completionTokens: number
): number {
  const price = getModelPrice(model);
  const cost =
    (promptTokens / 1_000_000) * price.inputPerMillion +
    (completionTokens / 1_000_000) * price.outputPerMillion;
  // Round to 6 decimals (matches numeric(12,6) DB column).
  return Math.round(cost * 1_000_000) / 1_000_000;
}
