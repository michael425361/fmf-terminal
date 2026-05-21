import type { SupabaseClient } from "@supabase/supabase-js";
import { initialsFromName } from "@/lib/auth/profile";
import type { UserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";
import type { CommentsByPostId, CommunityComment } from "./types";

export interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null } | null;
}

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

function rowToComment(row: CommentRow): CommunityComment {
  const username = row.profiles?.username ?? "FMF_User";
  return {
    id: row.id,
    postId: row.post_id,
    parentId: null,
    userId: row.user_id,
    username,
    avatarInitials: initialsFromName(username),
    avatarHue: hashHue(row.user_id),
    avatarUrl: row.profiles?.avatar_url ?? null,
    publishedAt: row.created_at,
    body: row.content,
    likes: 0,
  };
}

const COMMENT_SELECT =
  "id, post_id, user_id, content, created_at, profiles(username, avatar_url)";

export async function getComments(
  postId: string,
  client?: SupabaseClient
): Promise<CommunityComment[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as CommentRow[]).map(rowToComment);
}

/** Batch-load comments for many posts (avoids N+1). */
export async function getCommentsForPosts(
  postIds: string[],
  client?: SupabaseClient
): Promise<CommentsByPostId> {
  if (postIds.length === 0) return {};

  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const map: CommentsByPostId = {};
  for (const id of postIds) map[id] = [];

  for (const row of (data ?? []) as CommentRow[]) {
    const list = map[row.post_id] ?? [];
    list.push(rowToComment(row));
    map[row.post_id] = list;
  }

  return map;
}

export async function createComment(
  postId: string,
  content: string,
  author: UserProfile,
  client?: SupabaseClient
): Promise<CommunityComment> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: author.id,
      content: content.trim(),
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return rowToComment(data as CommentRow);
}

export async function deleteComment(
  commentId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw new Error(error.message);
}

export function getCommentsForPost(
  map: CommentsByPostId,
  postId: string
): CommunityComment[] {
  return map[postId] ?? [];
}
