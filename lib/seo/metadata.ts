import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";

export const siteName = "ModelRate";

export const defaultSiteDescription =
  "ModelRate helps developers calculate AI API token costs, One-API multipliers and model pricing with transparent sources.";

export function getNormalizedSiteUrl() {
  const siteUrl = getSiteUrl().trim() || "http://localhost:3000";
  return siteUrl.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getNormalizedSiteUrl()}${normalizedPath}`;
}

export function createPublicMetadata({
  description,
  path,
  title,
}: {
  description: string;
  path: string;
  title: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName,
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
