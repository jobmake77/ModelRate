type PriceSource = {
  sourceName: string;
  sourceType: string;
};

export function formatPriceSourceName(source: PriceSource) {
  if (source.sourceType === "manual") {
    return "人工预估（待核验）";
  }

  return source.sourceName;
}

export function getPriceSourceNotice(source: PriceSource) {
  if (source.sourceType !== "manual") {
    return "";
  }

  return "这条价格是 MVP 规划用人工预估，尚未按官方账单逐条复核。";
}
