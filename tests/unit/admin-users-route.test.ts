import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminUserCount: vi.fn(),
  adminUserCreate: vi.fn(),
  adminUserFindUniqueOrThrow: vi.fn(),
  adminUserUpdate: vi.fn(),
  requireAdminRole: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  getAdminAuthErrorStatus: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 500,
  requireAdminRole: mocks.requireAdminRole,
}));

vi.mock("@/lib/db/client", () => ({
  getPrisma: () => ({
    adminUser: {
      count: mocks.adminUserCount,
      create: mocks.adminUserCreate,
      findUniqueOrThrow: mocks.adminUserFindUniqueOrThrow,
      update: mocks.adminUserUpdate,
    },
  }),
  hasDatabaseUrl: true,
}));

describe("admin users route", () => {
  beforeEach(() => {
    mocks.adminUserCount.mockReset();
    mocks.adminUserCreate.mockReset();
    mocks.adminUserFindUniqueOrThrow.mockReset();
    mocks.adminUserUpdate.mockReset();
    mocks.requireAdminRole.mockReset();
    mocks.requireAdminRole.mockResolvedValue({
      email: "owner@example.com",
      role: "owner",
    });
  });

  it("creates admin users through the owner-only route", async () => {
    mocks.adminUserCreate.mockResolvedValue({
      email: "editor@example.com",
      id: "admin_2",
      role: "editor",
      status: "active",
    });
    const { POST } = await import("@/app/api/admin/users/route");

    const response = await POST(
      jsonRequest({
        email: "Editor@Example.com",
        role: "editor",
        status: "active",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.requireAdminRole).toHaveBeenCalledWith(["owner"]);
    expect(mocks.adminUserCreate).toHaveBeenCalledWith({
      data: {
        email: "editor@example.com",
        role: "editor",
        status: "active",
      },
    });
  });

  it("prevents disabling the final active owner", async () => {
    mocks.adminUserFindUniqueOrThrow.mockResolvedValue({
      id: "owner_1",
      role: "owner",
      status: "active",
    });
    mocks.adminUserCount.mockResolvedValue(0);
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");

    const response = await PATCH(jsonRequest({ status: "disabled" }), {
      params: Promise.resolve({ id: "owner_1" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "At least one active owner is required.",
    });
    expect(mocks.adminUserUpdate).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("https://modelrate.test/api/admin/users", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}
