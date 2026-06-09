import OpenAI from "openai";
import { assertOpenAIConfigured } from "./openai-config";

/**
 * Model router (Phase 6).
 *
 * Routes each task type to an appropriate model tier and provides automatic
 * failover to a secondary model when the primary call fails.
 */

export type AITaskType =
  | "news-summary"
  | "news-ranking"
  | "explain-move"
  | "research-report"
  | "earnings-analysis";

type ModelTier = "fast" | "deep";

/**
 * Model selection per task. `gpt-5` is used for reasoning-heavy work,
 * `gpt-4.1-mini` for fast structured tasks. Overridable via env so deployments
 * can pin available models without code changes.
 */
const TASK_TIER: Record<AITaskType, ModelTier> = {
  "news-summary": "fast",
  "news-ranking": "fast",
  "explain-move": "fast",
  "research-report": "deep",
  "earnings-analysis": "deep",
};

function fastModel(): string {
  return process.env.OPENAI_FAST_MODEL?.trim() || "gpt-4.1-mini";
}

function deepModel(): string {
  return process.env.OPENAI_DEEP_MODEL?.trim() || "gpt-5";
}

/** Final, always-available failover model. */
function fallbackModel(): string {
  return process.env.OPENAI_FALLBACK_MODEL?.trim() || "gpt-4o-mini";
}

/** Ordered model chain for a task: [primary, ...failovers]. Deduplicated. */
export function modelChainForTask(task: AITaskType): string[] {
  const tier = TASK_TIER[task];
  const primary = tier === "deep" ? deepModel() : fastModel();
  const chain = [primary, fastModel(), fallbackModel()];
  return Array.from(new Set(chain));
}

/** Reasoning models reject `temperature` and use `max_completion_tokens`. */
function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o1|o3|o4)/i.test(model);
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = assertOpenAIConfigured();
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export interface GenerateAIRequest {
  task: AITaskType;
  system: string;
  user: string;
  /** Soft cap on output tokens. */
  maxTokens?: number;
  /** Sampling temperature for non-reasoning models. */
  temperature?: number;
  /** Force JSON object output (default true). */
  json?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateAIResult {
  content: string;
  model: string;
  usedFallback: boolean;
  /** Token usage reported by the provider, when available. */
  usage?: TokenUsage;
}

async function callModel(
  model: string,
  req: GenerateAIRequest
): Promise<{ content: string; usage?: TokenUsage }> {
  const reasoning = isReasoningModel(model);

  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user },
    ],
    max_completion_tokens: req.maxTokens ?? 1200,
    // Reasoning models reject custom temperatures; omit for them.
    ...(reasoning ? {} : { temperature: req.temperature ?? 0.3 }),
    ...(req.json === false
      ? {}
      : { response_format: { type: "json_object" as const } }),
  };

  const completion = await getClient().chat.completions.create(params);
  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`Model ${model} returned empty content`);
  }
  const rawUsage = completion.usage;
  const usage: TokenUsage | undefined = rawUsage
    ? {
        promptTokens: rawUsage.prompt_tokens ?? 0,
        completionTokens: rawUsage.completion_tokens ?? 0,
        totalTokens: rawUsage.total_tokens ?? 0,
      }
    : undefined;
  return { content, usage };
}

/**
 * Generate a raw model response with routing + failover. Returns the raw string
 * content (callers parse/validate JSON via {@link parseAIJson}).
 */
export async function generateAIResponse(
  req: GenerateAIRequest
): Promise<GenerateAIResult> {
  const chain = modelChainForTask(req.task);
  let lastError: unknown;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      const { content, usage } = await callModel(model, req);
      return { content, model, usedFallback: i > 0, usage };
    } catch (err) {
      lastError = err;
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[model-router] ${model} failed (${i + 1}/${chain.length}):`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`All models failed for task ${req.task}: ${message}`);
}

/**
 * Parse a model JSON response defensively. Strips accidental code fences and
 * extracts the outermost JSON object if the model wrapped it in prose.
 */
export function parseAIJson<T>(content: string): T | null {
  const cleaned = content
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
