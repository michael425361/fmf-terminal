"use client";

import { memo } from "react";

interface HighlightedTextProps {
  text: string;
  highlights: Array<[number, number]>;
  className?: string;
}

function HighlightedTextInner({
  text,
  highlights,
  className,
}: HighlightedTextProps) {
  if (highlights.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  const sorted = [...highlights].sort((a, b) => a[0] - b[0]);

  sorted.forEach(([start, end], i) => {
    if (start > cursor) {
      parts.push(<span key={`t-${i}-pre`}>{text.slice(cursor, start)}</span>);
    }
    parts.push(
      <mark
        key={`h-${i}`}
        className="rounded-sm bg-[var(--accent)]/25 text-[var(--accent)]"
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });

  if (cursor < text.length) {
    parts.push(<span key="tail">{text.slice(cursor)}</span>);
  }

  return <span className={className}>{parts}</span>;
}

export const HighlightedText = memo(HighlightedTextInner);
