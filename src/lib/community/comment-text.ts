const TAG_REGEX = /\$([A-Za-z0-9.]{1,12})\b/g;

export type CommentTextPart =
  | { type: "text"; value: string }
  | { type: "tag"; value: string };

export function parseCommentText(body: string): CommentTextPart[] {
  const parts: CommentTextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const re = new RegExp(TAG_REGEX.source, TAG_REGEX.flags);
  while ((match = re.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    parts.push({ type: "tag", value: match[1].toUpperCase() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: body }];
}
