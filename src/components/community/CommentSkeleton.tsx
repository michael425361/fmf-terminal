import { cn } from "@/lib/utils";

export function CommentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-2 animate-pulse">
          <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--border)]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2.5 w-24 rounded bg-[var(--border)]" />
            <div className="h-2 w-full rounded bg-[var(--border)]/80" />
            <div className="h-2 w-4/5 rounded bg-[var(--border)]/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
