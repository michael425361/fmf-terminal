"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Heart, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatRelativeTime } from "@/lib/news/relative-time";
import { formatCount } from "@/lib/community/mock-posts";
import { UserAvatar } from "@/components/auth/UserAvatar";
import type { CommunityComment } from "@/lib/community/types";
import { CommentBody } from "./CommentBody";
import { CommentInput } from "./CommentInput";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: CommunityComment;
  replies?: CommunityComment[];
  depth?: number;
  onReply: (parentId: string, body: string) => Promise<void>;
  onRequireAuth: () => boolean;
}

export function CommentItem({
  comment,
  replies = [],
  depth = 0,
  onReply,
  onRequireAuth,
}: CommentItemProps) {
  const t = useTranslations("community.comments");
  const locale = useLocale();
  const [repliesOpen, setRepliesOpen] = useState(replies.length <= 2);
  const [replying, setReplying] = useState(false);

  const timeLabel = formatRelativeTime(comment.publishedAt, locale);
  const hasReplies = replies.length > 0;

  return (
    <div
      className={cn(
        depth > 0 && "ml-4 border-l border-[var(--border)]/60 pl-3 sm:ml-5",
        comment.isPending && "opacity-70"
      )}
    >
      <div className="flex gap-2">
        <UserAvatar
          initials={comment.avatarInitials}
          hue={comment.avatarHue}
          imageUrl={comment.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-[11px] font-semibold text-[var(--foreground)]">
              {comment.username}
            </span>
            <time className="font-mono text-[9px] text-[var(--muted)]">
              {timeLabel}
            </time>
          </div>
          <div className="mt-1">
            <CommentBody body={comment.body} />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--muted)]">
              <Heart className="h-3 w-3" />
              {formatCount(comment.likes)}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!replying && !onRequireAuth()) return;
                setReplying((r) => !r);
              }}
              className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--muted)] transition hover:text-[var(--accent)]"
            >
              <MessageCircle className="h-3 w-3" />
              {t("reply")}
            </button>
          </div>

          {replying && (
            <div className="mt-2">
              <CommentInput
                compact
                autoFocus
                placeholder={t("replyPlaceholder")}
                submitLabel={t("replySubmit")}
                onCancel={() => setReplying(false)}
                onSubmit={async (body) => {
                  if (!onRequireAuth()) return;
                  await onReply(comment.id, body);
                  setReplying(false);
                  setRepliesOpen(true);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {hasReplies && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setRepliesOpen((o) => !o)}
            className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--accent)] transition hover:underline"
          >
            {repliesOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {repliesOpen
              ? t("hideReplies", { count: replies.length })
              : t("viewReplies", { count: replies.length })}
          </button>

          {repliesOpen && (
            <div className="mt-2 flex flex-col gap-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onReply={onReply}
                  onRequireAuth={onRequireAuth}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
