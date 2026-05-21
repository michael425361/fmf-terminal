import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  LayoutDashboard,
  LineChart,
  List,
  Newspaper,
  Users,
  Wallet,
} from "lucide-react";

/** Routes handled by next-intl (locale prefix added automatically). */
export type AppNavHref = "/" | "/watchlist" | "/news" | "/community";

export interface AppNavItem {
  icon: LucideIcon;
  key:
    | "dashboard"
    | "watchlist"
    | "news"
    | "community"
    | "charts"
    | "portfolio"
    | "journal"
    | "calendar"
    | "analytics";
  href: AppNavHref | null;
}

/** Primary app sections — same on mobile bottom bar and desktop sidebar. */
export const primaryNavItems: AppNavItem[] = [
  { icon: LayoutDashboard, key: "dashboard", href: "/" },
  { icon: List, key: "watchlist", href: "/watchlist" },
  { icon: Newspaper, key: "news", href: "/news" },
  { icon: Users, key: "community", href: "/community" },
  { icon: LineChart, key: "charts", href: "/" },
];

/** Desktop sidebar extras (no route yet). */
export const secondaryNavItems: AppNavItem[] = [
  { icon: Wallet, key: "portfolio", href: null },
  { icon: BookOpen, key: "journal", href: null },
  { icon: Calendar, key: "calendar", href: null },
  { icon: BarChart3, key: "analytics", href: null },
];

/** Header text links (desktop). */
export const headerNavItems = primaryNavItems.filter(
  (item): item is AppNavItem & { href: AppNavHref } =>
    item.href !== null && item.key !== "charts" && item.key !== "dashboard"
);

export function isNavActive(
  pathname: string,
  href: AppNavHref,
  key: AppNavItem["key"]
): boolean {
  if (key === "charts") {
    return pathname === "/" || pathname.startsWith("/chart");
  }
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
