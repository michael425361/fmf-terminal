const DEFAULT_MODEL = "gpt-4o-mini";

/** Server-only OpenAI config (API route / server actions). */
export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  return {
    apiKey,
    model,
    isConfigured: apiKey.length > 0,
    keyPrefix: apiKey ? apiKey.slice(0, 10) : "(missing)",
  };
}

export function assertOpenAIConfigured(): string {
  const { apiKey, isConfigured } = getOpenAIConfig();
  if (!isConfigured) {
    throw new Error(
      "OPENAI_API_KEY not configured — add it to .env.local and restart npm run dev"
    );
  }
  return apiKey;
}
