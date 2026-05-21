"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { compressImageFile, uploadAvatar } from "@/lib/auth/avatar-upload";
import type { UserProfile } from "@/lib/auth/profile";
import {
  BIO_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  validateAvatarFile,
  validateProfileFields,
} from "@/lib/auth/profile-validation";
import {
  isUsernameTaken,
  updateUserProfile,
  type ProfileUpdatePayload,
} from "@/lib/auth/update-profile";
import { lockDocumentScroll } from "@/lib/scroll-to-top";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface ProfileEditModalProps {
  open: boolean;
  profile: UserProfile;
  userId: string;
  onClose: () => void;
  onSaved: (profile: UserProfile) => void;
  onToast: (message: string, variant: "success" | "error") => void;
}

export function ProfileEditModal({
  open,
  profile,
  userId,
  onClose,
  onSaved,
  onToast,
}: ProfileEditModalProps) {
  const t = useTranslations("auth.profileEdit");
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile.avatarUrl
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(profile.username);
    setBio(profile.bio ?? "");
    setPreviewUrl(profile.avatarUrl);
    setPendingFile(null);
    setFieldErrors({});
    setSaving(false);
    setUploadingAvatar(false);
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const unlock = lockDocumentScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !uploadingAvatar) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, saving, uploadingAvatar, onClose]);

  const handlePickAvatar = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const avatarError = validateAvatarFile(file, (key) => t(`errors.${key}`));
      if (avatarError) {
        setFieldErrors((prev) => ({ ...prev, avatar: avatarError }));
        onToast(avatarError, "error");
        return;
      }

      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });

      setUploadingAvatar(true);
      try {
        const blob = await compressImageFile(file);
        const localPreview = URL.createObjectURL(blob);
        setPreviewUrl(localPreview);
        setPendingFile(file);
      } catch {
        onToast(t("errors.avatarProcess"), "error");
      } finally {
        setUploadingAvatar(false);
      }
    },
    [onToast, t]
  );

  const handleSave = useCallback(async () => {
    const validation = validateProfileFields(username, bio, (key, values) =>
      t(`errors.${key}`, values)
    );
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation as Record<string, string>);
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const supabase = createClient();
      const normalized = username.trim();

      const taken = await isUsernameTaken(supabase, normalized, userId);
      if (taken) {
        setFieldErrors({ username: t("errors.usernameTaken") });
        onToast(t("errors.usernameTaken"), "error");
        return;
      }

      let avatarUrl: string | null | undefined = undefined;
      if (pendingFile) {
        setUploadingAvatar(true);
        avatarUrl = await uploadAvatar(supabase, userId, pendingFile);
        setUploadingAvatar(false);
      }

      const payload: ProfileUpdatePayload = {
        username: normalized,
        bio: bio.trim(),
        avatarUrl,
      };

      const updated = await updateUserProfile(supabase, userId, payload);
      onSaved(updated);
      onToast(t("saved"), "success");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "USERNAME_TAKEN") {
        setFieldErrors({ username: t("errors.usernameTaken") });
        onToast(t("errors.usernameTaken"), "error");
      } else {
        onToast(t("errors.saveFailed"), "error");
      }
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  }, [
    username,
    bio,
    pendingFile,
    userId,
    onSaved,
    onToast,
    onClose,
    t,
  ]);

  if (!open) return null;

  const busy = saving || uploadingAvatar;

  return (
    <div
      className="profile-edit-overlay fixed inset-0 z-[125] flex flex-col bg-[var(--background)] lg:bg-black/75 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-title"
    >
      <div className="profile-edit-panel flex min-h-0 flex-1 flex-col bg-[var(--background)] pt-[env(safe-area-inset-top,0px)] lg:mx-auto lg:my-auto lg:max-h-[92dvh] lg:w-full lg:max-w-md lg:rounded-lg lg:border lg:border-[var(--border)] lg:pt-0 lg:shadow-2xl">
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-50"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
          <h2
            id="profile-edit-title"
            className="text-sm font-semibold text-[var(--foreground)]"
          >
            {t("title")}
          </h2>
          <div className="w-9" aria-hidden />
        </header>

        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <UserAvatar
                initials={profile.avatarInitials}
                hue={profile.avatarHue}
                imageUrl={previewUrl}
                size="lg"
                className="h-24 w-24 text-base"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={busy}
              onClick={handlePickAvatar}
              className="mt-4 inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2 text-[11px] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" />
              {previewUrl ? t("changeAvatar") : t("uploadAvatar")}
            </button>
            {fieldErrors.avatar && (
              <p className="mt-2 text-[10px] text-[var(--negative)]">
                {fieldErrors.avatar}
              </p>
            )}
          </div>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("username")}
            </span>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.username;
                  return next;
                });
              }}
              maxLength={USERNAME_MAX_LENGTH}
              disabled={busy}
              className={cn(
                "w-full rounded border bg-[var(--surface-card)] px-3 py-2.5 font-mono text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]/50",
                fieldErrors.username
                  ? "border-[var(--negative)]"
                  : "border-[var(--border)]"
              )}
              autoComplete="username"
            />
            <p className="mt-1 font-mono text-[9px] text-[var(--muted)]">
              {t("usernameHint", { max: USERNAME_MAX_LENGTH })}
            </p>
            {fieldErrors.username && (
              <p className="mt-1 text-[10px] text-[var(--negative)]">
                {fieldErrors.username}
              </p>
            )}
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("bio")}
              <span className="font-mono font-normal normal-case">
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </span>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value.slice(0, BIO_MAX_LENGTH));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.bio;
                  return next;
                });
              }}
              rows={4}
              maxLength={BIO_MAX_LENGTH}
              disabled={busy}
              placeholder={t("bioPlaceholder")}
              className={cn(
                "w-full resize-none rounded border bg-[var(--surface-card)] px-3 py-2.5 text-sm leading-relaxed text-[var(--foreground)] outline-none focus:border-[var(--accent)]/50",
                fieldErrors.bio
                  ? "border-[var(--negative)]"
                  : "border-[var(--border)]"
              )}
            />
            {fieldErrors.bio && (
              <p className="mt-1 text-[10px] text-[var(--negative)]">
                {fieldErrors.bio}
              </p>
            )}
          </label>
        </div>

        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSave()}
            className="flex w-full items-center justify-center gap-2 rounded border border-[var(--accent)]/60 bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--background)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? t("saving") : t("save")}
          </button>
        </footer>
      </div>
    </div>
  );
}
