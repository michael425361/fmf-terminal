"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FMFLogo } from "./FMFLogo";
import { SITE } from "@/lib/brand/site";

const BOOT_KEY = "fmf-terminal-boot-v1";
const MIN_MS = 1600;

export function TerminalBootLoader({ children }: { children: React.ReactNode }) {
  const t = useTranslations("brand.loading");
  const [visible, setVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [t("init"), t("feeds"), t("ai")];

  useEffect(() => {
    const booted = sessionStorage.getItem(BOOT_KEY);
    if (booted === "1") {
      setVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length);
    }, 520);

    const timer = setTimeout(() => {
      sessionStorage.setItem(BOOT_KEY, "1");
      setVisible(false);
    }, MIN_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [messages.length]);

  if (!visible) return <>{children}</>;

  return (
    <>
      <div
        className="boot-screen fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[var(--background)]"
        role="status"
        aria-live="polite"
        aria-label={t("init")}
      >
        <div className="boot-screen-glow pointer-events-none absolute inset-0" />
        <FMFLogo size={88} pulse priority />
        <h1 className="mt-8 font-mono text-lg font-bold tracking-[0.35em] text-[var(--foreground)]">
          FMF <span className="text-[var(--accent)]">TERMINAL</span>
        </h1>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--muted)]">
          {SITE.tagline}
        </p>
        <p className="boot-message mt-10 font-mono text-xs text-[var(--accent)]">
          {messages[messageIndex]}
          <span className="boot-cursor">_</span>
        </p>
        <div className="mt-8 h-0.5 w-48 overflow-hidden rounded-full bg-[var(--border)]">
          <div className="boot-progress h-full rounded-full bg-[var(--accent)]" />
        </div>
        <p className="mt-6 font-mono text-[9px] text-[var(--muted)]">
          {SITE.domain}
        </p>
      </div>
      <div className="invisible">{children}</div>
    </>
  );
}
