import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/outbound-clicks/route";

const mocks = vi.hoisted(() => ({
  getRelayStationBySlug: vi.fn(),
  outboundClickCreate: vi.fn(),
}));

vi.mock("@/lib/data-access/relays", () => ({
  getRelayStationBySlug: mocks.getRelayStationBySlug,
}));

vi.mock("@/lib/db/client", () => ({
  getPrisma: () => ({
    outboundClick: {
      create: mocks.outboundClickCreate,
    },
  }),
  hasDatabaseUrl: false,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

describe("outbound click allowlist", () => {
  beforeEach(() => {
    mocks.getRelayStationBySlug.mockReset();
    mocks.outboundClickCreate.mockReset();
  });

  it("accepts a relay click only when the URL exactly matches its published target", async () => {
    mocks.getRelayStationBySlug.mockResolvedValue({
      id: "relay_1",
      slug: "openrouter",
      websiteUrl: "https://openrouter.ai/",
      referralUrl: "https://openrouter.ai/ref/modelrate",
    });

    const response = await POST(
      jsonRequest({
        targetType: "relay",
        targetSlug: "openrouter",
        url: "https://openrouter.ai/ref/modelrate",
        sourcePath: "/relays/openrouter",
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({
      recorded: false,
      validated: true,
    });
    expect(mocks.outboundClickCreate).not.toHaveBeenCalled();
  });

  it("rejects relay clicks to lookalike or nested phishing URLs", async () => {
    mocks.getRelayStationBySlug.mockResolvedValue({
      id: "relay_1",
      slug: "openrouter",
      websiteUrl: "https://openrouter.ai/",
      referralUrl: "https://openrouter.ai/ref/modelrate",
    });

    const response = await POST(
      jsonRequest({
        targetType: "relay",
        targetSlug: "openrouter",
        url: "https://openrouter.ai.evil.example/",
        sourcePath: "/relays/openrouter",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "URL does not match the relay target.",
    });
    expect(response.status).toBe(400);
    expect(mocks.outboundClickCreate).not.toHaveBeenCalled();
  });

  it("requires a relay slug for relay click attribution", async () => {
    const response = await POST(
      jsonRequest({
        targetType: "relay",
        url: "https://openrouter.ai/",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "targetSlug is required for relay clicks.",
    });
    expect(response.status).toBe(400);
    expect(mocks.getRelayStationBySlug).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("https://modelrate.test/api/outbound-clicks", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
