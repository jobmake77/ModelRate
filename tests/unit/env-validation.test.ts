import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertProductionEnv,
  canUseFixtureFallback,
  getSiteUrl,
  shouldEnforceProductionEnv,
} from "@/lib/env";

describe("env validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects strict production config without required public Supabase settings", () => {
    stubValidProductionEnv();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(shouldEnforceProductionEnv()).toBe(true);
    expect(() => assertProductionEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("accepts complete strict production config and disables fixture fallback", () => {
    stubValidProductionEnv();

    expect(() => assertProductionEnv()).not.toThrow();
    expect(shouldEnforceProductionEnv()).toBe(true);
    expect(canUseFixtureFallback()).toBe(false);
    expect(getSiteUrl()).toBe("https://modelrate.dev");
  });

  it("allows fixture fallback outside strict production env", () => {
    vi.stubEnv("MODELRATE_STRICT_ENV", "false");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(shouldEnforceProductionEnv()).toBe(false);
    expect(canUseFixtureFallback()).toBe(true);
    expect(getSiteUrl()).toBe("");
  });
});

function stubValidProductionEnv() {
  vi.stubEnv("MODELRATE_STRICT_ENV", "true");
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com,admin@example.com");
  vi.stubEnv("CLICK_HASH_SALT", "production-click-salt");
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@example.com:5432/modelrate");
  vi.stubEnv("DIRECT_URL", "postgres://user:pass@example.com:5432/modelrate");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://modelrate.dev");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
}
