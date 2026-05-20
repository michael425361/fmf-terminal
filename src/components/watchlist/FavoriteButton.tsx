"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  assetId: string;
  size?: "sm" | "md";
  className?: string;
  showLabel?: boolean;
  onToggle?: (favorited: boolean) => void;
}

export function FavoriteButton({
  assetId,
  size = "sm",
  className,
  showLabel = false,
  onToggle,
}: FavoriteButtonProps) {
  const t = useTranslations("personalWatchlist");
  const { isFavorite, toggle } = useWatchlist();
  const favorited = isFavorite(assetId);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!favorited) onToggle?.(true);
        toggle(assetId);
        if (favorited) onToggle?.(false);
      }}
      className={cn(
        "group/fav inline-flex items-center gap-1 rounded border border-transparent px-1 py-0.5 transition",
        "hover:border-[var(--border)] hover:bg-[var(--surface-elevated)]",
        favorited && "text-[var(--accent)]",
        !favorited && "text-[var(--muted)] hover:text-[var(--accent)]",
        className
      )}
      title={favorited ? t("removeFromWatchlist") : t("addToWatchlist")}
      aria-label={favorited ? t("removeFromWatchlist") : t("addToWatchlist")}
      aria-pressed={favorited}
    >
      <Star
        className={cn(iconSize, "transition", favorited && "fill-[var(--accent)]")}
        strokeWidth={2}
      />
      {showLabel && (
        <span className="text-[10px] font-medium">
          {favorited ? t("favorited") : t("addToWatchlist")}
        </span>
      )}
    </button>
  );
}
