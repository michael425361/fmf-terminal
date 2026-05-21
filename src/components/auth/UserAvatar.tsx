"use client";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  initials: string;
  hue: number;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  sm: "h-7 w-7 text-[9px]",
  md: "h-10 w-10 text-xs",
  lg: "h-11 w-11 text-sm",
} as const;

export function UserAvatar({
  initials,
  hue,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const dim = SIZE[size];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={cn(
          "shrink-0 rounded-full border border-[var(--border)] object-cover",
          dim,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] font-mono font-bold text-[var(--foreground)]",
        dim,
        className
      )}
      style={{
        background: `hsla(${hue}, 55%, 42%, 0.22)`,
        boxShadow: `inset 0 0 12px hsla(${hue}, 70%, 50%, 0.12)`,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
