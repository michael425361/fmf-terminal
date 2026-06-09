/**
 * Next.js instrumentation hook — runs once when the server boots.
 * We use it to validate environment variables at startup (Node runtime only).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
