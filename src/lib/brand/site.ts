/** FMF — For My Finance · global site configuration */
const DEFAULT_SITE_URL = "https://www.fmfterminal.com";

/** Production site URL (override via NEXT_PUBLIC_SITE_URL on Vercel) */
export const SITE_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
  DEFAULT_SITE_URL;

export const SITE = {
  name: "FMF Terminal",
  shortName: "FMF",
  tagline: "For My Finance",
  title: "FMF Terminal — For My Finance",
  description:
    "AI-powered institutional market terminal for global equities, FX, crypto, and commodities. Real-time intelligence for For My Finance.",
  url: SITE_URL,
  domain: "www.fmfterminal.com",
  locale: "en_AU",
  themeColor: "#0a0c10",
  backgroundColor: "#0a0c10",
  accentColor: "#f59e0b",
  creator: "FMF Terminal",
  keywords: [
    "FMF",
    "FMF Terminal",
    "For My Finance",
    "fmfterminal",
    "trading terminal",
    "market data",
    "Bloomberg",
    "stocks",
    "crypto",
    "forex",
    "commodities",
  ],
} as const;

export const BRAND_ASSETS = {
  logo: "/brand/fmf-logo.svg",
  icon: "/brand/fmf-icon.svg",
  ogImage: "/brand/og-image.svg",
} as const;
