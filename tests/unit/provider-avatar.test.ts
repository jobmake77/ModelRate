import { describe, expect, it } from "vitest";
import { getProviderLogo } from "@/components/public/provider-avatar";

describe("provider logo mapping", () => {
  it.each([
    ["OpenAI", "/logos/providers/openai.png"],
    ["OpenAI Codex", "/logos/providers/openai.png"],
    ["Anthropic", "/logos/providers/anthropic.png"],
    ["Google / Gemini", "/logos/providers/google-gemini.svg"],
    ["DeepSeek", "/logos/providers/deepseek.svg"],
    ["Moonshot / Kimi", "/logos/providers/moonshot-kimi.png"],
    ["Zhipu / BigModel", "/logos/providers/zhipu.png"],
    ["Volcengine / Doubao", "/logos/providers/bytedance.svg"],
    ["xAI", "/logos/providers/xai.png"],
    ["OpenRouter", "/logos/providers/openrouter.svg"],
  ])("maps %s to a local logo", (label, path) => {
    expect(getProviderLogo(label)?.path).toBe(path);
  });

  it("uses a neutral fallback for unknown providers", () => {
    expect(getProviderLogo("Unknown Provider")).toBeNull();
  });
});
