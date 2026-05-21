import type { UserProfile } from "@/lib/auth/profile";
import type { CommunityCategory, CommunityPost, CreatePostDraft } from "./types";

export function parseStockTags(input: string): string[] {
  if (!input.trim()) return [];
  return [
    ...new Set(
      input
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^\$/, "").toUpperCase())
        .filter((t) => /^[A-Z0-9]{1,6}(\.(HK|TW))?$/i.test(t))
    ),
  ].slice(0, 8);
}

export function validateCreatePostDraft(draft: CreatePostDraft): {
  title?: string;
  content?: string;
} {
  const errors: { title?: string; content?: string } = {};
  if (!draft.title.trim()) errors.title = "required";
  if (!draft.content.trim()) errors.content = "required";
  return errors;
}

export function buildPostFromDraft(
  draft: CreatePostDraft,
  author: UserProfile,
  options: { pending?: boolean } = {}
): CommunityPost {
  const title = draft.title.trim();
  const content = draft.content.trim();
  const text = { en: title, zh: title };
  const body = { en: content, zh: content };

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: draft.category,
    userId: author.id,
    username: author.username,
    avatarInitials: author.avatarInitials,
    avatarHue: author.avatarHue,
    avatarUrl: author.avatarUrl,
    publishedAt: new Date().toISOString(),
    title: text,
    content: body,
    tags: parseStockTags(draft.tagsInput),
    likes: 0,
    comments: 0,
    views: 0,
    isPending: options.pending,
    isLocal: true,
  };
}

export function sortPostsByDate(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
