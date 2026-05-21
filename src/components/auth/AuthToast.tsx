"use client";

import { cn } from "@/lib/utils";

interface AuthToastProps {
  message: string;
  variant: "success" | "error";
}

export function AuthToast({ message, variant }: AuthToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-[5.5rem] left-1/2 z-[140] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded border px-4 py-2.5 text-center text-xs shadow-lg lg:bottom-8",
        variant === "success"
          ? "border-[var(--accent)]/40 bg-[var(--surface-card)] text-[var(--accent)]"
          : "border-[var(--negative)]/40 bg-[var(--surface-card)] text-[var(--negative)]"
      )}
    >
      {message}
    </div>
  );
}
