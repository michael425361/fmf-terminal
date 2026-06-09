import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBootstrapAdminIds } from "./config";

/**
 * Admin authorization. A user is an admin if their Clerk id is in the
 * ADMIN_CLERK_USER_IDS bootstrap list or has role='admin' in app_roles.
 */
export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  if (getBootstrapAdminIds().includes(userId)) return true;

  const db = createAdminClient();
  if (!db) return false;

  const { data, error } = await db
    .from("app_roles")
    .select("role")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === "admin";
}
