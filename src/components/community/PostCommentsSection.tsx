"use client";

import { useTranslations } from "next-intl";
import { buildCommentThreads } from "@/lib/community/comment-threads";
import type { CommunityComment } from "@/lib/community/types";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import { CommentSkeleton } from "./CommentSkeleton";

interface PostCommentsSectionProps {
  postId: string;
  comments: CommunityComment[];
  loading?: boolean;
  onAddComment: (
    postId: string,
    body: string,
    parentId: string | null
  ) => Promise<void>;
  onRequireAuth: () => boolean;
}

export function PostCommentsSection({
  postId,
  comments,
  loading = false,
  onAddComment,
  onRequireAuth,
}: PostCommentsSectionProps) {
  const t = useTranslations("community.comments");
  const threads = buildCommentThreads(comments);

  return (
    <div className="mt-3 border-t border-[var(--border)]/60 pt-3">
      <div className="flex flex-col gap-4">
        {loading ? (
          <CommentSkeleton />
        ) : threads.length === 0 ? (
          <p className="text-center text-[10px] text-[var(--muted)]">
            {t("empty")}
          </p>
        ) : (
          threads.map(({ comment, replies }) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={replies}
              onReply={(parentId, body) => onAddComment(postId, body, parentId)}
              onRequireAuth={onRequireAuth}
            />
          ))
        )}
      </div>

      <div className="mt-4">
        <CommentInput
          onSubmit={async (body) => {
            if (!onRequireAuth()) return;
            await onAddComment(postId, body, null);
          }}
        />
      </div>
    </div>
  );
}
