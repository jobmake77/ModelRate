import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { canUseFixtureFallback } from "@/lib/env";
import { selectPrimaryCurrentPrice } from "@/lib/data-access/price-policy";
import {
  exchangeRates,
  modelPrices,
  models,
  providers,
  type ModelFixture,
  type ModelPriceFixture,
  type ProviderFixture,
} from "@/lib/fixtures/model-data";

export type ModelWithPrice = ModelFixture & {
  provider: ProviderFixture;
  currentPrice: ModelPriceFixture | null;
};

export async function getModelsWithCurrentPrices(): Promise<ModelWithPrice[]> {
  if (!hasDatabaseUrl) {
    if (!canUseFixtureFallback()) {
      throw new Error("DATABASE_URL is required for production data access.");
    }

    return getFixtureModelsWithPrices();
  }

  try {
    const prisma = getPrisma();
    const rows = await prisma.model.findMany({
      where: { status: "active" },
      include: {
        provider: true,
        prices: {
          where: { isCurrent: true },
          orderBy: { lastCheckedAt: "desc" },
        },
      },
      orderBy: [{ provider: { name: "asc" } }, { displayName: "asc" }],
    });

    return rows.map((row) => {
      const currentPrice = selectPrimaryCurrentPrice(row.prices);

      return {
        slug: row.slug,
        providerSlug: row.provider.slug,
        canonicalModelId: row.canonicalModelId,
        displayName: row.displayName,
        family: row.family ?? row.provider.name,
        description: row.description ?? "",
        contextWindow: row.contextWindow ?? 0,
        maxOutputTokens: row.maxOutputTokens ?? 0,
        supportsVision: row.supportsVision,
        supportsReasoning: row.supportsReasoning,
        supportsFunctionCalling: row.supportsFunctionCalling,
        sourceUrl: row.sourceUrl ?? row.provider.websiteUrl ?? "",
        lastCheckedAt: row.lastCheckedAt?.toISOString() ?? "",
        provider: {
          slug: row.provider.slug,
          name: row.provider.name,
          websiteUrl: row.provider.websiteUrl ?? "",
          description: row.provider.description ?? "",
        },
        currentPrice: currentPrice
          ? {
              modelSlug: row.slug,
              sourceType: currentPrice.sourceType,
              sourceName: currentPrice.sourceName,
              sourceUrl: currentPrice.sourceUrl,
              inputPricePer1M: Number(currentPrice.inputPricePer1M),
              outputPricePer1M: Number(currentPrice.outputPricePer1M),
              cachedInputPricePer1M: currentPrice.cachedInputPricePer1M
                ? Number(currentPrice.cachedInputPricePer1M)
                : undefined,
              lastCheckedAt: currentPrice.lastCheckedAt.toISOString(),
            }
          : null,
      };
    });
  } catch (error) {
    if (!canUseFixtureFallback()) {
      throw error;
    }

    return getFixtureModelsWithPrices();
  }
}

export async function getModelBySlug(slug: string) {
  const modelsWithPrices = await getModelsWithCurrentPrices();
  return modelsWithPrices.find((model) => model.slug === slug) ?? null;
}

export async function getLatestUsdCnyRate() {
  if (!hasDatabaseUrl) {
    if (!canUseFixtureFallback()) {
      throw new Error("DATABASE_URL is required for production data access.");
    }

    return exchangeRates[0];
  }

  try {
    const prisma = getPrisma();
    const rate = await prisma.exchangeRate.findFirst({
      where: { baseCurrency: "USD", quoteCurrency: "CNY" },
      orderBy: { fetchedAt: "desc" },
    });

    if (!rate) {
      return exchangeRates[0];
    }

    return {
      baseCurrency: rate.baseCurrency,
      quoteCurrency: rate.quoteCurrency,
      rate: Number(rate.rate),
      sourceName: rate.sourceName ?? "Database",
      sourceUrl: rate.sourceUrl ?? "",
      fetchedAt: rate.fetchedAt.toISOString(),
    };
  } catch (error) {
    if (!canUseFixtureFallback()) {
      throw error;
    }

    return exchangeRates[0];
  }
}

function getFixtureModelsWithPrices(): ModelWithPrice[] {
  return models.map((model) => {
    const provider = providers.find((item) => item.slug === model.providerSlug);
    const currentPrice =
      modelPrices.find((price) => price.modelSlug === model.slug) ?? null;

    if (!provider) {
      throw new Error(`Missing provider fixture: ${model.providerSlug}`);
    }

    return {
      ...model,
      provider,
      currentPrice,
    };
  });
}
