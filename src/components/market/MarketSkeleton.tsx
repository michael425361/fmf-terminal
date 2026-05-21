"use client";

export function TickerSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex items-stretch overflow-x-auto">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex min-w-[84px] shrink-0 flex-col justify-center gap-1 border-r border-[var(--border)] px-2 py-1.5 lg:min-w-[118px] lg:gap-1.5 lg:px-3 lg:py-2"
        >
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function WatchlistSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex justify-between gap-4">
          <div className="space-y-1.5">
            <div className="skeleton h-3.5 w-16" />
            <div className="skeleton h-3 w-28" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="skeleton ml-auto h-3.5 w-20" />
            <div className="skeleton ml-auto h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <div className="skeleton m-3 min-h-[160px] flex-1 rounded" />;
}
