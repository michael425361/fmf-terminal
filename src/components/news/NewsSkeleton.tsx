"use client";

export function NewsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded border border-[var(--border)] bg-[var(--surface-card)] p-4"
        >
          <div className="mb-3 flex gap-2">
            <div className="skeleton h-4 w-14 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
          </div>
          <div className="skeleton mb-2 h-4 w-full rounded" />
          <div className="skeleton mb-2 h-4 w-[92%] rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton mt-2 h-3 w-[80%] rounded" />
        </div>
      ))}
    </div>
  );
}
