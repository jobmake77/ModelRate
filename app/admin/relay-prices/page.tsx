import { getCurrentAdmin } from "@/lib/auth/admin";
import { AdminModelRow } from "@/components/admin/model-admin-panel";
import {
  AdminRelayPriceRow,
  RelayPriceAdminPanel,
} from "@/components/admin/relay-price-admin-panel";
import { getAdminRelayStations } from "@/lib/data-access/relays";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import {
  models as fixtureModels,
  providers as fixtureProviders,
} from "@/lib/fixtures/model-data";

export default async function AdminRelayPricesPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">Unauthorized</h1>
        <p className="mt-2 text-sm text-amber-800">请先以管理员身份登录。</p>
      </section>
    );
  }

  const { models, prices, relays } = await getAdminRelayPriceData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Relay Model Prices</h1>
        <p className="mt-2 text-sm text-slate-600">
          维护中转站模型倍率、补全倍率、线路倍率或直接价格。当前价格应带 source
          和 last checked。
        </p>
      </div>
      <RelayPriceAdminPanel
        databaseConfigured={hasDatabaseUrl}
        initialPrices={prices}
        models={models}
        relays={relays}
      />
    </div>
  );
}

async function getAdminRelayPriceData(): Promise<{
  models: AdminModelRow[];
  prices: AdminRelayPriceRow[];
  relays: Awaited<ReturnType<typeof getAdminRelayStations>>;
}> {
  const relays = await getAdminRelayStations();

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

    return { models, prices: [], relays };
  }

  const prisma = getPrisma();
  const [models, prices] = await Promise.all([
    prisma.model.findMany({
      where: { status: { not: "hidden" } },
      include: { provider: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.relayModelPrice.findMany({
      include: { model: true, relayStation: true },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  return {
    relays,
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
      relayStationId: price.relayStationId,
      relayName: price.relayStation.name,
      modelId: price.modelId,
      modelName: price.model.displayName,
      routeName: price.routeName,
      billingType: price.billingType,
      modelMultiplier: price.modelMultiplier
        ? Number(price.modelMultiplier)
        : null,
      completionMultiplier: price.completionMultiplier
        ? Number(price.completionMultiplier)
        : null,
      groupMultiplier: Number(price.groupMultiplier),
      routeMultiplier: Number(price.routeMultiplier),
      inputPricePer1M: price.inputPricePer1M
        ? Number(price.inputPricePer1M)
        : null,
      outputPricePer1M: price.outputPricePer1M
        ? Number(price.outputPricePer1M)
        : null,
      currency: price.currency,
      sourceUrl: price.sourceUrl,
      lastCheckedAt: price.lastCheckedAt?.toISOString() ?? null,
      isCurrent: price.isCurrent,
      notes: price.notes,
    })),
  };
}
