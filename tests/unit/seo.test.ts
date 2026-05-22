import { afterEach, describe, expect, it, vi } from "vitest";
import { serializeJsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, getNormalizedSiteUrl } from "@/lib/seo/metadata";

describe("seo helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes the configured public site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://modelrate.dev/");

    expect(getNormalizedSiteUrl()).toBe("https://modelrate.dev");
    expect(absoluteUrl("/models")).toBe("https://modelrate.dev/models");
  });

  it("escapes script-breaking characters in JSON-LD", () => {
    const output = serializeJsonLd({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "<script>alert(1)</script>",
    });

    expect(output).not.toContain("<script>");
    expect(output).toContain("\\u003cscript>");
  });
});
