"use client";

import { parseCommentText } from "@/lib/community/comment-text";

export function CommentBody({ body }: { body: string }) {
  const parts = parseCommentText(body);

  return (
    <p className="text-xs leading-relaxed text-[var(--foreground)]">
      {parts.map((part, i) =>
        part.type === "tag" ? (
          <span
            key={`${i}-${part.value}`}
            className="mx-0.5 rounded bg-[var(--accent-dim)]/20 px-1 font-mono text-[10px] font-semibold text-[var(--accent)]"
          >
            ${part.value}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  );
}
