"use client";

import { useState } from "react";
import { calculateModelRate } from "@/lib/calculators/pricing";
import { formatUsd } from "@/lib/formatters/number";

export function ModelRateCalculator() {
  const [inputPricePer1M, setInputPricePer1M] = useState(3);
  const [outputPricePer1M, setOutputPricePer1M] = useState(15);
  const [basePricePer1M, setBasePricePer1M] = useState(2);
  const [groupMultiplier, setGroupMultiplier] = useState(1);
  const [routeMultiplier, setRouteMultiplier] = useState(1);

  const result = calculateModelRate({
    inputPricePer1M,
    outputPricePer1M,
    basePricePer1M,
    groupMultiplier,
    routeMultiplier,
  });

  const configText = [
    `model_multiplier=${result.modelMultiplier}`,
    `completion_multiplier=${result.completionMultiplier}`,
    `group_multiplier=${groupMultiplier}`,
    `route_multiplier=${routeMultiplier}`,
  ].join("\n");

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
        <label className="grid gap-2 text-sm font-medium text-foreground/80">
          输入价格 / 1M tokens
          <input
            className="rounded-md border border-input bg-card px-3 py-2 font-mono text-foreground outline-none focus:ring-1 focus:ring-ring"
            min={0}
            step="0.000001"
            type="number"
            value={inputPricePer1M}
            onChange={(event) => setInputPricePer1M(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/80">
          输出价格 / 1M tokens
          <input
            className="rounded-md border border-input bg-card px-3 py-2 font-mono text-foreground outline-none focus:ring-1 focus:ring-ring"
            min={0}
            step="0.000001"
            type="number"
            value={outputPricePer1M}
            onChange={(event) =>
              setOutputPricePer1M(Number(event.target.value))
            }
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/80">
          基准价格 / 1M tokens
          <input
            className="rounded-md border border-input bg-card px-3 py-2 font-mono text-foreground outline-none focus:ring-1 focus:ring-ring"
            min={0.000001}
            step="0.000001"
            type="number"
            value={basePricePer1M}
            onChange={(event) => setBasePricePer1M(Number(event.target.value))}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground/80">
            分组倍率
            <input
              className="rounded-md border border-input bg-card px-3 py-2 font-mono text-foreground outline-none focus:ring-1 focus:ring-ring"
              min={0.000001}
              step="0.000001"
              type="number"
              value={groupMultiplier}
              onChange={(event) =>
                setGroupMultiplier(Number(event.target.value))
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground/80">
            线路倍率
            <input
              className="rounded-md border border-input bg-card px-3 py-2 font-mono text-foreground outline-none focus:ring-1 focus:ring-ring"
              min={0.000001}
              step="0.000001"
              type="number"
              value={routeMultiplier}
              onChange={(event) =>
                setRouteMultiplier(Number(event.target.value))
              }
            />
          </label>
        </div>
      </form>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
        <h2 className="font-display text-sm font-semibold text-primary">
          倍率结果
        </h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">模型倍率</dt>
            <dd className="font-mono font-semibold">
              {result.modelMultiplier}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">补全倍率</dt>
            <dd className="font-mono font-semibold">
              {result.completionMultiplier}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">最终输入价格</dt>
            <dd className="font-mono font-semibold">
              {formatUsd(result.effectiveInputPricePer1M)} / 1M
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">最终输出价格</dt>
            <dd className="font-mono font-semibold">
              {formatUsd(result.effectiveOutputPricePer1M)} / 1M
            </dd>
          </div>
        </dl>
        <label className="mt-5 grid gap-2 text-sm font-medium text-foreground/80">
          可复制配置
          <textarea
            className="min-h-28 rounded-md border border-input bg-card px-3 py-2 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            readOnly
            value={configText}
          />
        </label>
      </div>
    </div>
  );
}
