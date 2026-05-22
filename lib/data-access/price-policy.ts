type PriceSourceType =
  | "official"
  | "manual"
  | "openrouter"
  | "litellm"
  | "portkey"
  | "relay";

export const priceSourcePriority: Record<PriceSourceType, number> = {
  official: 0,
  manual: 1,
  openrouter: 2,
  litellm: 3,
  portkey: 4,
  relay: 5,
};

export function comparePriceSourcePriority(
  left: PriceSourceType,
  right: PriceSourceType,
) {
  return priceSourcePriority[left] - priceSourcePriority[right];
}

export function selectPrimaryCurrentPrice<
  T extends { lastCheckedAt: Date; sourceType: PriceSourceType },
>(prices: T[]) {
  return [...prices].sort((left, right) => {
    const priority =
      comparePriceSourcePriority(left.sourceType, right.sourceType) ||
      right.lastCheckedAt.getTime() - left.lastCheckedAt.getTime();

    return priority;
  })[0];
}
