/**
 * Shared parsing/normalization helpers for AI engine outputs.
 *
 * Centralized here to avoid duplication across the explain-move, research,
 * earnings and news modules.
 */

export type AISentiment = "bullish" | "bearish" | "neutral";

/** Clamp any value to an integer in the 0-100 range (defaults to 0). */
export function clamp0to100(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Trim a value to a string, or "" when not a string. */
export function coerceString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Normalize a model sentiment field to the supported enum. */
export function parseSentiment(raw: unknown): AISentiment {
  return raw === "bullish" || raw === "bearish" ? raw : "neutral";
}
