import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { initialsFromName } from "@/lib/auth/profile";
import type { UserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";
import { parseStockTags } from "./create-post";
import {
  formatSupabaseError,
  logSupabaseEmpty,
  logSupabaseError,
  logSupabaseSuccess,
} from "./supabase-log";
import type {
  CommunityCategory,
  CommunityPost,
  CreatePostDraft,
} from "./types";

export interface PostRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  category: CommunityCategory;
  title: string;
  content: string;
  ticker_tags: string[] | null;
  like_count: number;
  comment_count: number;
  view_count: number;
}

const POST_COLUMNS =
  "id, created_at, updated_at, user_id, username, avatar_url, category, title, content, ticker_tags, like_count, comment_count, view_count";

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

export function postRowToCommunityPost(row: PostRow): CommunityPost {
  const title = row.title;
  const content = row.content;

  return {
    id: row.id,
    category: row.category,
    userId: row.user_id,
    username: row.username,
    avatarInitials: initialsFromName(row.username),
    avatarHue: hashHue(row.user_id),
    avatarUrl: row.avatar_url,
    publishedAt: row.created_at,
    title: { en: title, zh: title },
    content: { en: content, zh: content },
    tags: row.ticker_tags ?? [],
    likes: row.like_count,
    comments: row.comment_count,
    views: row.view_count,
  };
}

async function diagnoseEmptyPostsFetch(
  supabase: SupabaseClient,
  category: CommunityCategory,
  error: PostgrestError | null
): Promise<void> {
  const { count: totalCount, error: totalErr } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  const { count: categoryCount, error: catErr } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("category", category);

  logSupabaseEmpty("fetchPosts", {
    category,
    filterError: error ? formatSupabaseError(error) : null,
    totalCount: totalCount ?? 0,
    categoryCount: categoryCount ?? 0,
    totalCountError: totalErr ? formatSupabaseError(totalErr) : null,
    categoryCountError: catErr ? formatSupabaseError(catErr) : null,
    hint:
      totalCount === 0 && !totalErr
        ? "RLS likely blocking SELECT on public.posts — run supabase/migrations/005_fix_posts_rls.sql"
        : categoryCount === 0 && (totalCount ?? 0) > 0
          ? "Posts exist but none in this category tab"
          : null,
  });
}

export async function fetchPosts(
  category: CommunityCategory,
  client?: SupabaseClient
): Promise<CommunityPost[]> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchPosts", error, { category });
    throw new Error(`fetchPosts: ${formatSupabaseError(error)}`);
  }

  const rows = (data ?? []) as PostRow[];

  if (rows.length === 0) {
    await diagnoseEmptyPostsFetch(supabase, category, null);
  } else {
    logSupabaseSuccess("fetchPosts", {
      category,
      count: rows.length,
      ids: rows.map((r) => r.id),
    });
  }

  return rows.map(postRowToCommunityPost);
}

export async function fetchPostById(
  postId: string,
  client?: SupabaseClient
): Promise<CommunityPost | null> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    logSupabaseError("fetchPostById", error, { postId });
    throw new Error(`fetchPostById: ${formatSupabaseError(error)}`);
  }

  if (!data) {
    logSupabaseEmpty("fetchPostById", { postId });
    return null;
  }

  return postRowToCommunityPost(data as PostRow);
}

export async function createPost(
  draft: CreatePostDraft,
  author: UserProfile,
  client?: SupabaseClient
): Promise<CommunityPost> {
  const supabase = client ?? createClient();

  const payload = {
    user_id: author.id,
    username: author.username,
    avatar_url: author.avatarUrl,
    category: draft.category,
    title: draft.title.trim(),
    content: draft.content.trim(),
    ticker_tags: parseStockTags(draft.tagsInput),
  };

  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
    .select(POST_COLUMNS)
    .single();

  if (error) {
    logSupabaseError("createPost.insert", error, {
      category: draft.category,
      userId: author.id,
    });
    throw new Error(`createPost: ${formatSupabaseError(error)}`);
  }

  const post = postRowToCommunityPost(data as PostRow);
  logSupabaseSuccess("createPost.insert", {
    id: post.id,
    category: post.category,
    userId: post.userId,
  });

  const readable = await fetchPostById(post.id, supabase);
  if (!readable) {
    const msg =
      "createPost: row inserted but not readable after insert. Run 005_fix_posts_rls.sql — posts SELECT policy missing for anon/authenticated.";
    console.error(`[community] ${msg}`, { postId: post.id, category: post.category });
    throw new Error(msg);
  }

  logSupabaseSuccess("createPost.verifyRead", { id: post.id });
  return post;
}

export async function deletePost(
  postId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    logSupabaseError("deletePost", error, { postId });
    throw new Error(`deletePost: ${formatSupabaseError(error)}`);
  }
}
