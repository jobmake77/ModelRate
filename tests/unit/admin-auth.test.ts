import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentAdmin, requireAdmin } from "@/lib/auth/admin";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  getUser: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getPrisma: () => ({
    adminUser: {
      findUnique: mocks.findUnique,
    },
  }),
  hasDatabaseUrl: true,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: mocks.cookieSet,
  })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

describe("admin auth helper", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    mocks.findUnique.mockReset();
    mocks.getUser.mockReset();
    mocks.cookieSet.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the active admin role from the database-backed allowlist", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { email: "editor@example.com" } },
    });
    mocks.findUnique.mockResolvedValue({
      email: "editor@example.com",
      role: "editor",
      status: "active",
    });

    await expect(getCurrentAdmin()).resolves.toMatchObject({
      email: "editor@example.com",
      role: "editor",
    });
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { email: "editor@example.com" },
    });
  });

  it("rejects missing Supabase users before checking admin records", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(getCurrentAdmin()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects inactive or missing admin records", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { email: "viewer@example.com" } },
    });
    mocks.findUnique.mockResolvedValue({
      email: "viewer@example.com",
      role: "viewer",
      status: "disabled",
    });

    await expect(getCurrentAdmin()).resolves.toBeNull();
  });

  it("throws Unauthorized when requireAdmin has no active admin session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });
});
