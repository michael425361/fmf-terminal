import {
  buildMarketSummaryUserPrompt,
  MARKET_SUMMARY_SYSTEM_PROMPT,
} from "./market-summary-prompt";
import type {
  MarketSummaryRequest,
  MarketSummaryResponse,
  MarketSummarySentiment,
} from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";

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
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 560,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MARKET_SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: buildMarketSummaryUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `OpenAI ${res.status}: ${errText.slice(0, 200) || res.statusText}`
    );
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI returned empty content");

  const parsed = parseModelJson(content);
  if (!parsed) throw new Error("Failed to parse OpenAI JSON response");

  return parsed;
}
