"use client";

import { useState } from "react";
import type { ModelWithPrice } from "@/lib/data-access/models";
import { calculateTokenCost } from "@/lib/calculators/pricing";
import { formatCny, formatUsd } from "@/lib/formatters/number";

type Props = {
  models: ModelWithPrice[];
  exchangeRate: number;
  compact?: boolean;
};

export function TokenCostCalculator({
  models,
  exchangeRate,
  compact = false,
}: Props) {
  const pricedModels = models.filter((model) => model.currentPrice);
  const [modelSlug, setModelSlug] = useState(pricedModels[0]?.slug ?? "");
  const [inputTokens, setInputTokens] = useState(100_000);
  const [outputTokens, setOutputTokens] = useState(10_000);
  const [requestCount, setRequestCount] = useState(1);

  const selectedModel = pricedModels.find((model) => model.slug === modelSlug);
  const result = selectedModel?.currentPrice
    ? calculateTokenCost({
        inputTokens,
        outputTokens,
        requestCount,
        inputPricePer1M: selectedModel.currentPrice.inputPricePer1M,
        outputPricePer1M: selectedModel.currentPrice.outputPricePer1M,
        cachedInputPricePer1M: selectedModel.currentPrice.cachedInputPricePer1M,
        exchangeRate,
      })
    : null;

  return (
    <div
      className={`grid gap-5 ${compact ? "lg:grid-cols-[1fr_0.8fr]" : "lg:grid-cols-[0.9fr_1.1fr]"}`}
    >
      <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          模型
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
            value={modelSlug}
            onChange={(event) => setModelSlug(event.target.value)}
          >
            {pricedModels.map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          输入 tokens
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm"
            min={0}
            type="number"
            value={inputTokens}
            onChange={(event) => setInputTokens(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          输出 tokens
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm"
            min={0}
            type="number"
            value={outputTokens}
            onChange={(event) => setOutputTokens(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          请求次数
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm"
            min={1}
            type="number"
            value={requestCount}
            onChange={(event) => setRequestCount(Number(event.target.value))}
          />
        </label>
      </form>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
        <h2 className="text-sm font-semibold text-blue-950">估算结果</h2>
        {selectedModel?.currentPrice && result ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-3xl font-semibold tracking-tight text-blue-950">
                {formatUsd(result.totalUsd)}
              </div>
              <div className="text-sm text-blue-700">
                约 {formatCny(result.totalCny)}
              </div>
            </div>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">输入成本</dt>
                <dd className="font-medium">
                  {formatUsd(result.inputCostUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">输出成本</dt>
                <dd className="font-medium">
                  {formatUsd(result.outputCostUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">单次成本</dt>
                <dd className="font-medium">
                  {formatUsd(result.singleRequestUsd)}
                </dd>
              </div>
            </dl>
            <p className="text-xs leading-5 text-slate-500">
              数据源：{selectedModel.currentPrice.sourceName}；最后检查：
              {new Date(
                selectedModel.currentPrice.lastCheckedAt,
              ).toLocaleDateString("zh-CN")}
              。
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">暂无可计算模型价格。</p>
        )}
      </div>
    </div>
  );
}
