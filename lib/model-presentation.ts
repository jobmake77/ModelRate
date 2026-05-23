import type { ModelWithPrice } from "@/lib/data-access/models";
import { formatCny, formatUsd } from "@/lib/formatters/number";

export type ModelRegion = "domestic" | "international";
export type ModelAudienceFilter = "all" | "popular" | ModelRegion;
export type CurrencyCode = "USD" | "CNY";

const domesticProviderSlugs = new Set([
  "deepseek",
  "moonshot",
  "zhipu",
  "volcengine",
]);

const popularModelSlugs = new Set([
  "gpt-4o-mini",
  "claude-sonnet-4-5",
  "claude-haiku-4-5",
  "gemini-2-5-pro",
  "gemini-2-5-flash",
  "deepseek-chat",
  "deepseek-reasoner",
  "kimi-k2",
  "glm-4-5",
  "doubao-seed-1-6",
  "openrouter-auto",
]);

export function getModelRegion(model: Pick<ModelWithPrice, "providerSlug">) {
  return domesticProviderSlugs.has(model.providerSlug)
    ? "domestic"
    : "international";
}

export function isPopularModel(model: Pick<ModelWithPrice, "slug">) {
  return popularModelSlugs.has(model.slug);
}

export function getProviderGroupName(model: ModelWithPrice) {
  if (model.provider.slug === "google") {
    return "Google / Gemini";
  }

  if (model.provider.slug === "moonshot") {
    return "Moonshot / Kimi";
  }

  if (model.provider.slug === "zhipu") {
    return "Zhipu / BigModel";
  }

  if (model.provider.slug === "volcengine") {
    return "Volcengine / Doubao";
  }

  return model.provider.name;
}

export function filterModelsByAudience(
  models: ModelWithPrice[],
  filter: ModelAudienceFilter,
) {
  if (filter === "popular") {
    return models.filter(isPopularModel);
  }

  if (filter === "domestic" || filter === "international") {
    return models.filter((model) => getModelRegion(model) === filter);
  }

  return models;
}

export function groupModelsByProvider(models: ModelWithPrice[]) {
  const groups = new Map<string, ModelWithPrice[]>();

  for (const model of models) {
    const groupName = getProviderGroupName(model);
    groups.set(groupName, [...(groups.get(groupName) ?? []), model]);
  }

  return Array.from(groups.entries())
    .map(([providerName, providerModels]) => ({
      providerName,
      models: providerModels.sort(compareModelsForDisplay),
    }))
    .sort((left, right) => left.providerName.localeCompare(right.providerName));
}

export function compareModelsForDisplay(
  left: ModelWithPrice,
  right: ModelWithPrice,
) {
  const popularDelta =
    Number(isPopularModel(right)) - Number(isPopularModel(left));

  if (popularDelta !== 0) {
    return popularDelta;
  }

  return left.displayName.localeCompare(right.displayName);
}

export function formatCurrency(
  valueUsd: number,
  currency: CurrencyCode,
  exchangeRate: number,
) {
  return currency === "CNY"
    ? formatCny(valueUsd * exchangeRate)
    : formatUsd(valueUsd);
}
