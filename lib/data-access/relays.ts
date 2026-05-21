import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { models } from "@/lib/fixtures/model-data";
import {
  relayModelPrices,
  relayStations,
  riskTags,
  type RelayModelPriceFixture,
  type RelayStationFixture,
} from "@/lib/fixtures/relay-data";

export type RelayStationPublic = RelayStationFixture & {
  riskTagDetails: typeof riskTags;
};

export type AdminRelayRow = RelayStationPublic & {
  id: string;
};

export type RelayModelPricePublic = RelayModelPriceFixture & {
  modelName: string;
};

export type ModelRelayPricePublic = RelayModelPriceFixture & {
  relayName: string;
  relayRiskLevel: RelayStationFixture["riskLevel"];
  relayIsSponsored: boolean;
  relayIsVerified: boolean;
  relayHasReferralProgram: boolean;
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

export async function getCurrentRelayModelPrices(
  relaySlug: string,
): Promise<RelayModelPricePublic[]> {
  if (!hasDatabaseUrl) {
    return getFixtureRelayModelPrices(relaySlug);
  }

  try {
    const rows = await getPrisma().relayModelPrice.findMany({
      where: {
        isCurrent: true,
        relayStation: {
          slug: relaySlug,
          status: "published",
        },
      },
      include: { model: true, relayStation: true },
      orderBy: [{ model: { displayName: "asc" } }, { routeName: "asc" }],
    });

    return rows.map((row) => ({
      relaySlug: row.relayStation.slug,
      modelSlug: row.model.slug,
      modelName: row.model.displayName,
      routeName: row.routeName,
      billingType: row.billingType,
      modelMultiplier: row.modelMultiplier ? Number(row.modelMultiplier) : null,
      completionMultiplier: row.completionMultiplier
        ? Number(row.completionMultiplier)
        : null,
      groupMultiplier: Number(row.groupMultiplier),
      routeMultiplier: Number(row.routeMultiplier),
      inputPricePer1M: row.inputPricePer1M ? Number(row.inputPricePer1M) : null,
      outputPricePer1M: row.outputPricePer1M
        ? Number(row.outputPricePer1M)
        : null,
      currency: row.currency,
      sourceUrl: row.sourceUrl,
      lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
      isCurrent: row.isCurrent,
      notes: row.notes,
    }));
  } catch {
    return getFixtureRelayModelPrices(relaySlug);
  }
}

export async function getCurrentRelayPricesForModel(
  modelSlug: string,
): Promise<ModelRelayPricePublic[]> {
  if (!hasDatabaseUrl) {
    return getFixtureModelRelayPrices(modelSlug);
  }

  try {
    const rows = await getPrisma().relayModelPrice.findMany({
      where: {
        isCurrent: true,
        model: {
          slug: modelSlug,
          status: "active",
        },
        relayStation: {
          status: "published",
        },
      },
      include: { relayStation: true },
      orderBy: [{ relayStation: { name: "asc" } }, { routeName: "asc" }],
    });

    return rows.map((row) => ({
      relaySlug: row.relayStation.slug,
      relayName: row.relayStation.name,
      relayRiskLevel: row.relayStation.riskLevel,
      relayIsSponsored: row.relayStation.isSponsored,
      relayIsVerified: row.relayStation.isVerified,
      relayHasReferralProgram: row.relayStation.hasReferralProgram,
      modelSlug,
      routeName: row.routeName,
      billingType: row.billingType,
      modelMultiplier: row.modelMultiplier ? Number(row.modelMultiplier) : null,
      completionMultiplier: row.completionMultiplier
        ? Number(row.completionMultiplier)
        : null,
      groupMultiplier: Number(row.groupMultiplier),
      routeMultiplier: Number(row.routeMultiplier),
      inputPricePer1M: row.inputPricePer1M ? Number(row.inputPricePer1M) : null,
      outputPricePer1M: row.outputPricePer1M
        ? Number(row.outputPricePer1M)
        : null,
      currency: row.currency,
      sourceUrl: row.sourceUrl,
      lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
      isCurrent: row.isCurrent,
      notes: row.notes,
    }));
  } catch {
    return getFixtureModelRelayPrices(modelSlug);
  }
}

export async function getAdminRelayStations(): Promise<AdminRelayRow[]> {
  if (!hasDatabaseUrl) {
    return relayStations.map((relay) => ({
      ...relay,
      id: relay.slug,
      riskTagDetails: riskTags.filter((tag) =>
        relay.riskTags.includes(tag.slug),
      ),
    }));
  }

  const rows = await getPrisma().relayStation.findMany({
    include: {
      riskTags: {
        include: { riskTag: true },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
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

function getFixtureRelayModelPrices(
  relaySlug: string,
): RelayModelPricePublic[] {
  return relayModelPrices
    .filter((price) => price.relaySlug === relaySlug && price.isCurrent)
    .map((price) => {
      const model = models.find((item) => item.slug === price.modelSlug);

      return {
        ...price,
        modelName: model?.displayName ?? price.modelSlug,
      };
    });
}

function getFixtureModelRelayPrices(
  modelSlug: string,
): ModelRelayPricePublic[] {
  return relayModelPrices
    .filter((price) => price.modelSlug === modelSlug && price.isCurrent)
    .flatMap((price) => {
      const relay = relayStations.find(
        (item) => item.slug === price.relaySlug && item.status === "published",
      );

      if (!relay) {
        return [];
      }

      return {
        ...price,
        relayName: relay.name,
        relayRiskLevel: relay.riskLevel,
        relayIsSponsored: relay.isSponsored,
        relayIsVerified: relay.isVerified,
        relayHasReferralProgram: relay.hasReferralProgram,
      };
    });
}
