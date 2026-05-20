import type { Metadata } from "next";
import { BRAND_ASSETS, SITE } from "./site";

export function buildSiteMetadata(locale = "en"): Metadata {
  const localePath = locale.startsWith("zh") ? "zh" : "en";
  const pageUrl = `${SITE.url}/${localePath}`;
  const ogUrl = `${SITE.url}${BRAND_ASSETS.ogImage}`;
  const isZh = localePath === "zh";

  const title = SITE.title;
  const description = isZh
    ? "FMF 机构级市场终端 — 为我的财富而生。美股、A股、外汇、加密货币与大宗商品实时行情与 AI 分析。"
    : SITE.description;

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: title,
      template: `%s · ${SITE.name}`,
    },
    description,
    applicationName: SITE.name,
    authors: [{ name: SITE.creator, url: SITE.url }],
    creator: SITE.creator,
    publisher: SITE.creator,
    keywords: [...SITE.keywords],
    category: "finance",
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    alternates: {
      canonical: pageUrl,
      languages: {
        en: `${SITE.url}/en`,
        zh: `${SITE.url}/zh`,
        "x-default": `${SITE.url}/en`,
      },
    },
    icons: {
      icon: [
        { url: BRAND_ASSETS.icon, type: "image/svg+xml" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: BRAND_ASSETS.icon, type: "image/svg+xml" },
        { url: "/apple-icon.svg", type: "image/svg+xml" },
      ],
      shortcut: BRAND_ASSETS.icon,
    },
    manifest: "/manifest.webmanifest",
    themeColor: [
      { media: "(prefers-color-scheme: dark)", color: SITE.themeColor },
      { media: "(prefers-color-scheme: light)", color: SITE.themeColor },
    ],
    colorScheme: "dark",
    openGraph: {
      type: "website",
      locale: isZh ? "zh_CN" : SITE.locale,
      url: pageUrl,
      siteName: SITE.name,
      title,
      description,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${SITE.name} — ${SITE.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@fmfterminal",
      title,
      description,
      images: [ogUrl],
    },
    appleWebApp: {
      capable: true,
      title: SITE.shortName,
      statusBarStyle: "black-translucent",
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "msapplication-TileColor": SITE.themeColor,
    },
  };
}
