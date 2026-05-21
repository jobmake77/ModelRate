import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getModelsWithCurrentPrices } from "@/lib/data-access/models";
import { formatDate, formatNumber, formatUsd } from "@/lib/formatters/number";

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

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Input / 1M</th>
                  <th className="px-4 py-3">Output / 1M</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Capabilities</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {models.map((model) => (
                  <tr key={model.slug} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/models/${model.slug}`}
                        className="font-medium text-slate-950 hover:underline"
                      >
                        {model.displayName}
                      </Link>
                      <div className="mt-1 text-xs text-slate-500">
                        {model.canonicalModelId}
                      </div>
                    </td>
                    <td className="px-4 py-4">{model.provider.name}</td>
                    <td className="px-4 py-4 font-medium">
                      {model.currentPrice
                        ? formatUsd(model.currentPrice.inputPricePer1M)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {model.currentPrice
                        ? formatUsd(model.currentPrice.outputPricePer1M)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-4">
                      {formatNumber(model.contextWindow)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {model.supportsVision ? (
                          <Badge tone="blue">Vision</Badge>
                        ) : null}
                        {model.supportsReasoning ? (
                          <Badge tone="amber">Reasoning</Badge>
                        ) : null}
                        {model.supportsFunctionCalling ? (
                          <Badge tone="green">Tools</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {model.currentPrice ? (
                        <div>
                          <a
                            className="font-medium text-blue-700 hover:underline"
                            href={model.currentPrice.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {model.currentPrice.sourceName}
                          </a>
                          <div className="mt-1 text-xs text-slate-500">
                            Checked{" "}
                            {formatDate(model.currentPrice.lastCheckedAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">No current price</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
