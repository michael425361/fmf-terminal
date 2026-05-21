"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { useAuth } from "@/providers/AuthProvider";
import { mergePostsForCategory } from "@/lib/community/create-post";
import { getPostsByCategory } from "@/lib/community/mock-posts";
import {
  buildComment,
  createInitialCommentsState,
  getCommentsForPost,
} from "@/lib/community/comments";
import type {
  CommentsByPostId,
  CommunityCategory,
  CommunityComment,
  CommunityPost,
} from "@/lib/community/types";
import { CommunityPostCard } from "./CommunityPostCard";
import { CreatePostModal } from "./CreatePostModal";
import { NewPostFab } from "./NewPostFab";
import { cn } from "@/lib/utils";

const TABS: CommunityCategory[] = ["us", "cn", "daily"];

export function CommunityPage() {
  const t = useTranslations("community");
  const { profile, requireAuth } = useAuth();
  const [tab, setTab] = useState<CommunityCategory>("us");
  const [modalOpen, setModalOpen] = useState(false);
  const [localPosts, setLocalPosts] = useState<CommunityPost[]>([]);
  const [commentsByPost, setCommentsByPost] =
    useState<CommentsByPostId>(createInitialCommentsState);
  const [toast, setToast] = useState<string | null>(null);

  const mockPosts = useMemo(() => getPostsByCategory(tab), [tab]);

  const posts = useMemo(
    () => mergePostsForCategory(mockPosts, localPosts, tab),
    [mockPosts, localPosts, tab]
  );

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      window.setTimeout(() => setToast(null), 2800);
    },
    []
  );

  const handleAddComment = useCallback(
    async (
      postId: string,
      body: string,
      parentId: string | null
    ) => {
      if (!profile) return;
      const pending = buildComment(postId, body, profile, parentId, {
        pending: true,
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), pending],
      }));

      await new Promise((r) => setTimeout(r, 400));

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map((c) =>
          c.id === pending.id ? { ...c, isPending: false } : c
        ),
      }));
    },
    [profile]
  );

  useEffect(() => {
    if (!profile?.id) return;

    const patchPost = (p: CommunityPost): CommunityPost =>
      p.userId === profile.id
        ? {
            ...p,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            avatarInitials: profile.avatarInitials,
            avatarHue: profile.avatarHue,
          }
        : p;

    const patchComment = (c: CommunityComment): CommunityComment =>
      c.userId === profile.id
        ? {
            ...c,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            avatarInitials: profile.avatarInitials,
            avatarHue: profile.avatarHue,
          }
        : c;

    setLocalPosts((prev) => prev.map(patchPost));
    setCommentsByPost((prev) => {
      const next: CommentsByPostId = {};
      for (const [postId, list] of Object.entries(prev)) {
        next[postId] = list.map(patchComment);
      }
      return next;
    });
  }, [
    profile?.id,
    profile?.username,
    profile?.avatarUrl,
    profile?.avatarInitials,
    profile?.avatarHue,
  ]);

  const handlePosted = useCallback(
    (post: CommunityPost, category: CommunityCategory) => {
      setLocalPosts((prev) => [post, ...prev]);
      setTab(category);
      setModalOpen(false);
      showToast(t("createPost.published"));

      if (post.isPending) {
        window.setTimeout(() => {
          setLocalPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...p, isPending: false } : p
            )
          );
        }, 700);
      }
    },
    [showToast, t]
  );

  return (
    <div className="app-shell relative">
      <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 lg:px-6">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)] lg:hidden"
          >
            FMF
          </Link>
          <h1 className="flex-1 text-sm font-semibold tracking-wide text-[var(--foreground)] lg:text-base">
            {t("title")}
          </h1>
          <AuthButton />
        </div>

        <div
          role="tablist"
          aria-label={t("title")}
          className="mx-auto flex max-w-3xl gap-0 border-t border-[var(--border)]/60 px-2 lg:px-4"
        >
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition sm:text-[11px]",
                tab === id
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {t(`tabs.${id}`)}
            </button>
          ))}
        </div>
      </header>

      <main
        data-app-scroll-root
        className="app-scroll scrollbar-thin pb-24 lg:pb-8"
      >
        <div className="mx-auto max-w-3xl px-4 py-4 lg:px-6 lg:py-6">
          {posts.length === 0 ? (
            <p className="py-12 text-center text-xs text-[var(--muted)]">
              {t("empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  comments={getCommentsForPost(commentsByPost, post.id)}
                  onAddComment={handleAddComment}
                  onRequireAuth={() => requireAuth("comment")}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <NewPostFab
        onClick={() => {
          if (!requireAuth("post")) return;
          setModalOpen(true);
        }}
        disabled={modalOpen}
      />

      <CreatePostModal
        open={modalOpen}
        defaultCategory={tab}
        onClose={() => setModalOpen(false)}
        onPosted={handlePosted}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-[7.5rem] left-1/2 z-[110] -translate-x-1/2 rounded border border-[var(--accent)]/40 bg-[var(--surface-card)] px-4 py-2 text-xs text-[var(--accent)] shadow-lg"
        >
          {toast}
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
