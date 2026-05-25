"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Database,
  Search,
} from "lucide-react";
import type { ModelWithPrice } from "@/lib/data-access/models";
import { ProviderAvatar } from "@/components/public/provider-avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/formatters/number";
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
  const [multiplierInput, setMultiplierInput] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [copied, setCopied] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const selectedModel = pricedModels.find((model) => model.slug === modelSlug);
  const currentPrice = selectedModel?.currentPrice;
  const multiplier = Number(multiplierInput);
  const hasMultiplier = multiplierInput.trim() !== "";
  const multiplierError =
    hasMultiplier && (!Number.isFinite(multiplier) || multiplier <= 0)
      ? "倍率必须是大于 0 的数字，例如 0.2 或 1.5。"
      : "";
  const canCalculate = Boolean(
    currentPrice && hasMultiplier && !multiplierError,
  );
  const sourceStatus = currentPrice
    ? getSourceStatus(currentPrice.lastCheckedAt, currentPrice.sourceType)
    : null;
  const searchedGroupedModels = useMemo(
    () => filterGroupedModels(groupedModels, modelSearch),
    [groupedModels, modelSearch],
  );

  const baseInputUsd = currentPrice?.inputPricePer1M ?? 0;
  const baseOutputUsd = currentPrice?.outputPricePer1M ?? 0;
  const multipliedInputUsd = canCalculate ? baseInputUsd * multiplier : null;
  const multipliedOutputUsd = canCalculate ? baseOutputUsd * multiplier : null;

  useEffect(() => {
    if (!isModelPickerOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        modelPickerRef.current &&
        !modelPickerRef.current.contains(event.target as Node)
      ) {
        setIsModelPickerOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModelPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModelPickerOpen]);

  async function handleCopy() {
    if (!selectedModel || !currentPrice || !canCalculate) {
      return;
    }

    await navigator.clipboard.writeText(
      [
        `${selectedModel.provider.name} · ${selectedModel.displayName}`,
        `基础输入 / 1M: ${formatCurrency(baseInputUsd, currency, exchangeRate)}`,
        `基础输出 / 1M: ${formatCurrency(baseOutputUsd, currency, exchangeRate)}`,
        `倍率: ${multiplierInput}x`,
        `倍率后输入 / 1M: ${formatCurrency(multipliedInputUsd!, currency, exchangeRate)}`,
        `倍率后输出 / 1M: ${formatCurrency(multipliedOutputUsd!, currency, exchangeRate)}`,
        `数据源: ${formatPriceSourceName(currentPrice)}`,
        `Last checked: ${formatDate(currentPrice.lastCheckedAt)}`,
      ].join("\n"),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <form
        className="grid min-w-0 gap-4 rounded-xl border bg-secondary/40 p-4 sm:p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid min-w-0 gap-2" ref={modelPickerRef}>
          <span className="text-sm font-medium text-foreground/80">模型</span>
          <button
            aria-expanded={isModelPickerOpen}
            aria-haspopup="listbox"
            aria-label="模型"
            className="flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 py-2 text-left text-foreground outline-none transition hover:border-foreground/25 focus:ring-1 focus:ring-ring"
            onClick={() => setIsModelPickerOpen((value) => !value)}
            type="button"
          >
            {selectedModel ? (
              <span className="flex min-w-0 items-center gap-3">
                <ProviderAvatar label={selectedModel.provider.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {selectedModel.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {selectedModel.provider.name} ·{" "}
                    {formatCurrency(baseInputUsd, currency, exchangeRate)} /{" "}
                    {formatCurrency(baseOutputUsd, currency, exchangeRate)} per
                    1M
                  </span>
                </span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                选择一个模型
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 flex-none text-muted-foreground transition ${
                isModelPickerOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isModelPickerOpen ? (
            <div className="relative z-30">
              <div
                className="absolute left-0 right-0 top-1 max-h-[420px] overflow-hidden rounded-xl border bg-card shadow-soft"
                role="listbox"
              >
                <div className="border-b p-2">
                  <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2">
                    <Search className="h-3.5 w-3.5 flex-none text-muted-foreground" />
                    <input
                      autoFocus
                      className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      onChange={(event) => setModelSearch(event.target.value)}
                      placeholder="搜索模型或厂商"
                      value={modelSearch}
                    />
                  </div>
                </div>
                <div className="max-h-[350px] overflow-y-auto p-2">
                  {searchedGroupedModels.length > 0 ? (
                    searchedGroupedModels.map((group) => (
                      <div className="py-1" key={group.providerName}>
                        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.providerName}
                        </div>
                        <div className="grid gap-1">
                          {group.models.map((model) => (
                            <ModelOption
                              currency={currency}
                              exchangeRate={exchangeRate}
                              isSelected={model.slug === modelSlug}
                              key={model.slug}
                              model={model}
                              onSelect={() => {
                                setModelSlug(model.slug);
                                setIsModelPickerOpen(false);
                                setModelSearch("");
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      没有匹配的模型。
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground/80">
          中转站倍率
          <input
            className={`h-11 w-full min-w-0 rounded-md border bg-card px-3 py-2 font-mono text-foreground outline-none focus:ring-1 focus:ring-ring ${
              multiplierError
                ? "border-red-300 focus:ring-red-300"
                : "border-input"
            }`}
            inputMode="decimal"
            placeholder="例如 0.2"
            type="number"
            min="0.000001"
            step="0.01"
            value={multiplierInput}
            onChange={(event) => setMultiplierInput(event.target.value)}
          />
          {multiplierError ? (
            <span className="text-xs font-normal text-red-600">
              {multiplierError}
            </span>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">
              直接输入中转站倍率，例如 0.2 表示官方单价的 20%。
            </span>
          )}
        </label>

        {selectedModel && currentPrice ? (
          <div className="min-w-0 rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <ProviderAvatar
                className="mt-0.5"
                label={selectedModel.provider.name}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {selectedModel.provider.name}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
                  {selectedModel.displayName}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {selectedModel.description}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ModelInfoMetric
                icon={<Database className="h-3.5 w-3.5" />}
                label="上下文窗口（来源值）"
                value={formatTokenLimit(selectedModel.contextWindow)}
              />
              <ModelInfoMetric
                label="最大输出（来源值）"
                value={formatTokenLimit(selectedModel.maxOutputTokens)}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              上下文和最大输出只展示来源可查字段；来源未公开时显示“未公开”，不做估算。
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {selectedModel.supportsVision ? (
                <Badge tone="blue">Vision</Badge>
              ) : null}
              {selectedModel.supportsReasoning ? (
                <Badge tone="amber">Reasoning</Badge>
              ) : null}
              {selectedModel.supportsFunctionCalling ? (
                <Badge tone="green">Tools</Badge>
              ) : null}
              {sourceStatus ? (
                <Badge tone={sourceStatus.tone}>{sourceStatus.label}</Badge>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground">
              <div className="flex items-start justify-between gap-3">
                <span>Source</span>
                <a
                  className="text-right font-medium text-primary hover:underline"
                  href={currentPrice.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {formatPriceSourceName(currentPrice)}
                </a>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Last checked</span>
                <span className="font-mono">
                  {formatDate(currentPrice.lastCheckedAt)}
                </span>
              </div>
              {getPriceSourceNotice(currentPrice) ? (
                <p className="leading-5 text-amber-700">
                  {getPriceSourceNotice(currentPrice)}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            暂无可计算模型价格。
          </div>
        )}
      </form>

      <section className="min-w-0 rounded-xl border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {selectedModel ? (
                <ProviderAvatar label={selectedModel.provider.name} size="sm" />
              ) : null}
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {selectedModel
                  ? `${selectedModel.provider.name} · ${selectedModel.displayName}`
                  : "ModelRate"}
              </span>
            </div>
            <h3 className="mt-1 font-display text-base font-semibold">
              每 1M tokens 单价换算
            </h3>
            <p className="text-xs text-muted-foreground">
              展示官方基础单价和中转站倍率后的输入/输出单价。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
            <button
              className="inline-flex h-8 items-center rounded-md border border-input bg-card px-2.5 text-xs font-medium transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canCalculate}
              onClick={handleCopy}
              type="button"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">{copied ? "已复制" : "复制"}</span>
            </button>
          </div>
        </div>

        {selectedModel && currentPrice ? (
          <div className="mt-5 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <PriceTile
                label="基础输入 / 1M"
                value={formatCurrency(baseInputUsd, currency, exchangeRate)}
                variant="base"
              />
              <PriceTile
                label="基础输出 / 1M"
                value={formatCurrency(baseOutputUsd, currency, exchangeRate)}
                emphasis
                variant="base"
              />
            </div>

            {canCalculate ? (
              <div className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-soft">
                <div className="border-b border-primary/20 bg-primary/10 px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        Relay converted price
                      </p>
                      <h2 className="mt-0.5 text-sm font-semibold">
                        中转站换算价 · {multiplierInput}x
                      </h2>
                    </div>
                    <span className="rounded-full bg-card/80 px-2 py-0.5 font-mono text-xs text-primary ring-1 ring-primary/20">
                      per 1M tokens
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <PriceTile
                    label="倍率后输入 / 1M"
                    value={formatCurrency(
                      multipliedInputUsd!,
                      currency,
                      exchangeRate,
                    )}
                    variant="converted"
                  />
                  <PriceTile
                    label="倍率后输出 / 1M"
                    value={formatCurrency(
                      multipliedOutputUsd!,
                      currency,
                      exchangeRate,
                    )}
                    emphasis
                    variant="converted"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-secondary/30 p-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <p>请输入倍率后查看中转站换算结果。</p>
                </div>
              </div>
            )}

            <p className="text-xs leading-5 text-muted-foreground">
              数据源：
              <a
                className="font-medium text-primary hover:underline"
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
          <p className="mt-5 text-sm text-muted-foreground">
            暂无可计算模型价格。
          </p>
        )}
      </section>
    </div>
  );
}

function ModelOption({
  currency,
  exchangeRate,
  isSelected,
  model,
  onSelect,
}: {
  currency: CurrencyCode;
  exchangeRate: number;
  isSelected: boolean;
  model: ModelWithPrice;
  onSelect: () => void;
}) {
  const price = model.currentPrice;

  return (
    <button
      aria-selected={isSelected}
      className={`grid w-full min-w-0 gap-2 rounded-lg px-2.5 py-2 text-left transition ${
        isSelected ? "bg-primary/10" : "hover:bg-secondary"
      }`}
      onClick={onSelect}
      role="option"
      type="button"
    >
      <span className="flex min-w-0 items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <ProviderAvatar label={model.provider.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {model.displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {model.provider.name}
            </span>
          </span>
        </span>
        {isSelected ? (
          <Check className="h-4 w-4 flex-none text-primary" />
        ) : null}
      </span>

      <span className="grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-[1fr_auto]">
        <span className="truncate">
          上下文 {formatTokenLimit(model.contextWindow)} · 最大输出{" "}
          {formatTokenLimit(model.maxOutputTokens)}
        </span>
        {price ? (
          <span className="font-mono tabular-nums text-foreground/70">
            {formatCurrency(price.inputPricePer1M, currency, exchangeRate)} /{" "}
            {formatCurrency(price.outputPricePer1M, currency, exchangeRate)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function filterGroupedModels(
  groups: ReturnType<typeof groupModelsByProvider>,
  search: string,
) {
  const keyword = search.trim().toLowerCase();

  if (!keyword) {
    return groups;
  }

  return groups
    .map((group) => ({
      providerName: group.providerName,
      models: group.models.filter((model) =>
        [
          group.providerName,
          model.provider.name,
          model.displayName,
          model.canonicalModelId,
          model.family,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword),
      ),
    }))
    .filter((group) => group.models.length > 0);
}

function CurrencyToggle({
  currency,
  onChange,
}: {
  currency: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}) {
  return (
    <div
      aria-label="货币"
      className="inline-flex overflow-hidden rounded-md border border-input bg-card p-0.5"
      role="group"
    >
      {(["USD", "CNY"] as const).map((item) => (
        <button
          aria-pressed={currency === item}
          className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
            currency === item
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:bg-secondary"
          }`}
          key={item}
          onClick={() => onChange(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ModelInfoMetric({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function PriceTile({
  emphasis = false,
  label,
  value,
  variant = "base",
}: {
  emphasis?: boolean;
  label: string;
  value: string;
  variant?: "base" | "converted";
}) {
  const isConverted = variant === "converted";

  return (
    <div
      className={`rounded-lg border p-3 ${
        isConverted ? "border-primary/20 bg-primary/[0.07]" : "bg-background"
      }`}
    >
      <div
        className={`text-xs ${
          isConverted ? "font-medium text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 font-mono font-semibold tabular-nums ${
          emphasis
            ? isConverted
              ? "text-3xl text-primary"
              : "text-2xl text-foreground"
            : isConverted
              ? "text-2xl text-primary"
              : "text-xl text-foreground/85"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function getSourceStatus(
  lastCheckedAt: string,
  sourceType: string,
): { label: string; tone: "green" | "amber" | "slate" } {
  if (sourceType === "manual") {
    return { label: "人工预估，待核验", tone: "amber" };
  }

  const ageMs = Date.now() - new Date(lastCheckedAt).getTime();
  const ageDays = ageMs / 86_400_000;

  if (ageDays > 30) {
    return { label: "可能过期", tone: "slate" };
  }

  return { label: "已核验", tone: "green" };
}

function formatTokenLimit(value: number) {
  return value > 0 ? formatNumber(value) : "未公开";
}
