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
  "gpt-4o",
  "gpt-4o-mini",
  "o3",
  "o4-mini",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-opus-4-7",
  "gemini-2-5-pro",
  "gemini-2-5-flash",
  "deepseek-v4-flash",
  "deepseek-v4-pro",
  "kimi-k2",
  "glm-5-turbo",
  "glm-4-5",
  "doubao-seed-1-6",
  "grok-4-3",
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

export function getProviderColor(providerNameOrSlug: string) {
  const key = providerNameOrSlug.toLowerCase();

  if (key.includes("openai")) {
    return "oklch(0.62 0.16 165)";
  }

  if (key.includes("anthropic") || key.includes("claude")) {
    return "oklch(0.68 0.14 55)";
  }

  if (key.includes("google") || key.includes("gemini")) {
    return "oklch(0.62 0.18 240)";
  }

  if (key.includes("deepseek")) {
    return "oklch(0.55 0.18 280)";
  }

  if (key.includes("moonshot") || key.includes("kimi")) {
    return "oklch(0.66 0.15 300)";
  }

  if (key.includes("zhipu") || key.includes("glm")) {
    return "oklch(0.58 0.18 220)";
  }

  if (key.includes("volcengine") || key.includes("doubao")) {
    return "oklch(0.65 0.16 30)";
  }

  if (key.includes("xai") || key.includes("grok")) {
    return "oklch(0.4 0.02 200)";
  }

  if (key.includes("openrouter")) {
    return "oklch(0.55 0.16 250)";
  }

  return "oklch(0.5 0.01 250)";
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
