"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { AuthProfileMenu } from "./AuthProfileMenu";
import { cn } from "@/lib/utils";

interface AuthButtonProps {
  className?: string;
}

export function AuthButton({ className }: AuthButtonProps) {
  const t = useTranslations("auth");
  const {
    user,
    profile,
    loading,
    profileLoading,
    openAuth,
    openProfileEdit,
    signOut,
  } = useAuth();

  if (loading) {
    return (
      <div
        className={cn(
          "h-9 w-9 animate-pulse rounded-full border border-[var(--border)] bg-[var(--surface-card)]",
          className
        )}
        aria-label={t("profileMenu.loading")}
        role="status"
      />
    );
  }

  if (user && profile) {
    return (
      <AuthProfileMenu
        profile={profile}
        email={user.email}
        profileLoading={profileLoading}
        onEditProfile={openProfileEdit}
        onSignOut={signOut}
        className={className}
      />
    );
  }

  if (user && profileLoading) {
    return (
      <div
        className={cn(
          "flex h-9 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-card)] px-1 pr-2",
          className
        )}
        role="status"
        aria-label={t("profileMenu.loading")}
      >
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface-elevated)]" />
        <span className="hidden text-[10px] text-[var(--muted)] sm:inline">
          {t("profileMenu.loading")}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openAuth("general")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded border border-[var(--accent)]/40 bg-[var(--accent-dim)]/20 px-2.5 py-1.5 text-[10px] font-semibold text-[var(--accent)] transition hover:border-[var(--accent)]/60",
        className
      )}
    >
      <LogIn className="h-3.5 w-3.5" />
      {t("signIn")}
    </button>
  );
}
