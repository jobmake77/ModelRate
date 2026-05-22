import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import {
  modelPrices,
  models,
  type ModelPriceFixture,
} from "@/lib/fixtures/model-data";
import { relayModelPrices, relayStations } from "@/lib/fixtures/relay-data";

export type DataQualityTone = "amber" | "green" | "slate";

export type DataQualityItem = {
  detail: string;
  href: string;
  label: string;
  tone: DataQualityTone;
  value: number;
};

const staleDays = 30;
const veryStaleDays = 90;
const pendingSubmissionDays = 7;

export async function getDataQualitySummary(): Promise<DataQualityItem[]> {
  if (!hasDatabaseUrl) {
    return getFixtureDataQualitySummary();
  }

  const prisma = getPrisma();
  const now = Date.now();
  const staleBefore = new Date(now - staleDays * 24 * 60 * 60 * 1000);
  const veryStaleBefore = new Date(now - veryStaleDays * 24 * 60 * 60 * 1000);
  const pendingBefore = new Date(
    now - pendingSubmissionDays * 24 * 60 * 60 * 1000,
  );

  const [
    staleModelPrices,
    veryStaleModelPrices,
    missingModelPriceSources,
    relayPricesMissingSource,
    relayPricesMissingLastChecked,
    publishedRelaysUnknownRisk,
    publishedRelaysMissingLastChecked,
    publishedRelaysWithoutPublicPricing,
    oldPendingSubmissions,
  ] = await Promise.all([
    prisma.modelPrice.count({
      where: { isCurrent: true, lastCheckedAt: { lt: staleBefore } },
    }),
    prisma.modelPrice.count({
      where: { isCurrent: true, lastCheckedAt: { lt: veryStaleBefore } },
    }),
    prisma.modelPrice.count({
      where: { isCurrent: true, sourceUrl: "" },
    }),
    prisma.relayModelPrice.count({
      where: {
        isCurrent: true,
        OR: [{ sourceUrl: null }, { sourceUrl: "" }],
      },
    }),
    prisma.relayModelPrice.count({
      where: { isCurrent: true, lastCheckedAt: null },
    }),
    prisma.relayStation.count({
      where: { status: "published", riskLevel: "unknown" },
    }),
    prisma.relayStation.count({
      where: { status: "published", lastCheckedAt: null },
    }),
    prisma.relayStation.count({
      where: { status: "published", hasPublicPricing: false },
    }),
    prisma.submission.count({
      where: { status: "pending", createdAt: { lt: pendingBefore } },
    }),
  ]);

  return buildQualityItems({
    missingModelPriceSources,
    oldPendingSubmissions,
    publishedRelaysMissingLastChecked,
    publishedRelaysUnknownRisk,
    publishedRelaysWithoutPublicPricing,
    relayPricesMissingLastChecked,
    relayPricesMissingSource,
    staleModelPrices,
    veryStaleModelPrices,
  });
}

function getFixtureDataQualitySummary() {
  const now = Date.now();
  const staleBefore = now - staleDays * 24 * 60 * 60 * 1000;
  const veryStaleBefore = now - veryStaleDays * 24 * 60 * 60 * 1000;
  const currentModelPrices = models
    .map((model) => modelPrices.find((price) => price.modelSlug === model.slug))
    .filter((price): price is ModelPriceFixture => Boolean(price));

  return buildQualityItems({
    missingModelPriceSources: currentModelPrices.filter(
      (price) => !price.sourceUrl,
    ).length,
    oldPendingSubmissions: 0,
    publishedRelaysMissingLastChecked: relayStations.filter(
      (relay) => relay.status === "published" && !relay.lastCheckedAt,
    ).length,
    publishedRelaysUnknownRisk: relayStations.filter(
      (relay) => relay.status === "published" && relay.riskLevel === "unknown",
    ).length,
    publishedRelaysWithoutPublicPricing: relayStations.filter(
      (relay) => relay.status === "published" && !relay.hasPublicPricing,
    ).length,
    relayPricesMissingLastChecked: relayModelPrices.filter(
      (price) => price.isCurrent && !price.lastCheckedAt,
    ).length,
    relayPricesMissingSource: relayModelPrices.filter(
      (price) => price.isCurrent && !price.sourceUrl,
    ).length,
    staleModelPrices: currentModelPrices.filter(
      (price) => new Date(price.lastCheckedAt).getTime() < staleBefore,
    ).length,
    veryStaleModelPrices: currentModelPrices.filter(
      (price) => new Date(price.lastCheckedAt).getTime() < veryStaleBefore,
    ).length,
  });
}

function buildQualityItems(counts: {
  missingModelPriceSources: number;
  oldPendingSubmissions: number;
  publishedRelaysMissingLastChecked: number;
  publishedRelaysUnknownRisk: number;
  publishedRelaysWithoutPublicPricing: number;
  relayPricesMissingLastChecked: number;
  relayPricesMissingSource: number;
  staleModelPrices: number;
  veryStaleModelPrices: number;
}): DataQualityItem[] {
  return [
    {
      detail: `Older than ${staleDays} days`,
      href: "/admin/model-prices",
      label: "Stale model prices",
      tone: toneFor(counts.staleModelPrices),
      value: counts.staleModelPrices,
    },
    {
      detail: `Older than ${veryStaleDays} days`,
      href: "/admin/model-prices",
      label: "Very stale prices",
      tone: toneFor(counts.veryStaleModelPrices),
      value: counts.veryStaleModelPrices,
    },
    {
      detail: "Current model prices",
      href: "/admin/model-prices",
      label: "Missing model sources",
      tone: toneFor(counts.missingModelPriceSources),
      value: counts.missingModelPriceSources,
    },
    {
      detail: "Current relay prices",
      href: "/admin/relay-prices",
      label: "Missing relay sources",
      tone: toneFor(counts.relayPricesMissingSource),
      value: counts.relayPricesMissingSource,
    },
    {
      detail: "Current relay prices",
      href: "/admin/relay-prices",
      label: "Missing relay checks",
      tone: toneFor(counts.relayPricesMissingLastChecked),
      value: counts.relayPricesMissingLastChecked,
    },
    {
      detail: "Published relays",
      href: "/admin/relays",
      label: "Unknown relay risk",
      tone: toneFor(counts.publishedRelaysUnknownRisk),
      value: counts.publishedRelaysUnknownRisk,
    },
    {
      detail: "Published relays",
      href: "/admin/relays",
      label: "Relay checks missing",
      tone: toneFor(counts.publishedRelaysMissingLastChecked),
      value: counts.publishedRelaysMissingLastChecked,
    },
    {
      detail: "Published relays",
      href: "/admin/relays",
      label: "No public pricing",
      tone: toneFor(counts.publishedRelaysWithoutPublicPricing),
      value: counts.publishedRelaysWithoutPublicPricing,
    },
    {
      detail: `Pending over ${pendingSubmissionDays} days`,
      href: "/admin/submissions",
      label: "Old submissions",
      tone: toneFor(counts.oldPendingSubmissions),
      value: counts.oldPendingSubmissions,
    },
  ];
}

function toneFor(value: number): DataQualityTone {
  return value > 0 ? "amber" : "green";
}
