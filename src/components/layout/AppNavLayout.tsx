"use client";

import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { cn } from "@/lib/utils";

/**
 * Shell with desktop sidebar + mobile bottom nav (shared across dashboard-adjacent pages).
 */
export function AppNavLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("app-shell", className)}>
      <div className="flex min-h-0 flex-1">
        <MobileBottomNav />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
