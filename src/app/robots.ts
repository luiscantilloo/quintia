import type { MetadataRoute } from "next";
import { getSiteUrl, PRIVATE_PATH_PREFIXES } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  const disallow = PRIVATE_PATH_PREFIXES.flatMap((p) => [p, `${p}/`]);

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/landing",
          "/landing/",
          "/landing/privacidad",
          "/landing/tratamiento-de-datos",
          "/ingreso",
        ],
        disallow,
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site.replace(/^https?:\/\//, ""),
  };
}
