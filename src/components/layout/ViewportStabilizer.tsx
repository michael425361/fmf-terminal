"use client";

import { useEffect } from "react";
import { useRouteViewportReset } from "@/hooks/useRouteViewportReset";

/** Keeps mobile visual viewport height in sync and resets scroll/zoom on navigation. */
export function ViewportStabilizer() {
  useRouteViewportReset();

  useEffect(() => {
    const setAppVh = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-vh", `${height}px`);
    };

    setAppVh();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", setAppVh);
    vv?.addEventListener("scroll", setAppVh);
    window.addEventListener("resize", setAppVh);
    window.addEventListener("orientationchange", setAppVh);

    return () => {
      vv?.removeEventListener("resize", setAppVh);
      vv?.removeEventListener("scroll", setAppVh);
      window.removeEventListener("resize", setAppVh);
      window.removeEventListener("orientationchange", setAppVh);
    };
  }, []);

  return null;
}
