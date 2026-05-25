"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { AppNavLayout } from "@/components/layout/AppNavLayout";
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
import { likeComment, unlikeComment } from "@/lib/community/comment-likes";
import { likePost, unlikePost } from "@/lib/community/likes";
import {
  applyPostInteractionMeta,
  fetchPostInteractionMeta,
} from "@/lib/community/post-meta";
import { createPost, fetchPostById, fetchPosts } from "@/lib/community/posts";
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

  const loadGenRef = useRef(0);
  const profileIdRef = useRef<string | null>(null);
  profileIdRef.current = profile?.id ?? null;

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

  const loadCommentsForIds = useCallback(
    async (postIds: string[], gen: number) => {
      if (postIds.length === 0) return;
      try {
        const map = await getCommentsForPosts(
          postIds,
          undefined,
          profileIdRef.current
        );
        if (loadGenRef.current !== gen) return;
        setCommentsByPost(map);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[community] comments load failed:", err);
        }
      }
    },
    []
  );

  const loadInteractionMeta = useCallback(
    async (postIds: string[], gen: number) => {
      if (postIds.length === 0) return;
      const meta = await fetchPostInteractionMeta(
        postIds,
        profileIdRef.current
      );
      if (loadGenRef.current !== gen) return;
      setPosts((prev) => applyPostInteractionMeta(prev, meta));
    },
    []
  );

  const loadPosts = useCallback(async () => {
    const gen = ++loadGenRef.current;
    setLoading(true);
    setLoadError(null);

    try {
      const data = await fetchPosts(tab);
      if (loadGenRef.current !== gen) return;

      setPosts(data);
      setOptimisticPosts((prev) => prev.filter((p) => p.isPending));

      const postIds = data.map((p) => p.id);
      void loadInteractionMeta(postIds, gen);
      void loadCommentsForIds(postIds, gen);
    } catch (err) {
      if (loadGenRef.current !== gen) return;
      const message = err instanceof Error ? err.message : t("loadError");
      console.error("[community] loadPosts failed", { tab, message, err });
      setLoadError(message);
    } finally {
      if (loadGenRef.current === gen) setLoading(false);
    }
  }, [tab, t, loadCommentsForIds, loadInteractionMeta]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!profile?.id || posts.length === 0) return;

    let cancelled = false;
    const postIds = posts.map((p) => p.id);

    void (async () => {
      const meta = await fetchPostInteractionMeta(postIds, profile.id);
      if (cancelled) return;
      setPosts((prev) => applyPostInteractionMeta(prev, meta));
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const refreshComments = useCallback(
    async (postIds: string[]) => {
      if (postIds.length === 0) return;
      setCommentsLoading(true);
      try {
        const map = await getCommentsForPosts(
          postIds,
          undefined,
          profile?.id ?? null
        );
        setCommentsByPost((prev) => ({ ...prev, ...map }));
      } catch {
        showToast(t("comments.loadFailed"), "error");
      } finally {
        setCommentsLoading(false);
      }
    },
    [profile?.id, showToast, t]
  );

  const patchPostFromServer = useCallback(
    async (postId: string, patch: Partial<CommunityPost>) => {
      try {
        const refreshed = await fetchPostById(postId);
        if (!refreshed) return;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...refreshed, ...patch } : p
          )
        );
      } catch {
        /* keep optimistic values */
      }
    },
    []
  );

  const handleAddComment = useCallback(
    async (postId: string, body: string, parentId: string | null) => {
      if (!profile) return;

      if (process.env.NODE_ENV === "development") {
        console.log("Reply submit:", {
          postId,
          parentId,
          currentUser: profile.id,
          content: body,
        });
      }

      const pending = buildOptimisticComment(postId, body, profile, {
        pending: true,
        parentId,
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
        const created = await createComment(
          postId,
          body,
          profile,
          parentId
        );
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: (prev[postId] ?? [])
            .filter((c) => c.id !== pending.id)
            .concat(created),
        }));
        void refreshComments([postId]);
        void patchPostFromServer(postId, {});
        showPageToast(
          parentId ? t("comments.replyPosted") : t("comments.posted")
        );
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
    [profile, patchPostFromServer, refreshComments, showPageToast, showToast, t]
  );

  const handleCommentLikeToggle = useCallback(
    (postId: string, commentId: string) => {
      if (!profile || !requireAuth("comment")) return;

      if (process.env.NODE_ENV === "development") {
        console.log("Like clicked:", {
          commentId,
          currentUser: profile.id,
        });
      }

      let wasLiked = false;
      let nextLiked = false;

      setCommentsByPost((prev) => {
        const list = prev[postId] ?? [];
        const target = list.find((c) => c.id === commentId);
        if (!target) return prev;
        wasLiked = target.likedByMe ?? false;
        nextLiked = !wasLiked;
        const delta = nextLiked ? 1 : -1;
        return {
          ...prev,
          [postId]: list.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likedByMe: nextLiked,
                  likes: Math.max(0, c.likes + delta),
                }
              : c
          ),
        };
      });

      void (async () => {
        try {
          if (nextLiked) await likeComment(commentId, profile.id);
          else await unlikeComment(commentId, profile.id);
        } catch {
          setCommentsByPost((prev) => {
            const list = prev[postId] ?? [];
            const delta = nextLiked ? 1 : -1;
            return {
              ...prev,
              [postId]: list.map((c) =>
                c.id === commentId
                  ? {
                      ...c,
                      likedByMe: wasLiked,
                      likes: Math.max(0, c.likes - delta),
                    }
                  : c
              ),
            };
          });
          showToast(t("comments.likeFailed"), "error");
        }
      })();
    },
    [profile, requireAuth, showToast, t]
  );

  const handleLikeToggle = useCallback(
    async (postId: string) => {
      if (!profile || !requireAuth("favorite")) return;

      let wasLiked = false;
      let nextLiked = false;

      setPosts((prev) => {
        const post = prev.find((p) => p.id === postId);
        if (!post) return prev;
        wasLiked = post.likedByMe ?? false;
        nextLiked = !wasLiked;
        const delta = nextLiked ? 1 : -1;
        return prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: nextLiked,
                likes: Math.max(0, p.likes + delta),
              }
            : p
        );
      });

      try {
        if (nextLiked) await likePost(postId, profile.id);
        else await unlikePost(postId, profile.id);
        await patchPostFromServer(postId, { likedByMe: nextLiked });
      } catch {
        setPosts((prev) => {
          const post = prev.find((p) => p.id === postId);
          if (!post) return prev;
          const delta = nextLiked ? 1 : -1;
          return prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likedByMe: wasLiked,
                  likes: Math.max(0, p.likes - delta),
                }
              : p
          );
        });
        showToast(t("likes.failed"), "error");
      }
    },
    [profile, requireAuth, patchPostFromServer, showToast, t]
  );

  const handleBookmarkToggle = useCallback(
    async (postId: string) => {
      if (!profile || !requireAuth("favorite")) return;

      let wasSaved = false;
      let nextSaved = false;

      setPosts((prev) => {
        const post = prev.find((p) => p.id === postId);
        if (!post) return prev;
        wasSaved = post.bookmarkedByMe ?? false;
        nextSaved = !wasSaved;
        return prev.map((p) =>
          p.id === postId ? { ...p, bookmarkedByMe: nextSaved } : p
        );
      });

      try {
        if (nextSaved) await bookmarkPost(postId, profile.id);
        else await unbookmarkPost(postId, profile.id);
        showPageToast(
          nextSaved ? t("bookmarks.saved") : t("bookmarks.removed")
        );
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, bookmarkedByMe: wasSaved } : p
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
        if (category === tab) {
          setPosts((prev) => {
            const withoutDup = prev.filter((p) => p.id !== created.id);
            return sortPostsByDate([
              { ...created, likedByMe: false, bookmarkedByMe: false },
              ...withoutDup,
            ]);
          });
        }
        showPageToast(t("createPost.published"));
        await loadPosts();
      } catch {
        setOptimisticPosts((prev) =>
          prev.filter((p) => p.id !== optimistic.id)
        );
        showPageToast(t("createPost.failed"));
      }
    },
    [profile, tab, showPageToast, t, loadPosts]
  );

  return (
    <AppNavLayout className="relative">
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
        className="app-scroll scrollbar-thin min-w-0 pb-24 lg:pb-8"
      >
        <div className="mx-auto max-w-3xl px-4 py-4 lg:px-6 lg:py-6">
          {loadError && (
            <p className="mb-3 rounded border border-[var(--negative)]/40 bg-[var(--negative)]/10 px-3 py-2 text-xs text-[var(--negative)]">
              {loadError}
            </p>
          )}

          {loading ? (
            <CommunityPostSkeleton />
          ) : displayPosts.length === 0 && !loadError ? (
            <p className="py-12 text-center text-xs text-[var(--muted)]">
              {t("empty")}
            </p>
          ) : displayPosts.length === 0 ? null : (
            <div className="flex flex-col gap-3">
              {displayPosts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  comments={getCommentsForPost(commentsByPost, post.id)}
                  commentsLoading={commentsLoading}
                  onAddComment={handleAddComment}
                  onLikeComment={(commentId) =>
                    handleCommentLikeToggle(post.id, commentId)
                  }
                  onLikeToggle={handleLikeToggle}
                  onBookmarkToggle={handleBookmarkToggle}
                  onRequireAuth={() => requireAuth("comment")}
                  onCommentsOpen={() => void refreshComments([post.id])}
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

    </AppNavLayout>
  );
}
