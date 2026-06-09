import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEvent {
  userId?: string | null;
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Records a security-relevant event. Fire-and-forget; never throws and no-ops
 * when the service-role client is not configured.
 */
export async function logAudit(event: AuditEvent): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  try {
    await db.from("audit_logs").insert({
      clerk_user_id: event.userId ?? null,
      action: event.action,
      resource: event.resource ?? null,
      metadata: event.metadata ?? null,
      ip: event.ip ?? null,
    });
  } catch {
    /* audit logging must never break the request path */
  }
}
