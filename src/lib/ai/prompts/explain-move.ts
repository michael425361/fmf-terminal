import type { AISummaryLocale } from "../locale";
import {
  serializeContextForPrompt,
  type FinancialContext,
} from "../context-engine";

/**
 * Explain-move prompts (Phase 10). Locale-aware. Strict JSON only.
 */

const SYSTEM_EN = `You are a markets desk analyst explaining why a specific asset moved today, for an institutional terminal.

Use ONLY the supplied context (news, earnings, analyst actions, sector and market environment, technical position). Do not invent catalysts. If the evidence is thin, say so and lower confidence.

Output JSON only, no markdown, no prose, no code fences:
{ "headline": string, "explanation": string, "confidence": number, "catalysts": string }

headline: one factual sentence naming the asset, the move, and the leading cause. Example tone: "NVIDIA rose 8.7% after stronger-than-expected data center revenue and multiple analyst upgrades."
explanation: 2-4 neutral sentences connecting the move to concrete evidence in the context. No advice, no targets, no hype.
catalysts: a concise, comma-separated list of the concrete drivers (e.g. "Q3 earnings beat, analyst upgrade, sector strength"). Empty string if none are evident.
confidence: integer 0-100 reflecting how well the context explains the move.`;

const SYSTEM_ZH = `你是机构交易终端的市场分析师，负责解释某只标的今日为何如此波动。

只能使用所提供的上下文（新闻、财报、分析师动作、板块与大盘环境、技术位置），禁止虚构催化剂。若证据薄弱，需如实说明并降低 confidence。

仅输出 JSON，禁止 markdown、禁止散文、禁止代码围栏：
{ "headline": string, "explanation": string, "confidence": number, "catalysts": string }

headline：一句客观的简体中文，点明标的、涨跌幅与主因。
explanation：2-4 句中性简体中文，将走势与上下文中的具体证据相连，不建议、无目标价、不夸张。
catalysts：用简体中文、以逗号分隔的具体驱动因素列表（如「Q3 财报超预期, 分析师上调, 板块走强」）；若无明显催化剂则为空字符串。
confidence：0-100 的整数，反映上下文对该走势的解释力。`;

export function getExplainMoveSystemPrompt(locale: AISummaryLocale): string {
  return locale === "zh" ? SYSTEM_ZH : SYSTEM_EN;
}

export function buildExplainMoveUserPrompt(input: {
  context: FinancialContext;
  priceChange: number;
  volumeChange: number;
  locale: AISummaryLocale;
}): string {
  return JSON.stringify({
    task: "explain_move",
    ticker: input.context.ticker,
    outputLanguage: input.locale === "zh" ? "Simplified Chinese" : "English",
    locale: input.locale,
    move: {
      priceChangePercent: input.priceChange,
      volumeChangePercent: input.volumeChange,
    },
    context: serializeContextForPrompt(input.context),
  });
}
