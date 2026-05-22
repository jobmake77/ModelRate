import type { MetadataRoute } from "next";
import { getNormalizedSiteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/admin"],
      },
    ],
    sitemap: `${getNormalizedSiteUrl()}/sitemap.xml`,
  };
}
