"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthToast } from "@/components/auth/AuthToast";
import { ProfileEditModal } from "@/components/auth/ProfileEditModal";
import type { UserProfile } from "@/lib/auth/profile";
import { fetchOrEnsureProfile } from "@/lib/auth/profiles";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthReason = "general" | "post" | "comment" | "favorite";

type ToastState = { message: string; variant: "success" | "error" } | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  authOpen: boolean;
  authReason: AuthReason;
  profileEditOpen: boolean;
  openAuth: (reason?: AuthReason) => void;
  closeAuth: () => void;
  openProfileEdit: () => void;
  closeProfileEdit: () => void;
  requireAuth: (reason: AuthReason) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  applyProfile: (profile: UserProfile) => void;
  showToast: (message: string, variant: "success" | "error") => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<AuthReason>("general");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const loadGenRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) return null;
    return createClient();
  }, []);

  const showToast = useCallback(
    (message: string, variant: "success" | "error") => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ message, variant });
      toastTimerRef.current = setTimeout(() => setToast(null), 2800);
    },
    []
  );

  const applyProfile = useCallback((next: UserProfile) => {
    setProfile(next);
  }, []);

  const loadProfile = useCallback(
    async (nextUser: User | null) => {
      const gen = ++loadGenRef.current;

      if (!nextUser || !supabase) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const row = await fetchOrEnsureProfile(supabase, nextUser);
        if (loadGenRef.current === gen) setProfile(row);
      } catch {
        if (loadGenRef.current === gen) setProfile(null);
      } finally {
        if (loadGenRef.current === gen) setProfileLoading(false);
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setProfileLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setSession(data.session);
      setUser(u);
      setLoading(false);
      void loadProfile(u);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const u = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(u);
      setLoading(false);
      if (u) {
        setAuthOpen(false);
        void loadProfile(u);
      } else {
        loadGenRef.current += 1;
        setProfile(null);
        setProfileLoading(false);
        setProfileEditOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has("auth_error")) return;

    const message = params.get("auth_message");
    showToast(
      message
        ? decodeURIComponent(message).slice(0, 120)
        : "Sign-in failed. Check Supabase redirect URLs and OAuth providers.",
      "error"
    );

    params.delete("auth_error");
    params.delete("auth_message");
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [showToast]);

  const openAuth = useCallback((reason: AuthReason = "general") => {
    setAuthReason(reason);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const openProfileEdit = useCallback(() => {
    setProfileEditOpen(true);
  }, []);

  const closeProfileEdit = useCallback(() => setProfileEditOpen(false), []);

  const requireAuth = useCallback(
    (reason: AuthReason): boolean => {
      if (user) return true;
      openAuth(reason);
      return false;
    },
    [user, openAuth]
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setAuthOpen(false);
    setProfileEditOpen(false);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      authOpen,
      authReason,
      profileEditOpen,
      openAuth,
      closeAuth,
      openProfileEdit,
      closeProfileEdit,
      requireAuth,
      signOut,
      refreshProfile,
      applyProfile,
      showToast,
    }),
    [
      user,
      session,
      profile,
      loading,
      profileLoading,
      authOpen,
      authReason,
      profileEditOpen,
      openAuth,
      closeAuth,
      openProfileEdit,
      closeProfileEdit,
      requireAuth,
      signOut,
      refreshProfile,
      applyProfile,
      showToast,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal open={authOpen} onClose={closeAuth} reason={authReason} />
      {user && profile && (
        <ProfileEditModal
          open={profileEditOpen}
          profile={profile}
          userId={user.id}
          onClose={closeProfileEdit}
          onSaved={applyProfile}
          onToast={showToast}
        />
      )}
      {toast && (
        <AuthToast message={toast.message} variant={toast.variant} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
