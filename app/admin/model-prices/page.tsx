import { getCurrentAdmin } from "@/lib/auth/admin";
import { AdminModelRow } from "@/components/admin/model-admin-panel";
import {
  AdminModelPriceRow,
  ModelPriceAdminPanel,
} from "@/components/admin/model-price-admin-panel";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import {
  modelPrices as fixturePrices,
  models as fixtureModels,
  providers as fixtureProviders,
} from "@/lib/fixtures/model-data";

export default async function AdminModelPricesPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">Unauthorized</h1>
        <p className="mt-2 text-sm text-amber-800">请先以管理员身份登录。</p>
      </section>
    );
  }

  const { models, prices } = await getAdminPriceData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Model Prices</h1>
        <p className="mt-2 text-sm text-slate-600">
          维护模型当前价格。每条当前价格都必须保留 source 和 last checked。
        </p>
      </div>
      <ModelPriceAdminPanel
        databaseConfigured={hasDatabaseUrl}
        initialPrices={prices}
        models={models}
      />
    </div>
  );
}

async function getAdminPriceData(): Promise<{
  models: AdminModelRow[];
  prices: AdminModelPriceRow[];
}> {
  if (!hasDatabaseUrl) {
    const models = fixtureModels.map((model) => {
      const provider = fixtureProviders.find(
        (item) => item.slug === model.providerSlug,
      );

      return {
        id: model.slug,
        providerId: model.providerSlug,
        providerName: provider?.name ?? model.providerSlug,
        slug: model.slug,
        canonicalModelId: model.canonicalModelId,
        displayName: model.displayName,
        family: model.family,
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        supportsVision: model.supportsVision ?? false,
        supportsReasoning: model.supportsReasoning ?? false,
        supportsFunctionCalling: model.supportsFunctionCalling ?? false,
        sourceUrl: model.sourceUrl,
        status: "active" as const,
      };
    });

    return {
      models,
      prices: fixturePrices.map((price) => {
        const model = fixtureModels.find(
          (item) => item.slug === price.modelSlug,
        );

        return {
          id: `${price.modelSlug}-${price.sourceType}`,
          modelId: price.modelSlug,
          modelName: model?.displayName ?? price.modelSlug,
          sourceType: price.sourceType,
          sourceName: price.sourceName,
          sourceUrl: price.sourceUrl,
          inputPricePer1M: price.inputPricePer1M,
          outputPricePer1M: price.outputPricePer1M,
          cachedInputPricePer1M: price.cachedInputPricePer1M ?? null,
          lastCheckedAt: price.lastCheckedAt,
          isCurrent: true,
        };
      }),
    };
  }

  const prisma = getPrisma();
  const [models, prices] = await Promise.all([
    prisma.model.findMany({
      where: { status: { not: "hidden" } },
      include: { provider: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.modelPrice.findMany({
      include: { model: true },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  return {
    models: models.map((model) => ({
      id: model.id,
      providerId: model.providerId,
      providerName: model.provider.name,
      slug: model.slug,
      canonicalModelId: model.canonicalModelId,
      displayName: model.displayName,
      family: model.family ?? "",
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      supportsVision: model.supportsVision,
      supportsReasoning: model.supportsReasoning,
      supportsFunctionCalling: model.supportsFunctionCalling,
      sourceUrl: model.sourceUrl ?? "",
      status: model.status,
    })),
    prices: prices.map((price) => ({
      id: price.id,
      modelId: price.modelId,
      modelName: price.model.displayName,
      sourceType: price.sourceType,
      sourceName: price.sourceName,
      sourceUrl: price.sourceUrl,
      inputPricePer1M: Number(price.inputPricePer1M),
      outputPricePer1M: Number(price.outputPricePer1M),
      cachedInputPricePer1M: price.cachedInputPricePer1M
        ? Number(price.cachedInputPricePer1M)
        : null,
      lastCheckedAt: price.lastCheckedAt.toISOString(),
      isCurrent: price.isCurrent,
    })),
  };
}
