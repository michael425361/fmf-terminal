import type { PostgrestError } from "@supabase/supabase-js";

export function formatSupabaseError(error: PostgrestError | null): string {
  if (!error) return "";
  const parts = [
    error.message,
    error.code ? `code=${error.code}` : null,
    error.details ? `details=${error.details}` : null,
    error.hint ? `hint=${error.hint}` : null,
  ].filter(Boolean);
  return parts.join(" | ");
}

export function logSupabaseError(
  operation: string,
  error: PostgrestError | null,
  context?: Record<string, unknown>
): void {
  if (!error) return;
  console.error(`[community] ${operation} FAILED`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    formatted: formatSupabaseError(error),
    ...context,
  });
}

export function logSupabaseSuccess(
  operation: string,
  context: Record<string, unknown>
): void {
  console.log(`[community] ${operation}`, context);
}

export function logSupabaseEmpty(
  operation: string,
  context: Record<string, unknown>
): void {
  console.warn(
    `[community] ${operation} returned 0 rows (possible RLS block or category filter)`,
    context
  );
}
