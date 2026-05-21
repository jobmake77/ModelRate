import { PrismaClient } from "@prisma/client";
import {
  exchangeRates,
  modelPrices,
  models,
  providers,
} from "../lib/fixtures/model-data";
import { relayStations, riskTags } from "../lib/fixtures/relay-data";

const prisma = new PrismaClient();

async function main() {
  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    });
  }

  for (const model of models) {
    const provider = await prisma.provider.findUniqueOrThrow({
      where: { slug: model.providerSlug },
    });

    await prisma.model.upsert({
      where: { slug: model.slug },
      update: {
        providerId: provider.id,
        canonicalModelId: model.canonicalModelId,
        displayName: model.displayName,
        family: model.family,
        description: model.description,
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        supportsVision: model.supportsVision ?? false,
        supportsReasoning: model.supportsReasoning ?? false,
        supportsFunctionCalling: model.supportsFunctionCalling ?? false,
        sourceUrl: model.sourceUrl,
        lastCheckedAt: new Date(model.lastCheckedAt),
      },
      create: {
        providerId: provider.id,
        slug: model.slug,
        canonicalModelId: model.canonicalModelId,
        displayName: model.displayName,
        family: model.family,
        description: model.description,
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        supportsVision: model.supportsVision ?? false,
        supportsReasoning: model.supportsReasoning ?? false,
        supportsFunctionCalling: model.supportsFunctionCalling ?? false,
        sourceUrl: model.sourceUrl,
        lastCheckedAt: new Date(model.lastCheckedAt),
      },
    });
  }

  for (const price of modelPrices) {
    const model = await prisma.model.findUniqueOrThrow({
      where: { slug: price.modelSlug },
    });

    await prisma.modelPrice.deleteMany({
      where: {
        modelId: model.id,
        sourceType: price.sourceType,
        isCurrent: true,
      },
    });

    await prisma.modelPrice.create({
      data: {
        modelId: model.id,
        sourceType: price.sourceType,
        sourceName: price.sourceName,
        sourceUrl: price.sourceUrl,
        inputPricePer1M: price.inputPricePer1M,
        outputPricePer1M: price.outputPricePer1M,
        cachedInputPricePer1M: price.cachedInputPricePer1M,
        lastCheckedAt: new Date(price.lastCheckedAt),
        isCurrent: true,
      },
    });
  }

  for (const rate of exchangeRates) {
    await prisma.exchangeRate.create({
      data: {
        baseCurrency: rate.baseCurrency,
        quoteCurrency: rate.quoteCurrency,
        rate: rate.rate,
        sourceName: rate.sourceName,
        sourceUrl: rate.sourceUrl,
        fetchedAt: new Date(rate.fetchedAt),
      },
    });
  }

  for (const tag of riskTags) {
    await prisma.riskTag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
  }

  for (const relay of relayStations) {
    const savedRelay = await prisma.relayStation.upsert({
      where: { slug: relay.slug },
      update: {
        name: relay.name,
        domain: relay.domain,
        websiteUrl: relay.websiteUrl,
        description: relay.description,
        billingModes: relay.billingModes,
        paymentMethods: relay.paymentMethods,
        minimumTopUpAmount: relay.minimumTopUpAmount,
        minimumTopUpCurrency: relay.minimumTopUpCurrency,
        supportChannels: relay.supportChannels,
        hasPublicPricing: relay.hasPublicPricing,
        hasTrialCredit: relay.hasTrialCredit,
        hasReferralProgram: relay.hasReferralProgram,
        referralUrl: relay.referralUrl,
        couponCode: relay.couponCode,
        isSponsored: relay.isSponsored,
        isVerified: relay.isVerified,
        status: relay.status,
        riskLevel: relay.riskLevel,
        lastCheckedAt: new Date(relay.lastCheckedAt),
      },
      create: {
        slug: relay.slug,
        name: relay.name,
        domain: relay.domain,
        websiteUrl: relay.websiteUrl,
        description: relay.description,
        billingModes: relay.billingModes,
        paymentMethods: relay.paymentMethods,
        minimumTopUpAmount: relay.minimumTopUpAmount,
        minimumTopUpCurrency: relay.minimumTopUpCurrency,
        supportChannels: relay.supportChannels,
        hasPublicPricing: relay.hasPublicPricing,
        hasTrialCredit: relay.hasTrialCredit,
        hasReferralProgram: relay.hasReferralProgram,
        referralUrl: relay.referralUrl,
        couponCode: relay.couponCode,
        isSponsored: relay.isSponsored,
        isVerified: relay.isVerified,
        status: relay.status,
        riskLevel: relay.riskLevel,
        lastCheckedAt: new Date(relay.lastCheckedAt),
      },
    });

    await prisma.relayStationRiskTag.deleteMany({
      where: { relayStationId: savedRelay.id },
    });

    for (const tagSlug of relay.riskTags) {
      const tag = await prisma.riskTag.findUniqueOrThrow({
        where: { slug: tagSlug },
      });
      await prisma.relayStationRiskTag.create({
        data: {
          relayStationId: savedRelay.id,
          riskTagId: tag.id,
        },
      });
    }
  }

  await prisma.adPlacement.upsert({
    where: { slotKey: "home-sidebar" },
    update: {
      name: "Home sidebar",
      pageType: "home",
      position: "sidebar",
      provider: "placeholder",
      adCode: null,
      isEnabled: false,
    },
    create: {
      slotKey: "home-sidebar",
      name: "Home sidebar",
      pageType: "home",
      position: "sidebar",
      provider: "placeholder",
      adCode: null,
      isEnabled: false,
    },
  });

  await prisma.adPlacement.upsert({
    where: { slotKey: "models-footer" },
    update: {
      name: "Models footer",
      pageType: "models",
      position: "footer",
      provider: "placeholder",
      adCode: null,
      isEnabled: false,
    },
    create: {
      slotKey: "models-footer",
      name: "Models footer",
      pageType: "models",
      position: "footer",
      provider: "placeholder",
      adCode: null,
      isEnabled: false,
    },
  });

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  for (const email of adminEmails) {
    await prisma.adminUser.upsert({
      where: { email },
      update: { role: "owner", status: "active" },
      create: { email, role: "owner", status: "active" },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
