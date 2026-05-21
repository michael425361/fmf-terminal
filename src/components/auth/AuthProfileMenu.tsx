"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LogOut, UserPen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserProfile } from "@/lib/auth/profile";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface AuthProfileMenuProps {
  profile: UserProfile;
  email?: string | null;
  profileLoading?: boolean;
  onEditProfile: () => void;
  onSignOut: () => void;
  className?: string;
}

export function AuthProfileMenu({
  profile,
  email,
  profileLoading = false,
  onEditProfile,
  onSignOut,
  className,
}: AuthProfileMenuProps) {
  const t = useTranslations("auth.profileMenu");
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  const openMenu = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
  }, []);

  const toggleMenu = useCallback(() => {
    if (openRef.current) close();
    else openMenu();
  }, [close, openMenu]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.min(280, window.innerWidth - 16);
    const padding = 8;
    let left = rect.right - menuWidth;
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));

    setMenuStyle({
      top: rect.bottom + 6,
      left,
      width: menuWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKey);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const handleEditProfile = useCallback(() => {
    close();
    window.setTimeout(() => onEditProfile(), 0);
  }, [close, onEditProfile]);

  const handleSignOut = useCallback(() => {
    close();
    void onSignOut();
  }, [close, onSignOut]);

  const menuPanel =
    open && menuStyle && mounted ? (
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={t("openMenu")}
        style={{
          position: "fixed",
          top: menuStyle.top,
          left: menuStyle.left,
          width: menuStyle.width,
        }}
        className="profile-menu-panel z-[200] rounded-lg border border-[var(--border)] bg-[var(--surface-card)] py-2 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)]/60 px-3 pb-3 pt-1">
          <UserAvatar
            initials={profile.avatarInitials}
            hue={profile.avatarHue}
            imageUrl={profile.avatarUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[var(--foreground)]">
              {profileLoading ? t("loadingUsername") : profile.username}
            </p>
            {email && (
              <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--muted)]">
                {email}
              </p>
            )}
            {profile.bio && (
              <p className="mt-1 line-clamp-2 text-[10px] text-[var(--muted)]">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          role="menuitem"
          onClick={handleEditProfile}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-elevated)] active:bg-[var(--surface-elevated)]"
        >
          <UserPen className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          {t("editProfile")}
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-[var(--muted)] transition hover:bg-[var(--surface-elevated)] hover:text-[var(--negative)] active:bg-[var(--surface-elevated)]"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {t("signOut")}
        </button>
      </div>
    ) : null;

  return (
    <>
      <div className={cn("relative z-[60]", className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMenu();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "relative flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-card)] p-0.5 pr-1.5 transition",
            "hover:border-[var(--accent)]/40 hover:bg-[var(--surface-elevated)] active:scale-[0.98]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
            open && "border-[var(--accent)]/50 ring-1 ring-[var(--accent)]/30"
          )}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={open ? menuId : undefined}
          aria-label={t("openMenu")}
        >
          {profileLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface-elevated)]" />
          ) : (
            <UserAvatar
              initials={profile.avatarInitials}
              hue={profile.avatarHue}
              imageUrl={profile.avatarUrl}
              size="sm"
              className="pointer-events-none h-8 w-8"
            />
          )}
          <ChevronDown
            className={cn(
              "pointer-events-none h-3 w-3 shrink-0 text-[var(--muted)] transition-transform duration-200",
              open && "rotate-180 text-[var(--accent)]"
            )}
          />
        </button>
      </div>

      {mounted && menuPanel && createPortal(menuPanel, document.body)}
    </>
  );
}
