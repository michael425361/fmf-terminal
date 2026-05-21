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
}

type ProfileSnippet = { username: string; avatar_url: string | null };

const COMMENT_COLUMNS = "id, post_id, user_id, content, created_at";

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

function rowToComment(
  row: CommentRow,
  profile?: ProfileSnippet | null
): CommunityComment {
  const username = profile?.username ?? "FMF_User";
  return {
    id: row.id,
    postId: row.post_id,
    parentId: null,
    userId: row.user_id,
    username,
    avatarInitials: initialsFromName(username),
    avatarHue: hashHue(row.user_id),
    avatarUrl: profile?.avatar_url ?? null,
    publishedAt: row.created_at,
    body: row.content,
    likes: 0,
  };
}

async function fetchProfileMap(
  userIds: string[],
  client: SupabaseClient
): Promise<Record<string, ProfileSnippet>> {
  if (userIds.length === 0) return {};

  const { data, error } = await client
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[community] profile lookup failed:", error.message);
    }
    return {};
  }

  const map: Record<string, ProfileSnippet> = {};
  for (const row of data ?? []) {
    map[row.id as string] = {
      username: row.username as string,
      avatar_url: (row.avatar_url as string | null) ?? null,
    };
  }
  return map;
}

async function enrichComments(
  rows: CommentRow[],
  client: SupabaseClient
): Promise<CommunityComment[]> {
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profiles = await fetchProfileMap(userIds, client);
  return rows.map((row) => rowToComment(row, profiles[row.user_id]));
}

export async function getComments(
  postId: string,
  client?: SupabaseClient
): Promise<CommunityComment[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_COLUMNS)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return enrichComments((data ?? []) as CommentRow[], supabase);
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
    .select(COMMENT_COLUMNS)
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CommentRow[];
  const enriched = await enrichComments(rows, supabase);

  const map: CommentsByPostId = {};
  for (const id of postIds) map[id] = [];

  for (const comment of enriched) {
    const list = map[comment.postId] ?? [];
    list.push(comment);
    map[comment.postId] = list;
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
    .select(COMMENT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  const row = data as CommentRow;
  return rowToComment(row, {
    username: author.username,
    avatar_url: author.avatarUrl,
  });
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
