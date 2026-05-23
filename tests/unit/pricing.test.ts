import { describe, expect, it } from "vitest";
import {
  calculateMultiplierCostComparison,
  calculateModelRate,
  calculateTokenCost,
  convertPriceUnit,
} from "@/lib/calculators/pricing";

describe("calculateTokenCost", () => {
  it("calculates input, output, total USD and CNY cost", () => {
    const result = calculateTokenCost({
      inputTokens: 100_000,
      outputTokens: 10_000,
      requestCount: 2,
      inputPricePer1M: 3,
      outputPricePer1M: 15,
      exchangeRate: 7.2,
    });

    expect(result.inputCostUsd).toBe(0.3);
    expect(result.outputCostUsd).toBe(0.15);
    expect(result.singleRequestUsd).toBe(0.45);
    expect(result.totalUsd).toBe(0.9);
    expect(result.totalCny).toBe(6.48);
  });

  it("rejects negative token counts", () => {
    expect(() =>
      calculateTokenCost({
        inputTokens: -1,
        outputTokens: 0,
        requestCount: 1,
        inputPricePer1M: 1,
        outputPricePer1M: 1,
        exchangeRate: 7.2,
      }),
    ).toThrow();
  });
});

describe("calculateMultiplierCostComparison", () => {
  it("compares base token cost with multiplied cost", () => {
    const result = calculateMultiplierCostComparison({
      inputTokens: 100_000,
      outputTokens: 10_000,
      inputPricePer1M: 3,
      outputPricePer1M: 15,
      exchangeRate: 7.2,
      multiplier: 2,
    });

    expect(result.base.totalUsd).toBe(0.45);
    expect(result.multiplied.totalUsd).toBe(0.9);
    expect(result.deltaUsd).toBe(0.45);
    expect(result.deltaCny).toBe(3.24);
    expect(result.deltaPercent).toBe(100);
  });

  it("rejects non-positive multipliers", () => {
    expect(() =>
      calculateMultiplierCostComparison({
        inputTokens: 100_000,
        outputTokens: 10_000,
        inputPricePer1M: 3,
        outputPricePer1M: 15,
        exchangeRate: 7.2,
        multiplier: 0,
      }),
    ).toThrow();
  });
});

describe("calculateModelRate", () => {
  it("calculates One-API model and completion multipliers", () => {
    const result = calculateModelRate({
      inputPricePer1M: 2,
      outputPricePer1M: 10,
      basePricePer1M: 2,
      groupMultiplier: 1.2,
      routeMultiplier: 0.8,
    });

    expect(result.modelMultiplier).toBe(1);
    expect(result.completionMultiplier).toBe(5);
    expect(result.effectiveInputPricePer1M).toBe(1.92);
    expect(result.effectiveOutputPricePer1M).toBe(9.6);
  });

  it("rejects nonzero output price with zero input price", () => {
    expect(() =>
      calculateModelRate({
        inputPricePer1M: 0,
        outputPricePer1M: 1,
      }),
    ).toThrow("Input price must be greater than zero");
  });
});

describe("convertPriceUnit", () => {
  it("converts 1M token price to 1K token price", () => {
    expect(convertPriceUnit(2, "1K")).toBe(0.002);
    expect(convertPriceUnit(2, "1M")).toBe(2);
  });
});
