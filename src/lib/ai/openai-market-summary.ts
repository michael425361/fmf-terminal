import OpenAI from "openai";
import { normalizeAISummaryLocale, type AISummaryLocale } from "./locale";
import {
  buildMarketSummaryUserPrompt,
  getMarketSummarySystemPrompt,
} from "./market-summary-prompt";
import { assertOpenAIConfigured, getOpenAIConfig } from "./openai-config";
import type {
  MarketSummaryRequest,
  MarketSummaryResponse,
  MarketSummarySentiment,
} from "./types";

function parseSentiment(raw: unknown): MarketSummarySentiment {
  if (raw === "bullish" || raw === "bearish" || raw === "neutral") {
    return raw;
  }
  return "neutral";
}

function parseModelJson(content: string): MarketSummaryResponse | null {
  try {
    const parsed = JSON.parse(content) as {
      summary?: string;
      sentiment?: string;
      highlights?: unknown;
    };
    const summary =
      typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    if (!summary) return null;

    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights
          .filter((h): h is string => typeof h === "string")
          .map((h) => h.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    return {
      summary,
      sentiment: parseSentiment(parsed.sentiment),
      highlights,
      generatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function generateMarketSummary(
  input: MarketSummaryRequest
): Promise<MarketSummaryResponse> {
  const apiKey = assertOpenAIConfigured();
  const { model } = getOpenAIConfig();
  const locale: AISummaryLocale = normalizeAISummaryLocale(input.locale);

  const client = new OpenAI({ apiKey });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 560,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: getMarketSummarySystemPrompt(locale) },
        { role: "user", content: buildMarketSummaryUserPrompt({ ...input, locale }) },
      ],
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unknown OpenAI error";
    throw new Error(`OpenAI request failed: ${message}`);
  }

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[ai/market-summary] OpenAI ok:", {
      model,
      locale,
      finishReason: completion.choices[0]?.finish_reason,
      contentLength: content.length,
    });
  }

  const parsed = parseModelJson(content);
  if (!parsed) {
    throw new Error(
      `Failed to parse OpenAI JSON response: ${content.slice(0, 120)}`
    );
  }

  return { ...parsed, locale };
}
