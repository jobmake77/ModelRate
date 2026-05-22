import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { ModelPriceTable } from "@/components/public/model-price-table";
import { JsonLd } from "@/components/seo/json-ld";
import { getModelsWithCurrentPrices } from "@/lib/data-access/models";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { itemListJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "模型价格表",
  description: "按统一 USD per 1M tokens 口径浏览主流 AI 模型输入和输出价格。",
  path: "/models",
});

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function ModelsPage({ searchParams }: PageProps) {
  const [models, params] = await Promise.all([
    getModelsWithCurrentPrices(),
    searchParams ?? Promise.resolve({} as SearchParams),
  ]);

  return (
    <SiteShell>
      <JsonLd
        data={itemListJsonLd({
          name: "AI model pricing",
          path: "/models",
          items: models.map((model) => ({
            name: model.displayName,
            path: `/models/${model.slug}`,
          })),
        })}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">Model pricing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            模型价格表
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            所有价格统一展示为 USD per 1M
            tokens。每条价格都保留来源和最后检查时间，避免倍率和真实成本混淆。
          </p>
        </div>

        <ModelPriceTable
          initialFilters={{
            capability: getSearchParam(params.capability),
            provider: getSearchParam(params.provider),
            query: getSearchParam(params.q),
            sortKey: getSearchParam(params.sort),
          }}
          models={models}
        />
      </div>
    </SiteShell>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
