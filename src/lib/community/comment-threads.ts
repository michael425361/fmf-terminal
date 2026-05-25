import type { CommunityComment } from "./types";

export interface CommentThreadNode {
  comment: CommunityComment;
  replies: CommunityComment[];
}

/** Build top-level threads with nested replies from parent_id. */
export function buildCommentThreads(
  comments: CommunityComment[]
): CommentThreadNode[] {
  const sorted = [...comments].sort(
    (a, b) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const byId = new Map(sorted.map((c) => [c.id, c]));
  const repliesByParent = new Map<string, CommunityComment[]>();
  const roots: CommunityComment[] = [];

  for (const comment of sorted) {
    const parentId = comment.parentId;
    if (parentId && byId.has(parentId)) {
      const list = repliesByParent.get(parentId) ?? [];
      list.push(comment);
      repliesByParent.set(parentId, list);
    } else {
      roots.push(comment);
    }
  }

  return roots.map((comment) => ({
    comment,
    replies: repliesByParent.get(comment.id) ?? [],
  }));
}
