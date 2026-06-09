/**
 * Lightweight structured logging + error capture.
 *
 * Emits single-line JSON so Vercel log drains / observability tools can parse
 * it. `captureError` is the single hook to forward to an external monitor
 * (e.g. Sentry) later without touching call sites.
 */

type LogLevel = "info" | "warn" | "error";

function emit(level: LogLevel, scope: string, message: string, data?: unknown) {
  const line = {
    level,
    scope,
    message,
    ...(data !== undefined ? { data } : {}),
    ts: new Date().toISOString(),
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export function logInfo(scope: string, message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "test") return;
  emit("info", scope, message, data);
}

export function logWarn(scope: string, message: string, data?: unknown): void {
  emit("warn", scope, message, data);
}

/** Single funnel for error reporting. Hook external monitoring here. */
export function captureError(
  scope: string,
  err: unknown,
  context?: Record<string, unknown>
): void {
  const message = err instanceof Error ? err.message : String(err);
  emit("error", scope, message, {
    ...context,
    stack: err instanceof Error ? err.stack : undefined,
  });
  // Place to forward to Sentry/Datadog when SENTRY_DSN is configured.
}
