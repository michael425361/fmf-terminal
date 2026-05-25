export type CommunityCategory = "us" | "cn" | "daily";

export interface CommunityPost {
  id: string;
  category: CommunityCategory;
  userId?: string;
  username: string;
  avatarInitials: string;
  avatarHue: number;
  avatarUrl?: string | null;
  publishedAt: string;
  title: { en: string; zh: string };
  content: { en: string; zh: string };
  tags?: string[];
  likes: number;
  comments: number;
  views: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  /** Optimistic post while simulated publish completes */
  isPending?: boolean;
  isLocal?: boolean;
}

export interface CreatePostDraft {
  title: string;
  content: string;
  category: CommunityCategory;
  tagsInput: string;
}

export interface CreatePostFormErrors {
  title?: string;
  content?: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  /** null = top-level comment; otherwise reply to this comment id */
  parentId: string | null;
  userId?: string;
  username: string;
  avatarInitials: string;
  avatarHue: number;
  avatarUrl?: string | null;
  publishedAt: string;
  body: string;
  likes: number;
  likedByMe?: boolean;
  isPending?: boolean;
  isLocal?: boolean;
}

export type CommentsByPostId = Record<string, CommunityComment[]>;
