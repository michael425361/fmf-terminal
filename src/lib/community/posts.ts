import type { SupabaseClient } from "@supabase/supabase-js";
import { initialsFromName } from "@/lib/auth/profile";
import type { UserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";
import { parseStockTags } from "./create-post";
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

function logPostsFetch(
  category: CommunityCategory,
  data: PostRow[] | null,
  error: { message: string } | null
) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[community] fetchPosts", {
    category,
    count: data?.length ?? 0,
    error: error?.message ?? null,
    ids: data?.map((r) => r.id) ?? [],
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

  logPostsFetch(category, data as PostRow[] | null, error);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PostRow[]).map(postRowToCommunityPost);
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

  if (error) throw new Error(error.message);
  if (!data) return null;

  return postRowToCommunityPost(data as PostRow);
}

export async function createPost(
  draft: CreatePostDraft,
  author: UserProfile,
  client?: SupabaseClient
): Promise<CommunityPost> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: author.id,
      username: author.username,
      avatar_url: author.avatarUrl,
      category: draft.category,
      title: draft.title.trim(),
      content: draft.content.trim(),
      ticker_tags: parseStockTags(draft.tagsInput),
    })
    .select(POST_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const post = postRowToCommunityPost(data as PostRow);
  if (process.env.NODE_ENV === "development") {
    console.log("[community] createPost", { id: post.id, category: post.category });
  }
  return post;
}

export async function deletePost(
  postId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }
}
