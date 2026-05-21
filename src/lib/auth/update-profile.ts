import type { SupabaseClient } from "@supabase/supabase-js";
import { profileFromRow, type ProfileRow, type UserProfile } from "./profile";
import { normalizeUsername } from "./profile-validation";

const PROFILE_COLUMNS = "id, username, avatar_url, bio, created_at";

export interface ProfileUpdatePayload {
  username: string;
  bio: string;
  avatarUrl?: string | null;
}

export async function isUsernameTaken(
  supabase: SupabaseClient,
  username: string,
  excludeUserId: string
): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .neq("id", excludeUserId)
    .maybeSingle();

  if (error) {
    console.warn("[profiles] username check failed:", error.message);
    return false;
  }

  return Boolean(data);
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: ProfileUpdatePayload
): Promise<UserProfile> {
  const row: Partial<ProfileRow> = {
    username: normalizeUsername(payload.username),
    bio: payload.bio.trim() || null,
  };

  if (payload.avatarUrl !== undefined) {
    row.avatar_url = payload.avatarUrl;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("USERNAME_TAKEN");
    }
    throw new Error(error.message);
  }

  return profileFromRow(data as ProfileRow, userId);
}
