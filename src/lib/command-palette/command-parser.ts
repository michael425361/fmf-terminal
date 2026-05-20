import type { ParsedCommand } from "./types";

const COMMAND_PATTERNS: Array<{
  type: ParsedCommand["type"];
  re: RegExp;
}> = [
  { type: "chart", re: /^(?:chart|go)\s+(.+)$/i },
  { type: "open", re: /^(?:open|view)\s+(.+)$/i },
  { type: "switch", re: /^switch\s+(.+)$/i },
  { type: "watchlist-add", re: /^watchlist\s+add\s+(.+)$/i },
  { type: "watchlist-remove", re: /^watchlist\s+remove\s+(.+)$/i },
  { type: "search", re: /^search\s+(.+)$/i },
];

export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();
  if (!raw) {
    return { type: "search", argument: "", raw };
  }

  for (const { type, re } of COMMAND_PATTERNS) {
    const match = raw.match(re);
    if (match?.[1]) {
      return { type, argument: match[1].trim(), raw };
    }
  }

  return { type: "search", argument: raw, raw };
}

export function commandSearchQuery(cmd: ParsedCommand): string {
  if (cmd.type === "search") return cmd.argument;
  return cmd.argument;
}
