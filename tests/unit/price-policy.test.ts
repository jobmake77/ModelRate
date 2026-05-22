import { describe, expect, it } from "vitest";
import { selectPrimaryCurrentPrice } from "@/lib/data-access/price-policy";

describe("price source policy", () => {
  it("prefers official current prices over newer lower-priority sources", () => {
    const official = {
      lastCheckedAt: new Date("2026-05-20T00:00:00.000Z"),
      sourceType: "official" as const,
      value: "official",
    };
    const openrouter = {
      lastCheckedAt: new Date("2026-05-22T00:00:00.000Z"),
      sourceType: "openrouter" as const,
      value: "openrouter",
    };

    expect(selectPrimaryCurrentPrice([openrouter, official])).toBe(official);
  });

  it("uses recency as a tie-breaker inside the same source type", () => {
    const older = {
      lastCheckedAt: new Date("2026-05-20T00:00:00.000Z"),
      sourceType: "manual" as const,
      value: "older",
    };
    const newer = {
      lastCheckedAt: new Date("2026-05-22T00:00:00.000Z"),
      sourceType: "manual" as const,
      value: "newer",
    };

    expect(selectPrimaryCurrentPrice([older, newer])).toBe(newer);
  });
});
