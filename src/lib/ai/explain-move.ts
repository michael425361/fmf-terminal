import { buildFinancialContext, type FinancialContext } from "./context-engine";
import type { AISummaryLocale } from "./locale";
import { generateAIResponse, parseAIJson } from "./model-router";
import { clamp0to100, coerceString } from "./parse-utils";
import {
  buildExplainMoveUserPrompt,
  getExplainMoveSystemPrompt,
} from "./prompts/explain-move";

/**
 * AI Explain-Move Engine (Phase 2).
 *
 * Given a ticker and its price/volume change, gathers context (news, earnings,
 * analyst actions, sector + market trend) and produces a grounded explanation
 * with a confidence score.
 */

export interface ExplainMove {
  headline: string;
  explanation: string;
  confidence: number;
  catalysts: string;
}

export interface ExplainMoveInput {
  ticker: string;
  priceChange: number;
  volumeChange: number;
}

export interface ExplainMoveOptions {
  locale?: AISummaryLocale;
  /** Reuse a pre-built context to avoid a second data fetch. */
  context?: FinancialContext;
}

export interface ExplainMoveResult extends ExplainMove {
  ticker: string;
  locale: AISummaryLocale;
  model: string;
  generatedAt: number;
}

export async function explainMove(
  input: ExplainMoveInput,
  options: ExplainMoveOptions = {}
): Promise<ExplainMoveResult> {
  const locale = options.locale ?? "en";
  const ticker = input.ticker.trim().toUpperCase();

  const context =
    options.context ??
    (await buildFinancialContext(ticker, {
      locale,
      includeNewsSummary: true,
      newsDays: 7,
    }));

  const { content, model } = await generateAIResponse({
    task: "explain-move",
    system: getExplainMoveSystemPrompt(locale),
    user: buildExplainMoveUserPrompt({
      context,
      priceChange: input.priceChange,
      volumeChange: input.volumeChange,
      locale,
    }),
    maxTokens: 700,
    temperature: 0.25,
  });

  const parsed = parseAIJson<{
    headline?: string;
    explanation?: string;
    confidence?: number;
    catalysts?: string;
  }>(content);

  if (!parsed?.headline || !parsed.explanation) {
    throw new Error("Explain-move parse failed");
  }

  return {
    ticker,
    locale,
    model,
    headline: parsed.headline.trim(),
    explanation: parsed.explanation.trim(),
    confidence: clamp0to100(parsed.confidence),
    catalysts: coerceString(parsed.catalysts),
    generatedAt: Date.now(),
  };
}
