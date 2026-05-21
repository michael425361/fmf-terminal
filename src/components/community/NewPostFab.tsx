"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface NewPostFabProps {
  onClick?: () => void;
  disabled?: boolean;
}

export function NewPostFab({ onClick, disabled }: NewPostFabProps) {
  const t = useTranslations("community");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="community-fab fixed bottom-[4.75rem] right-4 z-40 flex items-center gap-2 rounded-full border border-[var(--accent)]/50 bg-[var(--accent)] px-4 py-3 text-xs font-semibold text-[var(--background)] shadow-[0_8px_28px_rgba(245,158,11,0.35)] transition hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50 lg:bottom-8"
      aria-label={t("newPost")}
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      <span>{t("newPost")}</span>
    </button>
  );
}
