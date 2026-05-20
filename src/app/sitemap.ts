import type { MetadataRoute } from "next";
import { SITE } from "@/lib/brand/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE.url}/en`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE.url}/zh`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
