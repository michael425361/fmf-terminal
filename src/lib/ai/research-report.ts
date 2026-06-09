import { buildFinancialContext, type FinancialContext } from "./context-engine";
import type { AISummaryLocale } from "./locale";
import { generateAIResponse, parseAIJson } from "./model-router";
import { clamp0to100, coerceString } from "./parse-utils";
import {
  buildResearchReportUserPrompt,
  getResearchReportSystemPrompt,
} from "./prompts/research-report";

/**
 * AI Research Report (Phase 4).
 *
 * Institutional-style, evidence-grounded note. No hype, no investment advice.
 */

export interface ResearchReport {
  executiveSummary: string;
  bullCase: string;
  bearCase: string;
  risks: string;
  catalysts: string;
  valuationView: string;
  confidence: number;
}

export interface ResearchReportOptions {
  locale?: AISummaryLocale;
  context?: FinancialContext;
}

export interface ResearchReportResult extends ResearchReport {
  ticker: string;
  locale: AISummaryLocale;
  model: string;
  generatedAt: number;
}

export async function generateResearchReport(
  ticker: string,
  options: ResearchReportOptions = {}
): Promise<ResearchReportResult> {
  const locale = options.locale ?? "en";
  const normalized = ticker.trim().toUpperCase();

  const context =
    options.context ??
    (await buildFinancialContext(normalized, {
      locale,
      includeNewsSummary: true,
      newsDays: 21,
    }));

  const { content, model } = await generateAIResponse({
    task: "research-report",
    system: getResearchReportSystemPrompt(locale),
    user: buildResearchReportUserPrompt({ context, locale }),
    maxTokens: 2200,
    temperature: 0.3,
  });

  const parsed = parseAIJson<Partial<ResearchReport>>(content);

  if (!parsed?.executiveSummary || !parsed.bullCase || !parsed.bearCase) {
    throw new Error("Research report parse failed");
  }

  return {
    ticker: normalized,
    locale,
    model,
    executiveSummary: coerceString(parsed.executiveSummary),
    bullCase: coerceString(parsed.bullCase),
    bearCase: coerceString(parsed.bearCase),
    risks: coerceString(parsed.risks),
    catalysts: coerceString(parsed.catalysts),
    valuationView: coerceString(parsed.valuationView),
    confidence: clamp0to100(parsed.confidence),
    generatedAt: Date.now(),
  };
}
