"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Brain,
  Database,
  Eye,
  Globe2,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { ProviderAvatar } from "@/components/public/provider-avatar";
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
  isPopularModel,
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
    <div className="grid gap-5">
      <ModelFilterCommandBar
        audience={audience}
        capability={capability}
        currency={currency}
        filteredCount={filteredModels.length}
        hasActiveFilters={hasActiveFilters}
        modelsCount={models.length}
        provider={provider}
        providers={providers}
        query={query}
        sortKey={sortKey}
        onAudienceChange={setAudience}
        onCapabilityChange={setCapability}
        onCurrencyChange={setCurrency}
        onProviderChange={setProvider}
        onQueryChange={setQuery}
        onReset={() => {
          setQuery("");
          setProvider("all");
          setAudience("all");
          setCapability("all");
          setCurrency("USD");
          setSortKey("provider");
        }}
        onSortKeyChange={setSortKey}
      />

      <div className="grid gap-5">
        {groupedModels.map((group) => (
          <section
            className="overflow-hidden rounded-2xl border bg-card shadow-soft"
            key={group.providerName}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 bg-muted/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <ProviderAvatar label={group.providerName} size="lg" />
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {group.providerName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {group.models.length} 个模型 · 国内{" "}
                    {
                      group.models.filter(
                        (model) => getModelRegion(model) === "domestic",
                      ).length
                    }{" "}
                    / 国外{" "}
                    {
                      group.models.filter(
                        (model) => getModelRegion(model) === "international",
                      ).length
                    }
                  </p>
                </div>
              </div>
              <Badge tone="slate">
                {group.models.filter(isPopularModel).length} popular
              </Badge>
            </div>
            <div className="grid divide-y divide-border/70">
              {group.models.map((model) => (
                <ModelPriceRowCard
                  currency={currency}
                  exchangeRate={exchangeRate}
                  key={model.slug}
                  model={model}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {!filteredModels.length ? (
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground shadow-soft">
          没有模型匹配当前筛选。
        </div>
      ) : null}
    </div>
  );
}

function ModelFilterCommandBar({
  audience,
  capability,
  currency,
  filteredCount,
  hasActiveFilters,
  modelsCount,
  onAudienceChange,
  onCapabilityChange,
  onCurrencyChange,
  onProviderChange,
  onQueryChange,
  onReset,
  onSortKeyChange,
  provider,
  providers,
  query,
  sortKey,
}: {
  audience: ModelAudienceFilter;
  capability: CapabilityFilter;
  currency: CurrencyCode;
  filteredCount: number;
  hasActiveFilters: boolean;
  modelsCount: number;
  onAudienceChange: (value: ModelAudienceFilter) => void;
  onCapabilityChange: (value: CapabilityFilter) => void;
  onCurrencyChange: (value: CurrencyCode) => void;
  onProviderChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onReset: () => void;
  onSortKeyChange: (value: SortKey) => void;
  provider: string;
  providers: string[];
  query: string;
  sortKey: SortKey;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">搜索</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="搜索"
            className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            placeholder="搜索模型、厂商或模型 ID..."
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <SegmentedControl
          items={[
            ["all", "全部"],
            ["popular", "热门"],
            ["international", "国外"],
            ["domestic", "国内"],
          ]}
          value={audience}
          onChange={(value) => onAudienceChange(value as ModelAudienceFilter)}
        />

        <SegmentedControl
          items={[
            ["USD", "USD"],
            ["CNY", "CNY"],
          ]}
          value={currency}
          onChange={(value) => onCurrencyChange(value as CurrencyCode)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ChipButton
          active={provider === "all"}
          onClick={() => onProviderChange("all")}
        >
          全部厂商
        </ChipButton>
        {providers.map((providerName) => (
          <ChipButton
            active={provider === providerName}
            key={providerName}
            onClick={() => onProviderChange(providerName)}
          >
            {providerName}
          </ChipButton>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CapabilityFilterButton
            active={capability === "all"}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="全部能力"
            onClick={() => onCapabilityChange("all")}
          />
          <CapabilityFilterButton
            active={capability === "vision"}
            icon={<Eye className="h-3.5 w-3.5" />}
            label="视觉"
            onClick={() => onCapabilityChange("vision")}
          />
          <CapabilityFilterButton
            active={capability === "reasoning"}
            icon={<Brain className="h-3.5 w-3.5" />}
            label="推理"
            onClick={() => onCapabilityChange("reasoning")}
          />
          <CapabilityFilterButton
            active={capability === "tools"}
            icon={<Wrench className="h-3.5 w-3.5" />}
            label="工具调用"
            onClick={() => onCapabilityChange("tools")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {filteredCount} / {modelsCount}
          </span>
          <label className="inline-flex items-center gap-1 rounded-md border border-input bg-card px-2.5 py-1.5 text-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">排序</span>
            <select
              aria-label="排序"
              className="bg-transparent outline-none"
              value={sortKey}
              onChange={(event) =>
                onSortKeyChange(event.target.value as SortKey)
              }
            >
              <option value="provider">默认</option>
              <option value="input-price">输入价格</option>
              <option value="output-price">输出价格</option>
              <option value="context">上下文</option>
            </select>
          </label>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-sm font-medium text-foreground/70 transition hover:bg-secondary disabled:hidden"
            disabled={!hasActiveFilters}
            onClick={onReset}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
            重置筛选
          </button>
        </div>
      </div>
    </section>
  );
}

function ModelPriceRowCard({
  currency,
  exchangeRate,
  model,
}: {
  currency: CurrencyCode;
  exchangeRate: number;
  model: ModelWithPrice;
}) {
  const currentPrice = model.currentPrice;

  return (
    <article className="grid gap-4 px-5 py-4 transition hover:bg-accent/35 xl:grid-cols-[minmax(260px,1fr)_minmax(420px,1.2fr)_minmax(190px,0.7fr)]">
      <div className="flex gap-3">
        <ProviderAvatar label={model.provider.name} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="font-display text-base font-semibold hover:text-primary"
              href={`/models/${model.slug}`}
            >
              {model.displayName}
            </Link>
            {isPopularModel(model) ? (
              <CapabilityPill
                icon={<Sparkles className="h-3.5 w-3.5" />}
                label="热门"
              />
            ) : null}
          </div>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {model.canonicalModelId}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <CapabilityPill
              icon={<Globe2 className="h-3.5 w-3.5" />}
              label={getModelRegion(model) === "domestic" ? "国内" : "国外"}
            />
            {model.supportsVision ? (
              <CapabilityPill
                icon={<Eye className="h-3.5 w-3.5" />}
                label="视觉"
              />
            ) : null}
            {model.supportsReasoning ? (
              <CapabilityPill
                icon={<Brain className="h-3.5 w-3.5" />}
                label="推理"
              />
            ) : null}
            {model.supportsFunctionCalling ? (
              <CapabilityPill
                icon={<Wrench className="h-3.5 w-3.5" />}
                label="工具"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="输入 / 1M"
          tone="secondary"
          value={
            currentPrice
              ? formatCurrency(
                  currentPrice.inputPricePer1M,
                  currency,
                  exchangeRate,
                )
              : "N/A"
          }
        />
        <MetricTile
          label="输出 / 1M"
          tone="primary"
          value={
            currentPrice
              ? formatCurrency(
                  currentPrice.outputPricePer1M,
                  currency,
                  exchangeRate,
                )
              : "N/A"
          }
        />
        <MetricTile
          icon={<Database className="h-3.5 w-3.5" />}
          label="上下文"
          tone="muted"
          value={formatNumber(model.contextWindow)}
        />
      </div>

      <div className="rounded-xl border border-dashed border-border/80 bg-background/60 p-3 text-xs">
        {currentPrice ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">数据来源</span>
              <a
                className="text-right font-medium text-primary hover:underline"
                href={currentPrice.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {formatPriceSourceName(currentPrice)}
              </a>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-muted-foreground">
              <span>Last checked</span>
              <span className="font-mono">
                {formatDate(currentPrice.lastCheckedAt)}
              </span>
            </div>
            {getPriceSourceNotice(currentPrice) ? (
              <p className="mt-2 leading-5 text-amber-700">
                {getPriceSourceNotice(currentPrice)}
              </p>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground">暂无当前价格</span>
        )}
      </div>
    </article>
  );
}

function MetricTile({
  icon,
  label,
  tone,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  tone: "muted" | "primary" | "secondary";
  value: string;
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/25 bg-primary/5 text-primary"
      : tone === "secondary"
        ? "bg-card"
        : "bg-secondary/40";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={`mt-2 font-mono font-semibold tabular-nums ${
          tone === "primary" ? "text-2xl" : "text-xl text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function CapabilityPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-1 text-xs font-medium text-foreground/75">
      {icon}
      {label}
    </span>
  );
}

function CapabilityFilterButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground/70 hover:bg-secondary"
      }`}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function ChipButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground/70 hover:bg-secondary"
      }`}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SegmentedControl({
  items,
  onChange,
  value,
}: {
  items: Array<[string, string]>;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="inline-flex w-fit overflow-hidden rounded-xl border border-input bg-secondary/40 p-1">
      {items.map(([itemValue, label]) => (
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === itemValue
              ? "bg-foreground text-background shadow-sm"
              : "text-foreground/70 hover:bg-card"
          }`}
          aria-pressed={value === itemValue}
          key={itemValue}
          onClick={() => onChange(itemValue)}
          type="button"
        >
          {label}
        </button>
      ))}
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
