import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import {
  relayStations,
  riskTags,
  type RelayStationFixture,
} from "@/lib/fixtures/relay-data";

export type RelayStationPublic = RelayStationFixture & {
  riskTagDetails: typeof riskTags;
};

export async function getPublishedRelayStations(): Promise<
  RelayStationPublic[]
> {
  if (!hasDatabaseUrl) {
    return getFixtureRelays();
  }

  try {
    const prisma = getPrisma();
    const rows = await prisma.relayStation.findMany({
      where: { status: "published" },
      include: {
        riskTags: {
          include: { riskTag: true },
        },
      },
      orderBy: [{ isSponsored: "desc" }, { name: "asc" }],
    });

    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      domain: row.domain,
      websiteUrl: row.websiteUrl,
      description: row.description ?? "",
      billingModes: row.billingModes,
      paymentMethods: row.paymentMethods,
      minimumTopUpAmount: row.minimumTopUpAmount
        ? Number(row.minimumTopUpAmount)
        : null,
      minimumTopUpCurrency: row.minimumTopUpCurrency,
      supportChannels: row.supportChannels,
      supportedProviders: [],
      hasPublicPricing: row.hasPublicPricing,
      hasTrialCredit: row.hasTrialCredit,
      hasReferralProgram: row.hasReferralProgram,
      referralUrl: row.referralUrl,
      couponCode: row.couponCode,
      isSponsored: row.isSponsored,
      isVerified: row.isVerified,
      status: row.status,
      riskLevel: row.riskLevel,
      riskTags: row.riskTags.map((tag) => tag.riskTag.slug),
      riskTagDetails: row.riskTags.map((tag) => ({
        slug: tag.riskTag.slug,
        label: tag.riskTag.label,
        description: tag.riskTag.description ?? "",
        severity: tag.riskTag.severity,
      })),
      sourceUrl: row.websiteUrl,
      lastCheckedAt: row.lastCheckedAt?.toISOString() ?? "",
    }));
  } catch {
    return getFixtureRelays();
  }
}

export async function getRelayStationBySlug(slug: string) {
  const relays = await getPublishedRelayStations();
  return relays.find((relay) => relay.slug === slug) ?? null;
}

function getFixtureRelays(): RelayStationPublic[] {
  return relayStations
    .filter((relay) => relay.status === "published")
    .map((relay) => ({
      ...relay,
      riskTagDetails: riskTags.filter((tag) =>
        relay.riskTags.includes(tag.slug),
      ),
    }));
}
