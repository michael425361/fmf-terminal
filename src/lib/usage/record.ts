import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { estimateCostUsd } from "@/lib/billing/pricing-table";
import type { AIFeature } from "@/lib/billing/plans";

export interface RecordUsageInput {
  userId: string;
  endpoint: string;
  feature: AIFeature | null;
  model?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  /** Whether the response was served from cache (cost is recorded as 0). */
  cached?: boolean;
}

/**
 * Records a single AI request in `usage_events`. Fire-and-forget: never throws,
 * never blocks the response. No-ops when the service-role client is missing.
 */
export async function recordUsage(input: RecordUsageInput): Promise<void> {
  const db = createAdminClient();
  if (!db) return;

  const promptTokens = Math.max(0, Math.round(input.promptTokens ?? 0));
  const completionTokens = Math.max(0, Math.round(input.completionTokens ?? 0));
  const totalTokens = promptTokens + completionTokens;
  const cached = input.cached ?? false;
  const estimatedCost = cached
    ? 0
    : estimateCostUsd(input.model, promptTokens, completionTokens);

  try {
    await db.from("usage_events").insert({
      clerk_user_id: input.userId,
      endpoint: input.endpoint,
      feature: input.feature,
      model: input.model ?? null,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCost,
      cached,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[usage] recordUsage failed:", err);
    }
  }
}
