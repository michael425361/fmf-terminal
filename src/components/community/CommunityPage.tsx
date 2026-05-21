"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { useAuth } from "@/providers/AuthProvider";
import {
  buildPostFromDraft,
  sortPostsByDate,
} from "@/lib/community/create-post";
import { buildOptimisticComment } from "@/lib/community/comment-build";
import {
  createComment,
  getCommentsForPost,
  getCommentsForPosts,
} from "@/lib/community/comments";
import { bookmarkPost, unbookmarkPost } from "@/lib/community/bookmarks";
import { likePost, unlikePost } from "@/lib/community/likes";
import {
  applyPostInteractionMeta,
  fetchPostInteractionMeta,
} from "@/lib/community/post-meta";
import { createPost, fetchPosts } from "@/lib/community/posts";
import type {
  CommentsByPostId,
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CreatePostDraft,
} from "@/lib/community/types";
import { CommunityPostCard } from "./CommunityPostCard";
import { CommunityPostSkeleton } from "./CommunityPostSkeleton";
import { CreatePostModal } from "./CreatePostModal";
import { NewPostFab } from "./NewPostFab";
import { cn } from "@/lib/utils";

const TABS: CommunityCategory[] = ["us", "cn", "daily"];

export function CommunityPage() {
  const t = useTranslations("community");
  const { profile, requireAuth, showToast } = useAuth();
  const [tab, setTab] = useState<CommunityCategory>("us");
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [optimisticPosts, setOptimisticPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<CommentsByPostId>({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const displayPosts = useMemo(() => {
    const pending = optimisticPosts.filter((p) => p.category === tab);
    const serverIds = new Set(posts.map((p) => p.id));
    const pendingOnly = pending.filter((p) => !serverIds.has(p.id));
    return sortPostsByDate([...pendingOnly, ...posts]);
  }, [optimisticPosts, posts, tab]);

  const showPageToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPosts(tab);
      const postIds = data.map((p) => p.id);

      const [meta, commentsMap] = await Promise.all([
        fetchPostInteractionMeta(postIds, profile?.id ?? null),
        getCommentsForPosts(postIds),
      ]);

      setPosts(applyPostInteractionMeta(data, meta));
      setCommentsByPost(commentsMap);
      setOptimisticPosts((prev) => prev.filter((p) => p.isPending));
    } catch (err) {
      setPosts([]);
      setCommentsByPost({});
      setLoadError(
        err instanceof Error ? err.message : t("loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [tab, t, profile?.id]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const refreshComments = useCallback(
    async (postIds: string[]) => {
      if (postIds.length === 0) return;
      setCommentsLoading(true);
      try {
        const map = await getCommentsForPosts(postIds);
        setCommentsByPost((prev) => ({ ...prev, ...map }));
      } catch {
        showToast(t("comments.loadFailed"), "error");
      } finally {
        setCommentsLoading(false);
      }
    },
    [showToast, t]
  );

  const handleAddComment = useCallback(
    async (postId: string, body: string, _parentId: string | null) => {
      if (!profile) return;
      const pending = buildOptimisticComment(postId, body, profile, {
        pending: true,
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), pending],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p
        )
      );

      try {
        const created = await createComment(postId, body, profile);
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: (prev[postId] ?? [])
            .filter((c) => c.id !== pending.id)
            .concat(created),
        }));
        showPageToast(t("comments.posted"));
      } catch {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: (prev[postId] ?? []).filter((c) => c.id !== pending.id),
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, comments: Math.max(0, p.comments - 1) }
              : p
          )
        );
        showToast(t("comments.postFailed"), "error");
      }
    },
    [profile, showPageToast, showToast, t]
  );

  const handleLikeToggle = useCallback(
    async (post: CommunityPost) => {
      if (!profile || !requireAuth("favorite")) return;

      const wasLiked = post.likedByMe ?? false;
      const nextLiked = !wasLiked;
      const delta = nextLiked ? 1 : -1;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likedByMe: nextLiked,
                likes: Math.max(0, p.likes + delta),
              }
            : p
        )
      );

      try {
        if (nextLiked) await likePost(post.id, profile.id);
        else await unlikePost(post.id, profile.id);
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  likedByMe: wasLiked,
                  likes: Math.max(0, p.likes - delta),
                }
              : p
          )
        );
        showToast(t("likes.failed"), "error");
      }
    },
    [profile, requireAuth, showToast, t]
  );

  const handleBookmarkToggle = useCallback(
    async (post: CommunityPost) => {
      if (!profile || !requireAuth("favorite")) return;

      const wasSaved = post.bookmarkedByMe ?? false;
      const nextSaved = !wasSaved;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, bookmarkedByMe: nextSaved } : p
        )
      );

      try {
        if (nextSaved) await bookmarkPost(post.id, profile.id);
        else await unbookmarkPost(post.id, profile.id);
        showPageToast(
          nextSaved ? t("bookmarks.saved") : t("bookmarks.removed")
        );
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, bookmarkedByMe: wasSaved } : p
          )
        );
        showToast(t("bookmarks.failed"), "error");
      }
    },
    [profile, requireAuth, showPageToast, showToast, t]
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

    setPosts((prev) => prev.map(patchPost));
    setOptimisticPosts((prev) => prev.map(patchPost));
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

  const handleCreatePost = useCallback(
    async (draft: CreatePostDraft) => {
      if (!profile) return;

      const category = draft.category;
      const optimistic = buildPostFromDraft(draft, profile, { pending: true });

      setOptimisticPosts((prev) => [optimistic, ...prev]);
      setTab(category);
      setModalOpen(false);
      showPageToast(t("createPost.publishing"));

      try {
        const created = await createPost(draft, profile);
        setOptimisticPosts((prev) =>
          prev.filter((p) => p.id !== optimistic.id)
        );
        setPosts((prev) => {
          const withoutDup = prev.filter((p) => p.id !== created.id);
          return sortPostsByDate([created, ...withoutDup]);
        });
        showPageToast(t("createPost.published"));
        await loadPosts();
      } catch {
        setOptimisticPosts((prev) =>
          prev.filter((p) => p.id !== optimistic.id)
        );
        showPageToast(t("createPost.failed"));
      }
    },
    [profile, showPageToast, t, loadPosts]
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
          {loadError && (
            <p className="mb-3 rounded border border-[var(--negative)]/40 bg-[var(--negative)]/10 px-3 py-2 text-xs text-[var(--negative)]">
              {loadError}
            </p>
          )}

          {loading ? (
            <CommunityPostSkeleton />
          ) : displayPosts.length === 0 ? (
            <p className="py-12 text-center text-xs text-[var(--muted)]">
              {t("empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {displayPosts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  comments={getCommentsForPost(commentsByPost, post.id)}
                  commentsLoading={commentsLoading}
                  onAddComment={handleAddComment}
                  onLikeToggle={() => void handleLikeToggle(post)}
                  onBookmarkToggle={() => void handleBookmarkToggle(post)}
                  onRequireAuth={() => requireAuth("comment")}
                  onCommentsOpen={() =>
                    void refreshComments([post.id])
                  }
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
        onSubmit={handleCreatePost}
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
