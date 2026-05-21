import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  profileFromRow,
  profileFromUser,
  type ProfileRow,
  type UserProfile,
} from "./profile";

const PROFILE_COLUMNS = "id, username, avatar_url, bio, created_at";

/** Client-side default username (matches DB: FMF_Trader_1234) */
export function generateDefaultUsername(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `FMF_Trader_${suffix}`;
}

function oauthAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (
    (meta.avatar_url as string | undefined) ||
    (meta.picture as string | undefined) ||
    null
  );
}

async function fetchProfileRow(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[profiles] fetch failed:", error.message);
    return null;
  }

  return data as ProfileRow | null;
}

async function insertProfileWithRetry(
  supabase: SupabaseClient,
  user: User,
  maxAttempts = 5
): Promise<ProfileRow | null> {
  const avatarUrl = oauthAvatarUrl(user);

  for (let i = 0; i < maxAttempts; i++) {
    const username = generateDefaultUsername();
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        avatar_url: avatarUrl,
      })
      .select(PROFILE_COLUMNS)
      .single();

    if (data) return data as ProfileRow;

    if (error?.code === "23505") continue;
    if (error?.code === "23503") return null;

    console.warn("[profiles] insert failed:", error?.message);
    break;
  }

  return fetchProfileRow(supabase, user.id);
}

/**
 * Load profile from `public.profiles`, creating one if missing (login/signup fallback).
 */
export async function fetchOrEnsureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserProfile> {
  const existing = await fetchProfileRow(supabase, user.id);
  if (existing) return profileFromRow(existing, user.id);

  await new Promise((r) => setTimeout(r, 350));

  const afterTrigger = await fetchProfileRow(supabase, user.id);
  if (afterTrigger) return profileFromRow(afterTrigger, user.id);

  const inserted = await insertProfileWithRetry(supabase, user);
  if (inserted) return profileFromRow(inserted, user.id);

  return profileFromUser(user);
}
