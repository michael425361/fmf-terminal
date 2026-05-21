import type { CommunityComment } from "./types";

export interface CommentThreadNode {
  comment: CommunityComment;
  replies: CommunityComment[];
}

/** Flat comments (no threading in DB) — one node per comment. */
export function buildCommentThreads(
  comments: CommunityComment[]
): CommentThreadNode[] {
  return [...comments]
    .sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    )
    .map((comment) => ({ comment, replies: [] }));
}
