import type { MetadataRoute } from "next";
import { getSiteUrl, PUBLIC_PATHS } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  return [
    {
      url: site,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...PUBLIC_PATHS.map((path) => ({
      url: `${site}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
