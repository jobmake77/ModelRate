"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ModelWithPrice } from "@/lib/data-access/models";
import { formatDate, formatNumber } from "@/lib/formatters/number";
import {
  formatPriceSourceName,
  getPriceSourceNotice,
} from "@/lib/formatters/source";
import {
  filterModelsByAudience,
  formatCurrency,
  getModelRegion,
  groupModelsByProvider,
  type CurrencyCode,
  type ModelAudienceFilter,
} from "@/lib/model-presentation";

type CapabilityFilter = "all" | "vision" | "reasoning" | "tools";
type SortKey = "provider" | "input-price" | "output-price" | "context";

type Props = {
  exchangeRate: number;
  initialFilters?: {
    audience: string;
    capability: string;
    currency: string;
    provider: string;
    query: string;
    sortKey: string;
  };
  models: ModelWithPrice[];
};

export function ModelPriceTable({
  exchangeRate,
  initialFilters,
  models,
}: Props) {
  const providers = useMemo(
    () =>
      Array.from(new Set(models.map((model) => model.provider.name))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [models],
  );

  const [query, setQuery] = useState(initialFilters?.query ?? "");
  const [provider, setProvider] = useState(
    initialFilters?.provider && providers.includes(initialFilters.provider)
      ? initialFilters.provider
      : "all",
  );
  const [audience, setAudience] = useState<ModelAudienceFilter>(
    normalizeAudienceFilter(initialFilters?.audience),
  );
  const [capability, setCapability] = useState<CapabilityFilter>(
    normalizeCapabilityFilter(initialFilters?.capability),
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    normalizeCurrency(initialFilters?.currency),
  );
  const [sortKey, setSortKey] = useState<SortKey>(
    normalizeModelSortKey(initialFilters?.sortKey),
  );
  const hasActiveFilters =
    query.trim() !== "" ||
    provider !== "all" ||
    audience !== "all" ||
    capability !== "all" ||
    currency !== "USD" ||
    sortKey !== "provider";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQueryParam(params, "q", query.trim());
    setQueryParam(params, "provider", provider === "all" ? "" : provider);
    setQueryParam(params, "audience", audience === "all" ? "" : audience);
    setQueryParam(params, "capability", capability === "all" ? "" : capability);
    setQueryParam(params, "currency", currency === "USD" ? "" : currency);
    setQueryParam(params, "sort", sortKey === "provider" ? "" : sortKey);
    replaceCurrentQuery(params);
  }, [audience, capability, currency, provider, query, sortKey]);

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const audienceModels = filterModelsByAudience(models, audience);

    return audienceModels
      .filter((model) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            model.displayName,
            model.canonicalModelId,
            model.family,
            model.provider.name,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesProvider =
          provider === "all" || model.provider.name === provider;
        const matchesCapability =
          capability === "all" ||
          (capability === "vision" && model.supportsVision) ||
          (capability === "reasoning" && model.supportsReasoning) ||
          (capability === "tools" && model.supportsFunctionCalling);

        return matchesQuery && matchesProvider && matchesCapability;
      })
      .sort((left, right) => {
        if (sortKey === "input-price") {
          return priceValue(left, "input") - priceValue(right, "input");
        }

        if (sortKey === "output-price") {
          return priceValue(left, "output") - priceValue(right, "output");
        }

        if (sortKey === "context") {
          return right.contextWindow - left.contextWindow;
        }

        return (
          left.provider.name.localeCompare(right.provider.name) ||
          left.displayName.localeCompare(right.displayName)
        );
      });
  }, [audience, capability, models, provider, query, sortKey]);

  const groupedModels = useMemo(
    () => groupModelsByProvider(filteredModels),
    [filteredModels],
  );

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_150px_140px_150px_130px_150px]">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">搜索</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="GPT, Claude, Gemini, Kimi..."
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">厂商</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              <option value="all">全部厂商</option>
              {providers.map((providerName) => (
                <option key={providerName} value={providerName}>
                  {providerName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">范围</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={audience}
              onChange={(event) =>
                setAudience(event.target.value as ModelAudienceFilter)
              }
            >
              <option value="all">全部</option>
              <option value="popular">热门</option>
              <option value="international">国外模型</option>
              <option value="domestic">国内模型</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">能力</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={capability}
              onChange={(event) =>
                setCapability(event.target.value as CapabilityFilter)
              }
            >
              <option value="all">全部能力</option>
              <option value="vision">视觉</option>
              <option value="reasoning">推理</option>
              <option value="tools">工具调用</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">货币</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as CurrencyCode)
              }
            >
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">排序</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="provider">默认</option>
              <option value="input-price">输入价格</option>
              <option value="output-price">输出价格</option>
              <option value="context">上下文</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            当前展示 {filteredModels.length} / {models.length} 个模型
          </span>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={!hasActiveFilters}
            onClick={() => {
              setQuery("");
              setProvider("all");
              setAudience("all");
              setCapability("all");
              setCurrency("USD");
              setSortKey("provider");
            }}
            type="button"
          >
            重置筛选
          </button>
        </div>
      </div>

      <div className="grid gap-5">
        {groupedModels.map((group) => (
          <section
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            key={group.providerName}
          >
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="font-semibold text-slate-950">
                {group.providerName}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">模型</th>
                    <th className="px-4 py-3">区域</th>
                    <th className="px-4 py-3">输入 / 1M</th>
                    <th className="px-4 py-3">输出 / 1M</th>
                    <th className="px-4 py-3">上下文</th>
                    <th className="px-4 py-3">能力</th>
                    <th className="px-4 py-3">来源</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.models.map((model) => (
                    <tr
                      key={model.slug}
                      className="align-top hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <Link
                          className="font-medium text-slate-950 hover:underline"
                          href={`/models/${model.slug}`}
                        >
                          {model.displayName}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">
                          {model.canonicalModelId}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getModelRegion(model) === "domestic" ? "国内" : "国外"}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {model.currentPrice
                          ? formatCurrency(
                              model.currentPrice.inputPricePer1M,
                              currency,
                              exchangeRate,
                            )
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {model.currentPrice
                          ? formatCurrency(
                              model.currentPrice.outputPricePer1M,
                              currency,
                              exchangeRate,
                            )
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4">
                        {formatNumber(model.contextWindow)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {model.supportsVision ? (
                            <Badge tone="blue">视觉</Badge>
                          ) : null}
                          {model.supportsReasoning ? (
                            <Badge tone="amber">推理</Badge>
                          ) : null}
                          {model.supportsFunctionCalling ? (
                            <Badge tone="green">工具</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {model.currentPrice ? (
                          <div>
                            <a
                              className="font-medium text-blue-700 hover:underline"
                              href={model.currentPrice.sourceUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {formatPriceSourceName(model.currentPrice)}
                            </a>
                            {getPriceSourceNotice(model.currentPrice) ? (
                              <div className="mt-1 text-xs text-amber-700">
                                {getPriceSourceNotice(model.currentPrice)}
                              </div>
                            ) : null}
                            <div className="mt-1 text-xs text-slate-500">
                              Checked{" "}
                              {formatDate(model.currentPrice.lastCheckedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">暂无当前价格</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {!filteredModels.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
          没有模型匹配当前筛选。
        </div>
      ) : null}
    </div>
  );
}

function priceValue(model: ModelWithPrice, kind: "input" | "output") {
  if (!model.currentPrice) {
    return Number.POSITIVE_INFINITY;
  }

  return kind === "input"
    ? model.currentPrice.inputPricePer1M
    : model.currentPrice.outputPricePer1M;
}

function isCapabilityFilter(value: string | null): value is CapabilityFilter {
  return (
    value === "all" ||
    value === "vision" ||
    value === "reasoning" ||
    value === "tools"
  );
}

function isAudienceFilter(value: string | null): value is ModelAudienceFilter {
  return (
    value === "all" ||
    value === "popular" ||
    value === "domestic" ||
    value === "international"
  );
}

function isCurrency(value: string | null): value is CurrencyCode {
  return value === "USD" || value === "CNY";
}

function isModelSortKey(value: string | null): value is SortKey {
  return (
    value === "provider" ||
    value === "input-price" ||
    value === "output-price" ||
    value === "context"
  );
}

function normalizeAudienceFilter(value: string | undefined) {
  const normalized = value ?? "";
  return isAudienceFilter(normalized) ? normalized : "all";
}

function normalizeCapabilityFilter(value: string | undefined) {
  const normalized = value ?? "";
  return isCapabilityFilter(normalized) ? normalized : "all";
}

function normalizeCurrency(value: string | undefined) {
  const normalized = value ?? "";
  return isCurrency(normalized) ? normalized : "USD";
}

function normalizeModelSortKey(value: string | undefined) {
  const normalized = value ?? "";
  return isModelSortKey(normalized) ? normalized : "provider";
}

function setQueryParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function replaceCurrentQuery(params: URLSearchParams) {
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}
