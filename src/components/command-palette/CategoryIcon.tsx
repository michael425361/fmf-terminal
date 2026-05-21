"use client";

import {
  BarChart3,
  Bitcoin,
  Building2,
  Coins,
  Globe,
  LineChart,
  Wheat,
} from "lucide-react";
import type { AssetType } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  assetType: AssetType;
  className?: string;
}

export function CategoryIcon({ assetType, className }: CategoryIconProps) {
  const iconClass = cn("h-3.5 w-3.5 shrink-0", className);

  switch (assetType) {
    case "crypto":
      return <Bitcoin className={cn(iconClass, "text-[var(--accent)]")} />;
    case "forex":
      return <Globe className={cn(iconClass, "text-[var(--info)]")} />;
    case "commodity":
      return <Wheat className={cn(iconClass, "text-[var(--accent)]")} />;
    case "index":
      return <LineChart className={cn(iconClass, "text-[var(--positive)]")} />;
    case "etf":
      return <BarChart3 className={cn(iconClass, "text-[var(--muted)]")} />;
    case "cn_stock":
      return <Building2 className={cn(iconClass, "text-red-400")} />;
    case "hk_stock":
      return <Building2 className={cn(iconClass, "text-amber-300")} />;
    case "tw_stock":
      return <Building2 className={cn(iconClass, "text-teal-300")} />;
    case "us_stock":
      return <Coins className={cn(iconClass, "text-[var(--foreground)]")} />;
    default:
      return <BarChart3 className={iconClass} />;
  }
}
