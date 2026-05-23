export type ProviderFixture = {
  slug: string;
  name: string;
  websiteUrl: string;
  description: string;
};

export type ModelFixture = {
  slug: string;
  providerSlug: string;
  canonicalModelId: string;
  displayName: string;
  family: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision?: boolean;
  supportsReasoning?: boolean;
  supportsFunctionCalling?: boolean;
  sourceUrl: string;
  lastCheckedAt: string;
};

export type ModelPriceFixture = {
  modelSlug: string;
  sourceType:
    | "official"
    | "openrouter"
    | "litellm"
    | "portkey"
    | "manual"
    | "relay";
  sourceName: string;
  sourceUrl: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  cachedInputPricePer1M?: number;
  lastCheckedAt: string;
};

export type ExchangeRateFixture = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
};

export const providers: ProviderFixture[] = [
  {
    slug: "openai",
    name: "OpenAI",
    websiteUrl: "https://openai.com/api/pricing/",
    description: "GPT and multimodal model provider.",
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    websiteUrl: "https://docs.anthropic.com/",
    description: "Claude model provider.",
  },
  {
    slug: "google",
    name: "Google",
    websiteUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    description: "Gemini model provider.",
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    websiteUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    description: "DeepSeek reasoning and chat models.",
  },
  {
    slug: "moonshot",
    name: "Moonshot AI",
    websiteUrl: "https://platform.moonshot.cn/docs/pricing/chat",
    description: "Kimi model provider for Chinese and long-context workloads.",
  },
  {
    slug: "zhipu",
    name: "Zhipu AI",
    websiteUrl: "https://bigmodel.cn/pricing",
    description: "BigModel and GLM model provider.",
  },
  {
    slug: "volcengine",
    name: "Volcengine",
    websiteUrl: "https://www.volcengine.com/product/ark",
    description: "Doubao and Ark model service provider.",
  },
  {
    slug: "xai",
    name: "xAI",
    websiteUrl: "https://docs.x.ai/docs/models",
    description: "Grok model provider.",
  },
  {
    slug: "openrouter",
    name: "OpenRouter",
    websiteUrl: "https://openrouter.ai/pricing",
    description: "Model routing and marketplace provider.",
  },
];

export const models: ModelFixture[] = [
  {
    slug: "gpt-5-4",
    providerSlug: "openai",
    canonicalModelId: "gpt-5.4",
    displayName: "GPT-5.4",
    family: "GPT",
    description:
      "General-purpose frontier model for reasoning and coding workflows.",
    contextWindow: 256000,
    maxOutputTokens: 32768,
    supportsVision: true,
    supportsReasoning: true,
    supportsFunctionCalling: true,
    sourceUrl: "https://openai.com/api/pricing/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "gpt-5-4-mini",
    providerSlug: "openai",
    canonicalModelId: "gpt-5.4-mini",
    displayName: "GPT-5.4 Mini",
    family: "GPT",
    description:
      "Lower-cost GPT family model for high-volume application traffic.",
    contextWindow: 256000,
    maxOutputTokens: 32768,
    supportsVision: true,
    supportsReasoning: true,
    supportsFunctionCalling: true,
    sourceUrl: "https://openai.com/api/pricing/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "gpt-4o-mini",
    providerSlug: "openai",
    canonicalModelId: "gpt-4o-mini",
    displayName: "GPT-4o mini",
    family: "GPT-4o",
    description: "Small multimodal model used as a low-cost baseline.",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsFunctionCalling: true,
    sourceUrl: "https://openai.com/api/pricing/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "claude-sonnet-4-5",
    providerSlug: "anthropic",
    canonicalModelId: "claude-sonnet-4-5",
    displayName: "Claude Sonnet 4.5",
    family: "Claude",
    description:
      "Balanced Claude model for coding, agentic tasks and long-form work.",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    supportsVision: true,
    supportsReasoning: true,
    sourceUrl: "https://docs.anthropic.com/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "claude-haiku-4-5",
    providerSlug: "anthropic",
    canonicalModelId: "claude-haiku-4-5",
    displayName: "Claude Haiku 4.5",
    family: "Claude",
    description:
      "Fast low-cost Claude model for short tasks and routing fallbacks.",
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsVision: true,
    sourceUrl: "https://docs.anthropic.com/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "gemini-2-5-pro",
    providerSlug: "google",
    canonicalModelId: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    family: "Gemini",
    description:
      "Google frontier model for reasoning, long context and multimodal tasks.",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    supportsVision: true,
    supportsReasoning: true,
    supportsFunctionCalling: true,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "gemini-2-5-flash",
    providerSlug: "google",
    canonicalModelId: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    family: "Gemini",
    description: "Cost-effective Gemini model for broad production workloads.",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    supportsVision: true,
    supportsFunctionCalling: true,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "deepseek-chat",
    providerSlug: "deepseek",
    canonicalModelId: "deepseek-chat",
    displayName: "DeepSeek Chat",
    family: "DeepSeek",
    description: "General chat model with a strong price-performance profile.",
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsFunctionCalling: true,
    sourceUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "deepseek-reasoner",
    providerSlug: "deepseek",
    canonicalModelId: "deepseek-reasoner",
    displayName: "DeepSeek Reasoner",
    family: "DeepSeek",
    description: "Reasoning-oriented model for complex problem solving.",
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsReasoning: true,
    sourceUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "kimi-k2",
    providerSlug: "moonshot",
    canonicalModelId: "kimi-k2",
    displayName: "Kimi K2",
    family: "Kimi",
    description:
      "Moonshot model candidate for Chinese, coding and long-context tasks.",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsFunctionCalling: true,
    sourceUrl: "https://platform.moonshot.cn/docs/pricing/chat",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "kimi-latest",
    providerSlug: "moonshot",
    canonicalModelId: "kimi-latest",
    displayName: "Kimi Latest",
    family: "Kimi",
    description:
      "Representative Moonshot chat model for domestic API cost comparison.",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsFunctionCalling: true,
    sourceUrl: "https://platform.moonshot.cn/docs/pricing/chat",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "glm-4-5",
    providerSlug: "zhipu",
    canonicalModelId: "glm-4.5",
    displayName: "GLM-4.5",
    family: "GLM",
    description: "Zhipu GLM model candidate for reasoning and Chinese tasks.",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsReasoning: true,
    supportsFunctionCalling: true,
    sourceUrl: "https://bigmodel.cn/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "glm-4-flash",
    providerSlug: "zhipu",
    canonicalModelId: "glm-4-flash",
    displayName: "GLM-4-Flash",
    family: "GLM",
    description:
      "Lower-cost GLM family model for high-volume domestic workloads.",
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsFunctionCalling: true,
    sourceUrl: "https://bigmodel.cn/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "doubao-seed-1-6",
    providerSlug: "volcengine",
    canonicalModelId: "doubao-seed-1.6",
    displayName: "Doubao Seed 1.6",
    family: "Doubao",
    description:
      "Volcengine Ark model candidate for domestic application traffic.",
    contextWindow: 256000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsFunctionCalling: true,
    sourceUrl: "https://www.volcengine.com/product/ark",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "grok-4",
    providerSlug: "xai",
    canonicalModelId: "grok-4",
    displayName: "Grok 4",
    family: "Grok",
    description:
      "xAI flagship model for reasoning and general assistant workflows.",
    contextWindow: 256000,
    maxOutputTokens: 32768,
    supportsReasoning: true,
    sourceUrl: "https://docs.x.ai/docs/models",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "openrouter-auto",
    providerSlug: "openrouter",
    canonicalModelId: "openrouter/auto",
    displayName: "OpenRouter Auto",
    family: "OpenRouter",
    description: "OpenRouter routing option for automatic model selection.",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsFunctionCalling: true,
    sourceUrl: "https://openrouter.ai/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "openrouter-free",
    providerSlug: "openrouter",
    canonicalModelId: "openrouter/free",
    displayName: "OpenRouter Free Models",
    family: "OpenRouter",
    description:
      "Representative entry for free or promotional OpenRouter models.",
    contextWindow: 32000,
    maxOutputTokens: 8192,
    sourceUrl: "https://openrouter.ai/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
];

export const modelPrices: ModelPriceFixture[] = [
  {
    modelSlug: "gpt-5-4",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://openai.com/api/pricing/",
    inputPricePer1M: 5,
    outputPricePer1M: 20,
    cachedInputPricePer1M: 0.5,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "gpt-5-4-mini",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://openai.com/api/pricing/",
    inputPricePer1M: 0.6,
    outputPricePer1M: 2.4,
    cachedInputPricePer1M: 0.06,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "gpt-4o-mini",
    sourceType: "official",
    sourceName: "OpenAI API pricing",
    sourceUrl: "https://openai.com/api/pricing/",
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.6,
    cachedInputPricePer1M: 0.075,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "claude-sonnet-4-5",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://docs.anthropic.com/",
    inputPricePer1M: 3,
    outputPricePer1M: 15,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "claude-haiku-4-5",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://docs.anthropic.com/",
    inputPricePer1M: 0.8,
    outputPricePer1M: 4,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "gemini-2-5-pro",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    inputPricePer1M: 1.25,
    outputPricePer1M: 10,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "gemini-2-5-flash",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    inputPricePer1M: 0.3,
    outputPricePer1M: 2.5,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "deepseek-chat",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    inputPricePer1M: 0.27,
    outputPricePer1M: 1.1,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "deepseek-reasoner",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    inputPricePer1M: 0.55,
    outputPricePer1M: 2.19,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "kimi-k2",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://platform.moonshot.cn/docs/pricing/chat",
    inputPricePer1M: 0.6,
    outputPricePer1M: 2.5,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "kimi-latest",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://platform.moonshot.cn/docs/pricing/chat",
    inputPricePer1M: 0.3,
    outputPricePer1M: 1.2,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "glm-4-5",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://bigmodel.cn/pricing",
    inputPricePer1M: 0.8,
    outputPricePer1M: 2.4,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "glm-4-flash",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://bigmodel.cn/pricing",
    inputPricePer1M: 0.11,
    outputPricePer1M: 0.11,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "doubao-seed-1-6",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://www.volcengine.com/product/ark",
    inputPricePer1M: 0.3,
    outputPricePer1M: 1.2,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "grok-4",
    sourceType: "manual",
    sourceName: "Manual planning estimate",
    sourceUrl: "https://docs.x.ai/docs/models",
    inputPricePer1M: 3,
    outputPricePer1M: 15,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "openrouter-auto",
    sourceType: "openrouter",
    sourceName: "OpenRouter pricing",
    sourceUrl: "https://openrouter.ai/pricing",
    inputPricePer1M: 1,
    outputPricePer1M: 3,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    modelSlug: "openrouter-free",
    sourceType: "openrouter",
    sourceName: "OpenRouter pricing",
    sourceUrl: "https://openrouter.ai/pricing",
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
];

export const exchangeRates: ExchangeRateFixture[] = [
  {
    baseCurrency: "USD",
    quoteCurrency: "CNY",
    rate: 7.2,
    sourceName: "Manual seed rate",
    sourceUrl:
      "https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=CNY",
    fetchedAt: "2026-05-21T00:00:00.000Z",
  },
];
