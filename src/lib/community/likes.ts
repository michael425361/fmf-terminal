import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const DUPLICATE_KEY = "23505";

export async function likePost(
  postId: string,
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: userId });

  if (error && error.code !== DUPLICATE_KEY) {
    throw new Error(error.message);
  }
}

export async function unlikePost(
  postId: string,
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function hasLiked(
  postId: string,
  userId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const map = await batchHasLiked([postId], userId, client);
  return map[postId] ?? false;
}

export async function batchHasLiked(
  postIds: string[],
  userId: string,
  client?: SupabaseClient
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  if (!userId || postIds.length === 0) return result;

  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) throw new Error(error.message);

  for (const id of postIds) result[id] = false;
  for (const row of data ?? []) {
    result[row.post_id as string] = true;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[community] batchHasLiked", {
      userId,
      liked: Object.entries(result).filter(([, v]) => v).map(([k]) => k),
    });
  }

  return result;
}

export async function getLikeCount(
  postId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = client ?? createClient();
  const { count, error } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
