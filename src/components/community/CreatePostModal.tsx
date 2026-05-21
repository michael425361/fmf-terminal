"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  buildPostFromDraft,
  validateCreatePostDraft,
} from "@/lib/community/create-post";
import { useAuth } from "@/providers/AuthProvider";
import type {
  CommunityCategory,
  CommunityPost,
  CreatePostDraft,
  CreatePostFormErrors,
} from "@/lib/community/types";
import { lockDocumentScroll } from "@/lib/scroll-to-top";
import { cn } from "@/lib/utils";

const CATEGORIES: CommunityCategory[] = ["us", "cn", "daily"];

const EMPTY_DRAFT = (category: CommunityCategory): CreatePostDraft => ({
  title: "",
  content: "",
  category,
  tagsInput: "",
});

interface CreatePostModalProps {
  open: boolean;
  defaultCategory: CommunityCategory;
  onClose: () => void;
  onPosted: (post: CommunityPost, category: CommunityCategory) => void;
}

export function CreatePostModal({
  open,
  defaultCategory,
  onClose,
  onPosted,
}: CreatePostModalProps) {
  const t = useTranslations("community.createPost");
  const { profile } = useAuth();
  const [draft, setDraft] = useState<CreatePostDraft>(
    EMPTY_DRAFT(defaultCategory)
  );
  const [errors, setErrors] = useState<CreatePostFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_DRAFT(defaultCategory));
      setErrors({});
      setSubmitting(false);
    }
  }, [open, defaultCategory]);

  useEffect(() => {
    if (!open) return;
    const unlock = lockDocumentScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, submitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!profile) return;

    const validation = validateCreatePostDraft(draft);
    if (validation.title || validation.content) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const pendingPost = buildPostFromDraft(draft, profile, { pending: true });
    const category = draft.category;

    onPosted(pendingPost, category);
    onClose();

    await new Promise((r) => setTimeout(r, 650));
    setSubmitting(false);
  }, [draft, onClose, onPosted, profile]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "create-post-overlay fixed inset-0 z-[100] flex flex-col bg-[var(--background)] lg:bg-black/70 lg:p-4",
        open && "create-post-open"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
    >
      <div className="create-post-panel flex min-h-0 flex-1 flex-col bg-[var(--background)] lg:mx-auto lg:my-auto lg:max-h-[90vh] lg:w-full lg:max-w-lg lg:rounded-lg lg:border lg:border-[var(--border)] lg:shadow-2xl">
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-50"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
          <h2
            id="create-post-title"
            className="text-sm font-semibold text-[var(--foreground)]"
          >
            {t("title")}
          </h2>
          <div className="w-9" aria-hidden />
        </header>

        <form
          className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <fieldset className="mb-4" disabled={submitting}>
            <legend className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("category")}
            </legend>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, category: cat }))
                  }
                  className={cn(
                    "flex-1 rounded border px-2 py-2 text-[10px] font-semibold uppercase tracking-wide transition",
                    draft.category === cat
                      ? "border-[var(--accent)] bg-[var(--accent-dim)]/25 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-subtle)]"
                  )}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("postTitle")} *
            </span>
            <input
              value={draft.title}
              onChange={(e) => {
                setDraft((d) => ({ ...d, title: e.target.value }));
                if (errors.title) setErrors((err) => ({ ...err, title: undefined }));
              }}
              placeholder={t("postTitlePlaceholder")}
              maxLength={120}
              disabled={submitting}
              className={cn(
                "w-full rounded border bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50",
                errors.title
                  ? "border-[var(--negative)]"
                  : "border-[var(--border)]"
              )}
            />
            {errors.title && (
              <p className="mt-1 text-[10px] text-[var(--negative)]">
                {t("errors.required")}
              </p>
            )}
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("content")} *
            </span>
            <textarea
              value={draft.content}
              onChange={(e) => {
                setDraft((d) => ({ ...d, content: e.target.value }));
                if (errors.content)
                  setErrors((err) => ({ ...err, content: undefined }));
              }}
              placeholder={t("contentPlaceholder")}
              rows={8}
              maxLength={2000}
              disabled={submitting}
              className={cn(
                "w-full resize-none rounded border bg-[var(--surface-card)] px-3 py-2.5 text-sm leading-relaxed text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50",
                errors.content
                  ? "border-[var(--negative)]"
                  : "border-[var(--border)]"
              )}
            />
            {errors.content && (
              <p className="mt-1 text-[10px] text-[var(--negative)]">
                {t("errors.required")}
              </p>
            )}
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("tags")}
            </span>
            <input
              value={draft.tagsInput}
              onChange={(e) =>
                setDraft((d) => ({ ...d, tagsInput: e.target.value }))
              }
              placeholder={t("tagsPlaceholder")}
              disabled={submitting}
              className="w-full rounded border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2.5 font-mono text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50"
            />
            <p className="mt-1 text-[10px] text-[var(--muted)]">
              {t("tagsHint")}
            </p>
          </label>
        </form>

        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)]/95 p-4 backdrop-blur-md">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded border border-[var(--accent)]/60 bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--background)] transition",
              "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
