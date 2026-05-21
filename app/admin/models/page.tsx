import { getCurrentAdmin } from "@/lib/auth/admin";
import {
  AdminModelRow,
  AdminProviderOption,
  ModelAdminPanel,
} from "@/components/admin/model-admin-panel";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import {
  models as fixtureModels,
  providers as fixtureProviders,
} from "@/lib/fixtures/model-data";

export default async function AdminModelsPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return <Unauthorized />;
  }

  const { models, providers } = await getAdminModelData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Models</h1>
        <p className="mt-2 text-sm text-slate-600">
          管理模型基础信息、状态和能力标签。公开页面只展示 active 模型。
        </p>
      </div>
      <ModelAdminPanel
        databaseConfigured={hasDatabaseUrl}
        initialModels={models}
        providers={providers}
      />
    </div>
  );
}

function Unauthorized() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h1 className="text-xl font-semibold text-amber-950">Unauthorized</h1>
      <p className="mt-2 text-sm text-amber-800">请先以管理员身份登录。</p>
    </section>
  );
}

async function getAdminModelData(): Promise<{
  models: AdminModelRow[];
  providers: AdminProviderOption[];
}> {
  if (!hasDatabaseUrl) {
    return {
      providers: fixtureProviders.map((provider) => ({
        id: provider.slug,
        name: provider.name,
      })),
      models: fixtureModels.map((model) => {
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
          status: "active",
        };
      }),
    };
  }

  const prisma = getPrisma();
  const [providers, models] = await Promise.all([
    prisma.provider.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
    prisma.model.findMany({
      include: { provider: true },
      orderBy: [{ status: "asc" }, { displayName: "asc" }],
    }),
  ]);

  return {
    providers: providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
    })),
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
  };
}
