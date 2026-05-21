import type { SupabaseClient } from "@supabase/supabase-js";
import { batchHasBookmarked } from "./bookmarks";
import { batchHasLiked } from "./likes";
import type { CommunityPost } from "./types";

export interface PostInteractionMeta {
  likedByMe: Record<string, boolean>;
  bookmarkedByMe: Record<string, boolean>;
}

export async function fetchPostInteractionMeta(
  postIds: string[],
  userId: string | null,
  client?: SupabaseClient
): Promise<PostInteractionMeta> {
  if (!userId || postIds.length === 0) {
    return { likedByMe: {}, bookmarkedByMe: {} };
  }

  try {
    const [likedByMe, bookmarkedByMe] = await Promise.all([
      batchHasLiked(postIds, userId, client),
      batchHasBookmarked(postIds, userId, client),
    ]);
    return { likedByMe, bookmarkedByMe };
  } catch (err) {
    console.error("[community] fetchPostInteractionMeta failed", err);
    return { likedByMe: {}, bookmarkedByMe: {} };
  }
}

export function applyPostInteractionMeta(
  posts: CommunityPost[],
  meta: PostInteractionMeta
): CommunityPost[] {
  return posts.map((p) => ({
    ...p,
    likedByMe: meta.likedByMe[p.id] ?? false,
    bookmarkedByMe: meta.bookmarkedByMe[p.id] ?? false,
  }));
}
