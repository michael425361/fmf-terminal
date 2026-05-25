"use client";

import { useState } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatRelativeTime } from "@/lib/news/relative-time";
import { formatCount } from "@/lib/community/format";
import { UserAvatar } from "@/components/auth/UserAvatar";
import type { CommunityComment, CommunityPost } from "@/lib/community/types";
import { PostCommentsSection } from "./PostCommentsSection";
import { cn } from "@/lib/utils";

interface CommunityPostCardProps {
  post: CommunityPost;
  comments: CommunityComment[];
  commentsLoading?: boolean;
  onAddComment: (
    postId: string,
    body: string,
    parentId: string | null
  ) => Promise<void>;
  onLikeComment: (commentId: string) => void;
  onLikeToggle: (postId: string) => void;
  onBookmarkToggle: (postId: string) => void;
  onRequireAuth: () => boolean;
  onCommentsOpen?: () => void;
  className?: string;
}

export function CommunityPostCard({
  post,
  comments,
  commentsLoading = false,
  onAddComment,
  onLikeComment,
  onLikeToggle,
  onBookmarkToggle,
  onRequireAuth,
  onCommentsOpen,
  className,
}: CommunityPostCardProps) {
  const t = useTranslations("community");
  const locale = useLocale();
  const lang = locale === "zh" ? "zh" : "en";
  const timeLabel = formatRelativeTime(post.publishedAt, locale);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const commentCount = Math.max(comments.length, post.comments);
  const liked = post.likedByMe ?? false;
  const bookmarked = post.bookmarkedByMe ?? false;

  const toggleComments = () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening) onCommentsOpen?.();
  };

  return (
    <article
      className={cn(
        "community-card rounded border border-[var(--border)] bg-[var(--surface-card)] p-4 transition",
        "hover:border-[var(--accent)]/25 hover:bg-[var(--surface-elevated)]",
        post.isPending && "community-card-pending animate-pulse border-[var(--accent)]/40",
        post.isLocal && !post.isPending && "community-card-new",
        className
      )}
    >
      <div className="flex gap-3">
        <UserAvatar
          initials={post.avatarInitials}
          hue={post.avatarHue}
          imageUrl={post.avatarUrl}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs font-semibold text-[var(--foreground)]">
              {post.username}
            </span>
            <time
              dateTime={post.publishedAt}
              className="font-mono text-[10px] text-[var(--muted)]"
            >
              {timeLabel}
            </time>
          </div>

          <h2 className="mt-1.5 text-sm font-semibold leading-snug text-[var(--foreground)]">
            {post.title[lang]}
          </h2>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
            {post.content[lang]}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--accent)]"
                >
                  ${tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[var(--muted)]">
            <button
              type="button"
              onClick={() => onLikeToggle(post.id)}
              aria-pressed={liked}
              aria-label={liked ? t("likes.unlike") : t("likes.like")}
              className={cn(
                "inline-flex items-center gap-1 rounded font-mono text-[10px] transition",
                liked
                  ? "text-[var(--negative)]"
                  : "text-[var(--muted)] hover:text-[var(--negative)]"
              )}
            >
              <Heart
                className="h-3.5 w-3.5"
                strokeWidth={1.75}
                fill={liked ? "currentColor" : "none"}
              />
              {formatCount(post.likes)}
            </button>
            <button
              type="button"
              onClick={toggleComments}
              className={cn(
                "inline-flex items-center gap-1 rounded font-mono text-[10px] transition",
                commentsOpen
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--accent)]"
              )}
              aria-expanded={commentsOpen}
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatCount(commentCount)}
              <span className="ml-0.5 hidden sm:inline">
                {commentsOpen ? (
                  <ChevronUp className="inline h-3 w-3" />
                ) : (
                  <ChevronDown className="inline h-3 w-3" />
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onBookmarkToggle(post.id)}
              aria-pressed={bookmarked}
              aria-label={
                bookmarked ? t("bookmarks.remove") : t("bookmarks.save")
              }
              className={cn(
                "inline-flex items-center gap-1 rounded font-mono text-[10px] transition",
                bookmarked
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--accent)]"
              )}
            >
              <Bookmark
                className="h-3.5 w-3.5"
                strokeWidth={1.75}
                fill={bookmarked ? "currentColor" : "none"}
              />
            </button>
            <span className="inline-flex items-center gap-1 font-mono text-[10px]">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatCount(post.views)}
            </span>
          </div>

          {!commentsOpen && commentCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setCommentsOpen(true);
                onCommentsOpen?.();
              }}
              className="mt-2 text-left text-[10px] font-medium text-[var(--accent)] transition hover:underline"
            >
              {t("comments.viewComments", { count: commentCount })}
            </button>
          )}

          {commentsOpen && (
            <PostCommentsSection
              postId={post.id}
              comments={comments}
              loading={commentsLoading}
              onAddComment={onAddComment}
              onLikeComment={onLikeComment}
              onRequireAuth={onRequireAuth}
            />
          )}
        </div>
      </div>
    </article>
  );
}
