import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  formatSupabaseError,
  logSupabaseError,
  logSupabaseSuccess,
} from "./supabase-log";

const DUPLICATE_KEY = "23505";

export async function likeComment(
  commentId: string,
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: userId });

  if (error && error.code !== DUPLICATE_KEY) {
    logSupabaseError("likeComment", error, { commentId, userId });
    throw new Error(`likeComment: ${formatSupabaseError(error)}`);
  }

  logSupabaseSuccess("likeComment", { commentId, userId });
}

export async function unlikeComment(
  commentId: string,
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId);

  if (error) {
    logSupabaseError("unlikeComment", error, { commentId, userId });
    throw new Error(`unlikeComment: ${formatSupabaseError(error)}`);
  }

  logSupabaseSuccess("unlikeComment", { commentId, userId });
}

export interface CommentLikeMeta {
  counts: Record<string, number>;
  likedByMe: Record<string, boolean>;
}

/** Batch like counts + current user's likes for a set of comment ids. */
export async function fetchCommentLikeMeta(
  commentIds: string[],
  currentUserId?: string | null,
  client?: SupabaseClient
): Promise<CommentLikeMeta> {
  const counts: Record<string, number> = {};
  const likedByMe: Record<string, boolean> = {};

  if (commentIds.length === 0) {
    return { counts, likedByMe };
  }

  for (const id of commentIds) {
    counts[id] = 0;
    likedByMe[id] = false;
  }

  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds);

  if (error) {
    logSupabaseError("fetchCommentLikeMeta", error, { commentIds });
    throw new Error(`fetchCommentLikeMeta: ${formatSupabaseError(error)}`);
  }

  for (const row of data ?? []) {
    const cid = row.comment_id as string;
    counts[cid] = (counts[cid] ?? 0) + 1;
    if (currentUserId && row.user_id === currentUserId) {
      likedByMe[cid] = true;
    }
  }

  return { counts, likedByMe };
}
