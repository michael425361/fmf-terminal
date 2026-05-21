"use client";

export function CommunityPostSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded border border-[var(--border)] bg-[var(--surface-card)] p-4"
        >
          <div className="flex gap-3">
            <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex gap-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
              <div className="skeleton mb-2 h-4 w-[85%] rounded" />
              <div className="skeleton mb-1 h-3 w-full rounded" />
              <div className="skeleton h-3 w-[70%] rounded" />
              <div className="mt-3 flex gap-3">
                <div className="skeleton h-3 w-8 rounded" />
                <div className="skeleton h-3 w-8 rounded" />
                <div className="skeleton h-3 w-8 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
