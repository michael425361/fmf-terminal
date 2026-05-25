import type { UserProfile } from "@/lib/auth/profile";
import type { CommunityComment } from "./types";

export function buildOptimisticComment(
  postId: string,
  body: string,
  author: UserProfile,
  options: { pending?: boolean; parentId?: string | null } = {}
): CommunityComment {
  return {
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    postId,
    parentId: options.parentId ?? null,
    userId: author.id,
    username: author.username,
    avatarInitials: author.avatarInitials,
    avatarHue: author.avatarHue,
    avatarUrl: author.avatarUrl,
    publishedAt: new Date().toISOString(),
    body: body.trim(),
    likes: 0,
    likedByMe: false,
    isPending: options.pending,
    isLocal: true,
  };
}
