import type { UserProfile } from "@/lib/auth/profile";
import { MOCK_COMMUNITY_POSTS } from "./mock-posts";
import { getInitialMockComments } from "./mock-comments";
import type { CommunityComment, CommentsByPostId } from "./types";

export function buildComment(
  postId: string,
  body: string,
  author: UserProfile,
  parentId: string | null = null,
  options: { pending?: boolean } = {}
): CommunityComment {
  return {
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    postId,
    parentId,
    userId: author.id,
    username: author.username,
    avatarInitials: author.avatarInitials,
    avatarHue: author.avatarHue,
    avatarUrl: author.avatarUrl,
    publishedAt: new Date().toISOString(),
    body: body.trim(),
    likes: 0,
    isPending: options.pending,
    isLocal: true,
  };
}

export function createInitialCommentsState(): CommentsByPostId {
  const state = getInitialMockComments();
  for (const post of MOCK_COMMUNITY_POSTS) {
    if (!state[post.id]) state[post.id] = [];
  }
  return state;
}

export function getCommentsForPost(
  state: CommentsByPostId,
  postId: string
): CommunityComment[] {
  return state[postId] ?? [];
}

export function countCommentsForPost(
  state: CommentsByPostId,
  postId: string
): number {
  return getCommentsForPost(state, postId).length;
}

export interface CommentThreadNode {
  comment: CommunityComment;
  replies: CommunityComment[];
}

export function buildCommentThreads(
  comments: CommunityComment[]
): CommentThreadNode[] {
  const topLevel = comments
    .filter((c) => !c.parentId)
    .sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );

  const repliesByParent = new Map<string, CommunityComment[]>();
  for (const c of comments) {
    if (!c.parentId) continue;
    const list = repliesByParent.get(c.parentId) ?? [];
    list.push(c);
    repliesByParent.set(c.parentId, list);
  }

  for (const [, replies] of repliesByParent) {
    replies.sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );
  }

  return topLevel.map((comment) => ({
    comment,
    replies: repliesByParent.get(comment.id) ?? [],
  }));
}
