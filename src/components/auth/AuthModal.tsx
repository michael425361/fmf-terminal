"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { lockDocumentScroll } from "@/lib/scroll-to-top";
import {
  buildOAuthCallbackUrl,
  logOAuthClick,
} from "@/lib/auth/oauth";
import type { Locale } from "@/i18n/routing";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AuthReason } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

type EmailMode = "signIn" | "signUp";

interface AuthModalProps {
  open: boolean;
  reason: AuthReason;
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.79 15.25 6.18 7.03 11.38 6.86c1.12.07 1.9.74 2.87.8 1.16-.24 2.27-.93 3.53-.84 1.5.12 2.63.72 3.35 1.84-3.05 1.87-2.55 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 6.75c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function AuthModal({ open, reason, onClose }: AuthModalProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [emailMode, setEmailMode] = useState<EmailMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) return null;
    return createClient();
  }, []);

  const redirectTo = useMemo(() => {
    if (!open || typeof window === "undefined") return undefined;
    return buildOAuthCallbackUrl(locale as Locale);
  }, [locale, open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(null);
    const unlock = lockDocumentScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  const reasonLabel = t(`reasons.${reason}`);

  const runOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (!supabase) {
        setError(t("errors.notConfigured"));
        return;
      }
      if (!redirectTo) {
        setError(t("errors.redirectMissing"));
        return;
      }

      logOAuthClick(provider, redirectTo);
      setError(null);
      setBusy(provider);

      try {
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams:
              provider === "google"
                ? { access_type: "offline", prompt: "consent" }
                : undefined,
          },
        });

        if (oauthError) {
          setError(oauthError.message);
          setBusy(null);
          return;
        }

        if (data?.url) {
          window.location.assign(data.url);
          return;
        }

        setError(t("errors.oauthNoUrl"));
        setBusy(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errors.oauthFailed");
        setError(message);
        setBusy(null);
      }
    },
    [supabase, redirectTo, t]
  );

  const runEmail = useCallback(async () => {
    if (!supabase) {
      setError(t("errors.notConfigured"));
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setError(t("errors.invalidCredentials"));
      return;
    }
    setError(null);
    setBusy("email");

    if (emailMode === "signUp") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (signUpError) {
        setError(signUpError.message);
        setBusy(null);
        return;
      }
      setBusy(null);
      onClose();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setBusy(null);
      return;
    }
    setBusy(null);
    onClose();
  }, [supabase, email, password, emailMode, redirectTo, onClose, t]);

  if (!open) return null;

  return (
    <div
      className="auth-modal-overlay fixed inset-0 z-[120] flex flex-col bg-[var(--background)] lg:bg-black/75 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal-panel flex min-h-0 flex-1 flex-col bg-[var(--background)] lg:mx-auto lg:my-auto lg:max-h-[92dvh] lg:w-full lg:max-w-md lg:rounded-lg lg:border lg:border-[var(--border)] lg:shadow-2xl">
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            disabled={!!busy}
            className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-50"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h2
              id="auth-modal-title"
              className="text-sm font-semibold text-[var(--foreground)]"
            >
              {t("title")}
            </h2>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{reasonLabel}</p>
          </div>
          <div className="w-9" aria-hidden />
        </header>

        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
          {!isSupabaseConfigured() && (
            <p className="mb-4 rounded border border-[var(--negative)]/40 bg-[var(--negative)]/10 px-3 py-2 text-xs text-[var(--negative)]">
              {t("errors.notConfigured")}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runOAuth("google")}
              className="flex w-full items-center justify-center gap-2 rounded border border-[var(--border)] bg-[var(--surface-card)] py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 disabled:opacity-60"
            >
              {busy === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {t("continueGoogle")}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runOAuth("apple")}
              className="flex w-full items-center justify-center gap-2 rounded border border-[var(--border)] bg-[var(--surface-card)] py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 disabled:opacity-60"
            >
              {busy === "apple" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AppleIcon />
              )}
              {t("continueApple")}
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
              {t("orEmail")}
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="mb-4 flex rounded border border-[var(--border)] p-0.5">
            {(["signIn", "signUp"] as EmailMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setEmailMode(mode)}
                className={cn(
                  "flex-1 rounded py-2 text-[10px] font-semibold uppercase tracking-wide transition",
                  emailMode === mode
                    ? "bg-[var(--accent-dim)]/30 text-[var(--accent)]"
                    : "text-[var(--muted)]"
                )}
              >
                {mode === "signIn" ? t("signInTab") : t("signUp")}
              </button>
            ))}
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("email")}
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!busy}
                className="w-full rounded border border-[var(--border)] bg-[var(--surface-card)] py-2.5 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]/50"
                placeholder={t("emailPlaceholder")}
              />
            </div>
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {t("password")}
            </span>
            <input
              type="password"
              autoComplete={
                emailMode === "signUp" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!!busy}
              className="w-full rounded border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]/50"
              placeholder={t("passwordPlaceholder")}
            />
          </label>

          {error && (
            <p className="mb-3 text-xs text-[var(--negative)]">{error}</p>
          )}

          <button
            type="button"
            disabled={!!busy}
            onClick={() => runEmail()}
            className="flex w-full items-center justify-center gap-2 rounded border border-[var(--accent)]/60 bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--background)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
            {emailMode === "signUp" ? t("signUpSubmit") : t("signInSubmit")}
          </button>

          {emailMode === "signUp" && (
            <p className="mt-3 text-center text-[10px] text-[var(--muted)]">
              {t("signUpHint")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
