import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireAdminRole: vi.fn(),
  adPlacementUpsert: vi.fn(),
  guideCreate: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mocks.requireAdmin,
  requireAdminRole: mocks.requireAdminRole,
  getAdminAuthErrorStatus: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 403
      ? 403
      : 401,
}));

vi.mock("@/lib/db/client", () => ({
  getPrisma: () => ({
    adPlacement: {
      upsert: mocks.adPlacementUpsert,
    },
    guide: {
      create: mocks.guideCreate,
    },
  }),
  hasDatabaseUrl: true,
}));

describe("admin route RBAC", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset();
    mocks.requireAdminRole.mockReset();
    mocks.adPlacementUpsert.mockReset();
    mocks.guideCreate.mockReset();
  });

  it("blocks editors from owner/admin-only ad placement writes", async () => {
    mocks.requireAdminRole.mockRejectedValue(
      Object.assign(new Error("Forbidden"), { status: 403 }),
    );
    const { POST } = await import("@/app/api/admin/ad-placements/route");

    const response = await POST(
      jsonRequest({
        slotKey: "home-top",
        name: "Home top",
        pageType: "home",
        position: "top",
        provider: "adsense",
        adCode: null,
        isEnabled: true,
      }),
    );

    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(response.status).toBe(403);
    expect(mocks.requireAdminRole).toHaveBeenCalledWith(["owner", "admin"]);
    expect(mocks.adPlacementUpsert).not.toHaveBeenCalled();
  });

  it("allows editors to create guide content", async () => {
    mocks.requireAdminRole.mockResolvedValue({
      email: "editor@example.com",
      role: "editor",
    });
    mocks.guideCreate.mockResolvedValue({ id: "guide_1", slug: "cost-guide" });
    const { POST } = await import("@/app/api/admin/guides/route");

    const response = await POST(
      jsonRequest({
        slug: "cost-guide",
        title: "Cost guide",
        description: "A practical guide",
        contentMd: "# Cost guide",
        category: "pricing",
        status: "draft",
        seoTitle: "Cost guide",
        seoDescription: "A practical guide for pricing.",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      guide: { id: "guide_1", slug: "cost-guide" },
    });
    expect(response.status).toBe(201);
    expect(mocks.requireAdminRole).toHaveBeenCalledWith([
      "owner",
      "admin",
      "editor",
    ]);
    expect(mocks.guideCreate).toHaveBeenCalledOnce();
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("https://modelrate.test/api", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
