import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { ModelPriceTable } from "@/components/public/model-price-table";
import { getModelsWithCurrentPrices } from "@/lib/data-access/models";

export const metadata: Metadata = {
  title: "模型价格表",
  description: "按统一 USD per 1M tokens 口径浏览主流 AI 模型输入和输出价格。",
};

export default async function ModelsPage() {
  const models = await getModelsWithCurrentPrices();

  return (
    <SiteShell>
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

        <ModelPriceTable models={models} />
      </div>
    </SiteShell>
  );
}
