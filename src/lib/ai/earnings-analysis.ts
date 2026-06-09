import { buildFinancialContext, type FinancialContext } from "./context-engine";
import type { AISummaryLocale } from "./locale";
import { generateAIResponse, parseAIJson } from "./model-router";
import { clamp0to100, coerceString } from "./parse-utils";

/**
 * Earnings Analysis (Phase 5).
 *
 * Assesses the latest earnings report and automatically detects whether EPS
 * beat / met / missed expectations before asking the model for a qualitative
 * read on revenue, EPS, guidance, positives and negatives.
 */

export type EarningsVerdict = "beat" | "meet" | "miss" | "unknown";

export interface EarningsAnalysis {
  revenueAssessment: string;
  epsAssessment: string;
  guidanceAssessment: string;
  positives: string;
  negatives: string;
  keyTakeaways: string;
  confidence: number;
}

export interface EarningsAnalysisResult extends EarningsAnalysis {
  ticker: string;
  locale: AISummaryLocale;
  model: string;
  epsVerdict: EarningsVerdict;
  epsActual?: number;
  epsEstimate?: number;
  epsSurprisePercent?: number;
  reportPeriod?: string;
  generatedAt: number;
}

export interface EarningsAnalysisOptions {
  locale?: AISummaryLocale;
  context?: FinancialContext;
}

/**
 * Deterministic beat/meet/miss detection. A result within `tolerancePct` of
 * the estimate is treated as an in-line "meet". Exported for unit testing.
 */
export function detectVerdict(
  actual: number | null | undefined,
  estimate: number | null | undefined,
  tolerancePct = 1.5
): EarningsVerdict {
  if (actual == null || estimate == null || !Number.isFinite(actual) || !Number.isFinite(estimate)) {
    return "unknown";
  }
  if (estimate === 0) {
    if (actual === 0) return "meet";
    return actual > 0 ? "beat" : "miss";
  }
  const diffPct = ((actual - estimate) / Math.abs(estimate)) * 100;
  if (diffPct > tolerancePct) return "beat";
  if (diffPct < -tolerancePct) return "miss";
  return "meet";
}

const SYSTEM_EN = `You are an equity analyst assessing a company's latest earnings report for an institutional terminal.

Use ONLY the supplied context and the pre-computed EPS verdict. Do not invent figures. Be neutral and analytical; no advice, no price targets, no hype.

Output JSON only, no markdown, no prose, no code fences:
{ "revenueAssessment": string, "epsAssessment": string, "guidanceAssessment": string, "positives": string, "negatives": string, "keyTakeaways": string, "confidence": number }

Each assessment is 1-2 sentences. positives/negatives are concise. keyTakeaways is 1-2 sentences summarizing what matters most. confidence is an integer 0-100 reflecting data completeness; lower it when guidance or revenue data are absent.`;

const SYSTEM_ZH = `你是机构交易终端的股票分析师，负责评估公司最新财报。

只能使用所提供的上下文与预先计算好的 EPS 结论，禁止虚构数据。保持中性、专业；不建议、无目标价、不夸张。

仅输出 JSON，禁止 markdown、禁止散文、禁止代码围栏：
{ "revenueAssessment": string, "epsAssessment": string, "guidanceAssessment": string, "positives": string, "negatives": string, "keyTakeaways": string, "confidence": number }

每项评估用 1-2 句简体中文。positives/negatives 须简洁。keyTakeaways 用 1-2 句概括最关键之处。confidence 为 0-100 整数，反映数据完整度；缺少指引或营收数据时应调低。`;

export async function analyzeEarnings(
  ticker: string,
  options: EarningsAnalysisOptions = {}
): Promise<EarningsAnalysisResult> {
  const locale = options.locale ?? "en";
  const normalized = ticker.trim().toUpperCase();

  const context =
    options.context ??
    (await buildFinancialContext(normalized, {
      locale,
      includeNewsSummary: false,
      newsDays: 30,
    }));

  const latestSurprise = context.earningsData.surprises[0];
  const epsActual = latestSurprise?.actual ?? context.earningsData.lastEpsActual ?? null;
  const epsEstimate =
    latestSurprise?.estimate ?? context.earningsData.lastEpsEstimate ?? null;
  const epsVerdict = detectVerdict(epsActual, epsEstimate);
  const epsSurprisePercent =
    latestSurprise?.surprisePercent ??
    (epsActual != null && epsEstimate != null && epsEstimate !== 0
      ? Number((((epsActual - epsEstimate) / Math.abs(epsEstimate)) * 100).toFixed(2))
      : undefined);
  const reportPeriod = latestSurprise?.period ?? context.earningsData.quarterly.at(-1)?.date;

  const userPrompt = JSON.stringify({
    task: "earnings_analysis",
    ticker: normalized,
    outputLanguage: locale === "zh" ? "Simplified Chinese" : "English",
    locale,
    computed: {
      epsVerdict,
      epsActual,
      epsEstimate,
      epsSurprisePercent,
      reportPeriod,
    },
    context: {
      companyProfile: {
        name: context.companyProfile.name,
        sector: context.companyProfile.sector,
      },
      valuation: context.valuationMetrics,
      earnings: {
        recentQuarters: context.earningsData.quarterly.slice(-6),
        surprises: context.earningsData.surprises.slice(0, 6),
        nextEarningsDate: context.earningsData.nextEarningsDate,
      },
      analystRatings: context.analystRatings,
      marketEnvironment: {
        trend: context.marketEnvironment.trend,
      },
    },
  });

  const { content, model } = await generateAIResponse({
    task: "earnings-analysis",
    system: locale === "zh" ? SYSTEM_ZH : SYSTEM_EN,
    user: userPrompt,
    maxTokens: 1200,
    temperature: 0.25,
  });

  const parsed = parseAIJson<Partial<EarningsAnalysis>>(content);
  if (!parsed?.keyTakeaways && !parsed?.epsAssessment) {
    throw new Error("Earnings analysis parse failed");
  }

  return {
    ticker: normalized,
    locale,
    model,
    revenueAssessment: coerceString(parsed.revenueAssessment),
    epsAssessment: coerceString(parsed.epsAssessment),
    guidanceAssessment: coerceString(parsed.guidanceAssessment),
    positives: coerceString(parsed.positives),
    negatives: coerceString(parsed.negatives),
    keyTakeaways: coerceString(parsed.keyTakeaways),
    confidence: clamp0to100(parsed.confidence),
    epsVerdict,
    epsActual: epsActual ?? undefined,
    epsEstimate: epsEstimate ?? undefined,
    epsSurprisePercent,
    reportPeriod,
    generatedAt: Date.now(),
  };
}
