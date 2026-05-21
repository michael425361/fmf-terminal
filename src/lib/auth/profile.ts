import type { User } from "@supabase/supabase-js";

export interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarInitials: string;
  avatarHue: number;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | null;
}

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const single = parts[0] ?? "?";
  return single.slice(0, 2).toUpperCase();
}

export function profileFromRow(row: ProfileRow, userId?: string): UserProfile {
  const id = row.id ?? userId ?? "";
  const username = row.username?.trim() || "FMF_Trader";
  return {
    id,
    username,
    avatarInitials: initialsFromName(username),
    avatarHue: hashHue(id),
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
  };
}

/** Fallback when DB profile is unavailable */
export function profileFromUser(user: User): UserProfile {
  const meta = user.user_metadata ?? {};
  const fullName =
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    (meta.user_name as string | undefined);

  const emailLocal = user.email?.split("@")[0];
  const username =
    fullName?.trim() ||
    emailLocal ||
    `FMF_Trader_${user.id.slice(0, 4)}`;

  const avatarUrl =
    (meta.avatar_url as string | undefined) ||
    (meta.picture as string | undefined) ||
    null;

  return {
    id: user.id,
    username,
    avatarInitials: initialsFromName(username),
    avatarHue: hashHue(user.id),
    avatarUrl,
    bio: null,
    createdAt: null,
  };
}
