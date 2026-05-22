"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ModelWithPrice } from "@/lib/data-access/models";
import { formatDate, formatNumber, formatUsd } from "@/lib/formatters/number";

type CapabilityFilter = "all" | "vision" | "reasoning" | "tools";
type SortKey = "provider" | "input-price" | "output-price" | "context";

type Props = {
  models: ModelWithPrice[];
};

export function ModelPriceTable({ models }: Props) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [capability, setCapability] = useState<CapabilityFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("provider");
  const hasActiveFilters =
    query.trim() !== "" ||
    provider !== "all" ||
    capability !== "all" ||
    sortKey !== "provider";

  const providers = useMemo(
    () =>
      Array.from(new Set(models.map((model) => model.provider.name))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [models],
  );

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return models
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
  }, [capability, models, provider, query, sortKey]);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Search</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="GPT, Claude, Gemini..."
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Provider</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              <option value="all">All providers</option>
              {providers.map((providerName) => (
                <option key={providerName} value={providerName}>
                  {providerName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Capability</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={capability}
              onChange={(event) =>
                setCapability(event.target.value as CapabilityFilter)
              }
            >
              <option value="all">All capabilities</option>
              <option value="vision">Vision</option>
              <option value="reasoning">Reasoning</option>
              <option value="tools">Tools</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Sort by</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="provider">Default order</option>
              <option value="input-price">Input price</option>
              <option value="output-price">Output price</option>
              <option value="context">Context</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing {filteredModels.length} of {models.length} models
          </span>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={!hasActiveFilters}
            onClick={() => {
              setQuery("");
              setProvider("all");
              setCapability("all");
              setSortKey("provider");
            }}
            type="button"
          >
            Reset filters
          </button>
        </div>
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
              {filteredModels.map((model) => (
                <tr key={model.slug} className="align-top hover:bg-slate-50">
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
                          rel="noreferrer"
                          target="_blank"
                        >
                          {model.currentPrice.sourceName}
                        </a>
                        <div className="mt-1 text-xs text-slate-500">
                          Checked {formatDate(model.currentPrice.lastCheckedAt)}
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
        {!filteredModels.length ? (
          <div className="border-t border-slate-200 p-5 text-sm text-slate-500">
            No models match the current filters.
          </div>
        ) : null}
      </div>
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
