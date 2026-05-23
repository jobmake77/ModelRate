"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ModelWithPrice } from "@/lib/data-access/models";
import { formatDate, formatUsd } from "@/lib/formatters/number";
import {
  filterModelsByAudience,
  groupModelsByProvider,
  type ModelAudienceFilter,
} from "@/lib/model-presentation";

type Props = {
  models: ModelWithPrice[];
};

const filters: Array<{ label: string; value: ModelAudienceFilter }> = [
  { label: "热门", value: "popular" },
  { label: "国外模型", value: "international" },
  { label: "国内模型", value: "domestic" },
];

export function PopularModelGroups({ models }: Props) {
  const [filter, setFilter] = useState<ModelAudienceFilter>("popular");
  const groupedModels = useMemo(() => {
    const pricedModels = models.filter((model) => model.currentPrice);
    return groupModelsByProvider(filterModelsByAudience(pricedModels, filter));
  }, [filter, models]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700">Model pricing</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            热门模型价格
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                filter === item.value
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              key={item.value}
              onClick={() => setFilter(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {groupedModels.map((group) => (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={group.providerName}
          >
            <h3 className="font-semibold text-slate-950">
              {group.providerName}
            </h3>
            <div className="mt-3 grid gap-3">
              {group.models.slice(0, 4).map((model) => (
                <div
                  className="flex items-start justify-between gap-4 rounded-md bg-white p-3 text-sm"
                  key={model.slug}
                >
                  <div>
                    <Link
                      className="font-medium text-slate-950 hover:underline"
                      href={`/models/${model.slug}`}
                    >
                      {model.displayName}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {model.canonicalModelId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatUsd(model.currentPrice!.inputPricePer1M)} in
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatUsd(model.currentPrice!.outputPricePer1M)} out
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {formatDate(model.currentPrice!.lastCheckedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!groupedModels.length ? (
        <p className="mt-5 text-sm text-slate-500">暂无匹配的模型价格。</p>
      ) : null}

      <Link
        className="mt-5 inline-flex text-sm font-medium text-blue-700 hover:underline"
        href="/models"
      >
        查看完整模型价格表
      </Link>
    </section>
  );
}
