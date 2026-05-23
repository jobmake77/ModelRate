"use client";

import { useMemo, useState } from "react";
import type { ModelWithPrice } from "@/lib/data-access/models";
import { calculateMultiplierCostComparison } from "@/lib/calculators/pricing";
import { formatDate, formatNumber, formatUsd } from "@/lib/formatters/number";
import {
  formatPriceSourceName,
  getPriceSourceNotice,
} from "@/lib/formatters/source";
import {
  type CurrencyCode,
  formatCurrency,
  groupModelsByProvider,
} from "@/lib/model-presentation";

type Props = {
  models: ModelWithPrice[];
  exchangeRate: number;
};

const multiplierPresets = [1, 1.5, 2, 3, 5];

export function UnifiedCostRateCalculator({ models, exchangeRate }: Props) {
  const pricedModels = useMemo(
    () => models.filter((model) => model.currentPrice),
    [models],
  );
  const groupedModels = useMemo(
    () => groupModelsByProvider(pricedModels),
    [pricedModels],
  );
  const [modelSlug, setModelSlug] = useState(pricedModels[0]?.slug ?? "");
  const [inputTokens, setInputTokens] = useState(100_000);
  const [outputTokens, setOutputTokens] = useState(10_000);
  const [multiplier, setMultiplier] = useState(2);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const selectedModel = pricedModels.find((model) => model.slug === modelSlug);
  const normalizedInputTokens = Math.max(0, inputTokens || 0);
  const normalizedOutputTokens = Math.max(0, outputTokens || 0);
  const normalizedMultiplier = Math.max(0.01, multiplier || 1);
  const currentPrice = selectedModel?.currentPrice;

  const comparison = currentPrice
    ? calculateMultiplierCostComparison({
        inputTokens: normalizedInputTokens,
        outputTokens: normalizedOutputTokens,
        inputPricePer1M: currentPrice.inputPricePer1M,
        outputPricePer1M: currentPrice.outputPricePer1M,
        cachedInputPricePer1M: currentPrice.cachedInputPricePer1M,
        exchangeRate,
        multiplier: normalizedMultiplier,
      })
    : null;
  const baseResult = comparison?.base ?? null;
  const multipliedResult = comparison?.multiplied ?? null;
  const deltaUsd = comparison?.deltaUsd ?? 0;
  const deltaPercent = comparison?.deltaPercent ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          模型
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
            value={modelSlug}
            onChange={(event) => setModelSlug(event.target.value)}
          >
            {groupedModels.map((group) => (
              <optgroup key={group.providerName} label={group.providerName}>
                {group.models.map((model) => (
                  <option key={model.slug} value={model.slug}>
                    {model.displayName} ·{" "}
                    {formatUsd(model.currentPrice!.inputPricePer1M)}
                    /1M in · {formatUsd(model.currentPrice!.outputPricePer1M)}
                    /1M out · {formatNumber(model.contextWindow)} ctx
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="输入 tokens"
            min={0}
            value={inputTokens}
            onChange={setInputTokens}
          />
          <NumberField
            label="输出 tokens"
            min={0}
            value={outputTokens}
            onChange={setOutputTokens}
          />
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">倍率</span>
          <div className="flex flex-wrap gap-2">
            {multiplierPresets.map((preset) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  multiplier === preset
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
                key={preset}
                onClick={() => setMultiplier(preset)}
                type="button"
              >
                {preset}x
              </button>
            ))}
          </div>
          <NumberField
            label="自定义倍率"
            min={0.01}
            step={0.01}
            value={multiplier}
            onChange={setMultiplier}
          />
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">货币</span>
          <div className="inline-flex w-fit overflow-hidden rounded-md border border-slate-300 bg-white">
            {(["USD", "CNY"] as const).map((item) => (
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  currency === item
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                key={item}
                onClick={() => setCurrency(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </form>

      <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-950">估算结果</p>
            <p className="mt-1 text-sm text-blue-700">
              同时展示基础成本和 {normalizedMultiplier}x 倍率后的成本。
            </p>
          </div>
          <div className="rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-950 shadow-sm">
            USD/CNY {exchangeRate.toFixed(4)}
          </div>
        </div>

        {selectedModel && currentPrice && baseResult && multipliedResult ? (
          <div className="mt-5 grid gap-4">
            <ResultPanel
              currency={currency}
              exchangeRate={exchangeRate}
              inputCostUsd={baseResult.inputCostUsd}
              outputCostUsd={baseResult.outputCostUsd}
              title="基础价格"
              totalUsd={baseResult.totalUsd}
            />
            <ResultPanel
              currency={currency}
              exchangeRate={exchangeRate}
              inputCostUsd={multipliedResult.inputCostUsd}
              outputCostUsd={multipliedResult.outputCostUsd}
              title={`${normalizedMultiplier}x 倍率后`}
              totalUsd={multipliedResult.totalUsd}
            />

            <div className="rounded-md border border-blue-200 bg-white p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">倍率差额</span>
                <span className="font-semibold text-slate-950">
                  {formatCurrency(deltaUsd, currency, exchangeRate)}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-slate-600">变化幅度</span>
                <span className="font-semibold text-slate-950">
                  {Number.isFinite(deltaPercent)
                    ? `${deltaPercent.toFixed(2)}%`
                    : "N/A"}
                </span>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              数据源：
              <a
                className="font-medium text-blue-700 hover:underline"
                href={currentPrice.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {formatPriceSourceName(currentPrice)}
              </a>
              ；最后检查：{formatDate(currentPrice.lastCheckedAt)}。
              {getPriceSourceNotice(currentPrice)
                ? ` ${getPriceSourceNotice(currentPrice)}`
                : ""}
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-600">暂无可计算模型价格。</p>
        )}
      </section>
    </div>
  );
}

function NumberField({
  label,
  min,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ResultPanel({
  currency,
  exchangeRate,
  inputCostUsd,
  outputCostUsd,
  title,
  totalUsd,
}: {
  currency: CurrencyCode;
  exchangeRate: number;
  inputCostUsd: number;
  outputCostUsd: number;
  title: string;
  totalUsd: number;
}) {
  return (
    <div className="rounded-md border border-blue-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <div className="text-2xl font-semibold tracking-tight text-blue-950">
          {formatCurrency(totalUsd, currency, exchangeRate)}
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">输入成本</dt>
          <dd className="font-medium">
            {formatCurrency(inputCostUsd, currency, exchangeRate)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">输出成本</dt>
          <dd className="font-medium">
            {formatCurrency(outputCostUsd, currency, exchangeRate)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
