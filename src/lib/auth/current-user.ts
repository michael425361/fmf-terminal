import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/saas/config";

/**
 * Returns the Clerk user id for the current request, or null when Clerk is not
 * configured / the request is unauthenticated. Safe to call anywhere on the
 * server without throwing when Clerk is disabled.
 */
export async function getAuthUserId(): Promise<string | null> {
  if (!isClerkConfigured()) return null;
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

export interface AuthUserIdentity {
  userId: string;
  email: string | null;
}

/** Resolves the current user's id + primary email (for profile sync). */
export async function getAuthIdentity(): Promise<AuthUserIdentity | null> {
  if (!isClerkConfigured()) {
    console.info("[auth] getAuthIdentity: Clerk not configured");
    return null;
  }
  try {
    const { userId } = await auth();
    if (!userId) {
      console.info("[auth] getAuthIdentity: no Clerk session (userId null)");
      return null;
    }
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      null;
    console.info("[auth] getAuthIdentity: ok", { userId });
    return { userId, email };
  } catch (err) {
    console.warn(
      "[auth] getAuthIdentity: failed",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
