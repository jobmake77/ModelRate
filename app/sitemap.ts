import type { MetadataRoute } from "next";
import { getPublishedGuides } from "@/lib/data-access/guides";
import { getModelsWithCurrentPrices } from "@/lib/data-access/models";
import { getPublishedRelayStations } from "@/lib/data-access/relays";
import { getNormalizedSiteUrl } from "@/lib/seo/metadata";

const staticPaths = [
  "/",
  "/models",
  "/relays",
  "/guides",
  "/tools/token-cost-calculator",
  "/tools/model-rate-calculator",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, relays, guides] = await Promise.all([
    getModelsWithCurrentPrices(),
    getPublishedRelayStations(),
    getPublishedGuides(),
  ]);

  return [
    ...staticPaths.map((path) => entry(path)),
    ...models.map((model) =>
      entry(`/models/${model.slug}`, model.currentPrice?.lastCheckedAt),
    ),
    ...relays.map((relay) =>
      entry(`/relays/${relay.slug}`, relay.lastCheckedAt),
    ),
    ...guides.map((guide) => entry(`/guides/${guide.slug}`, guide.updatedAt)),
  ];
}

function entry(path: string, lastModified?: string): MetadataRoute.Sitemap[0] {
  return {
    url: `${getNormalizedSiteUrl()}${path}`,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  };
}
