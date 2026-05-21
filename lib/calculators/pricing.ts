import { z } from "zod";

export const nonNegativeNumber = z.number().finite().min(0);
export const positiveNumber = z.number().finite().positive();

export const tokenCostInputSchema = z.object({
  inputTokens: nonNegativeNumber,
  outputTokens: nonNegativeNumber,
  requestCount: positiveNumber.default(1),
  inputPricePer1M: nonNegativeNumber,
  outputPricePer1M: nonNegativeNumber,
  cachedInputTokens: nonNegativeNumber.default(0),
  cachedInputPricePer1M: nonNegativeNumber.optional(),
  reasoningTokens: nonNegativeNumber.default(0),
  reasoningPricePer1M: nonNegativeNumber.optional(),
  exchangeRate: positiveNumber.default(7.2),
});

export const modelRateInputSchema = z.object({
  inputPricePer1M: nonNegativeNumber,
  outputPricePer1M: nonNegativeNumber,
  basePricePer1M: positiveNumber.default(2),
  groupMultiplier: positiveNumber.default(1),
  routeMultiplier: positiveNumber.default(1),
});

export type TokenCostInput = z.input<typeof tokenCostInputSchema>;
export type TokenCostResult = {
  singleRequestUsd: number;
  totalUsd: number;
  totalCny: number;
  inputCostUsd: number;
  outputCostUsd: number;
  cachedInputCostUsd: number;
  reasoningCostUsd: number;
};

export type ModelRateInput = z.input<typeof modelRateInputSchema>;
export type ModelRateResult = {
  modelMultiplier: number;
  completionMultiplier: number;
  effectiveInputPricePer1M: number;
  effectiveOutputPricePer1M: number;
};

const TOKEN_UNIT = 1_000_000;
const PRECISION = 10;

export function roundMoney(value: number, precision = PRECISION) {
  return Number(value.toFixed(precision));
}

export function calculateTokenCost(input: TokenCostInput): TokenCostResult {
  const parsed = tokenCostInputSchema.parse(input);
  const cachedInputPrice =
    parsed.cachedInputPricePer1M ?? parsed.inputPricePer1M;
  const reasoningPrice = parsed.reasoningPricePer1M ?? parsed.outputPricePer1M;

  const inputCostUsd =
    (parsed.inputTokens / TOKEN_UNIT) * parsed.inputPricePer1M;
  const outputCostUsd =
    (parsed.outputTokens / TOKEN_UNIT) * parsed.outputPricePer1M;
  const cachedInputCostUsd =
    (parsed.cachedInputTokens / TOKEN_UNIT) * cachedInputPrice;
  const reasoningCostUsd =
    (parsed.reasoningTokens / TOKEN_UNIT) * reasoningPrice;
  const singleRequestUsd =
    inputCostUsd + outputCostUsd + cachedInputCostUsd + reasoningCostUsd;
  const totalUsd = singleRequestUsd * parsed.requestCount;

  return {
    singleRequestUsd: roundMoney(singleRequestUsd),
    totalUsd: roundMoney(totalUsd),
    totalCny: roundMoney(totalUsd * parsed.exchangeRate),
    inputCostUsd: roundMoney(inputCostUsd),
    outputCostUsd: roundMoney(outputCostUsd),
    cachedInputCostUsd: roundMoney(cachedInputCostUsd),
    reasoningCostUsd: roundMoney(reasoningCostUsd),
  };
}

export function calculateModelRate(input: ModelRateInput): ModelRateResult {
  const parsed = modelRateInputSchema.parse(input);

  if (parsed.inputPricePer1M === 0 && parsed.outputPricePer1M > 0) {
    throw new Error(
      "Input price must be greater than zero to calculate completion multiplier.",
    );
  }

  const modelMultiplier = parsed.inputPricePer1M / parsed.basePricePer1M;
  const completionMultiplier =
    parsed.inputPricePer1M === 0
      ? 0
      : parsed.outputPricePer1M / parsed.inputPricePer1M;
  const effectiveInputPricePer1M =
    parsed.basePricePer1M *
    modelMultiplier *
    parsed.groupMultiplier *
    parsed.routeMultiplier;
  const effectiveOutputPricePer1M =
    effectiveInputPricePer1M * completionMultiplier;

  return {
    modelMultiplier: roundMoney(modelMultiplier),
    completionMultiplier: roundMoney(completionMultiplier),
    effectiveInputPricePer1M: roundMoney(effectiveInputPricePer1M),
    effectiveOutputPricePer1M: roundMoney(effectiveOutputPricePer1M),
  };
}

export function convertPriceUnit(pricePer1M: number, unit: "1K" | "1M") {
  nonNegativeNumber.parse(pricePer1M);
  return unit === "1K" ? roundMoney(pricePer1M / 1000) : pricePer1M;
}
