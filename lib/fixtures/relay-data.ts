export type RelayStationFixture = {
  slug: string;
  name: string;
  domain: string;
  websiteUrl: string;
  description: string;
  billingModes: string[];
  paymentMethods: string[];
  minimumTopUpAmount: number | null;
  minimumTopUpCurrency: string | null;
  supportChannels: string[];
  supportedProviders: string[];
  hasPublicPricing: boolean;
  hasTrialCredit: boolean;
  hasReferralProgram: boolean;
  referralUrl: string | null;
  couponCode: string | null;
  isSponsored: boolean;
  isVerified: boolean;
  status: "draft" | "published" | "hidden" | "archived";
  riskLevel: "unknown" | "low" | "medium" | "high";
  riskTags: string[];
  sourceUrl: string;
  lastCheckedAt: string;
};

export type RelayModelPriceFixture = {
  relaySlug: string;
  modelSlug: string;
  routeName: string | null;
  billingType: string;
  modelMultiplier: number | null;
  completionMultiplier: number | null;
  groupMultiplier: number;
  routeMultiplier: number;
  inputPricePer1M: number | null;
  outputPricePer1M: number | null;
  currency: string;
  sourceUrl: string | null;
  lastCheckedAt: string | null;
  isCurrent: boolean;
  notes: string | null;
};

export const riskTags = [
  {
    slug: "new-station",
    label: "New station",
    description: "运营时间或社区反馈仍需观察。",
    severity: "warning",
  },
  {
    slug: "no-public-pricing",
    label: "No public pricing",
    description: "公开价格信息不足，使用前需要自行确认。",
    severity: "warning",
  },
  {
    slug: "manual-review",
    label: "Manual review",
    description: "来自人工整理或调研报告，尚未接入自动监控。",
    severity: "info",
  },
  {
    slug: "referral-available",
    label: "Referral available",
    description: "站点可能存在推荐计划，需要明确标注推荐关系。",
    severity: "info",
  },
  {
    slug: "international-payment",
    label: "International payment",
    description: "可能更适合支持 VISA 或 USDT 的用户。",
    severity: "info",
  },
];

export const relayStations: RelayStationFixture[] = [
  {
    slug: "openrouter",
    name: "OpenRouter",
    domain: "openrouter.ai",
    websiteUrl: "https://openrouter.ai/",
    description:
      "International model routing marketplace with public model pricing pages.",
    billingModes: ["pay_as_you_go"],
    paymentMethods: ["VISA", "USDT"],
    minimumTopUpAmount: 5,
    minimumTopUpCurrency: "USD",
    supportChannels: ["Docs", "Discord"],
    supportedProviders: ["OpenAI", "Anthropic", "Google", "xAI", "Meta"],
    hasPublicPricing: true,
    hasTrialCredit: false,
    hasReferralProgram: false,
    referralUrl: null,
    couponCode: null,
    isSponsored: false,
    isVerified: false,
    status: "published",
    riskLevel: "unknown",
    riskTags: ["manual-review", "international-payment"],
    sourceUrl: "https://openrouter.ai/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "302-ai",
    name: "302.AI",
    domain: "302.ai",
    websiteUrl: "https://302.ai/",
    description:
      "AI API aggregation platform referenced in relay station directories.",
    billingModes: ["pay_as_you_go"],
    paymentMethods: ["Alipay", "USDT"],
    minimumTopUpAmount: 1,
    minimumTopUpCurrency: "USD",
    supportChannels: ["Website"],
    supportedProviders: ["OpenAI", "Anthropic", "Google"],
    hasPublicPricing: true,
    hasTrialCredit: false,
    hasReferralProgram: true,
    referralUrl: null,
    couponCode: null,
    isSponsored: false,
    isVerified: false,
    status: "published",
    riskLevel: "unknown",
    riskTags: ["manual-review", "referral-available"],
    sourceUrl: "https://howtok.net/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "aihubmix",
    name: "推理时代",
    domain: "aihubmix.com",
    websiteUrl: "https://aihubmix.com/",
    description:
      "Chinese relay station candidate with low top-up threshold in public directories.",
    billingModes: ["pay_as_you_go"],
    paymentMethods: ["Alipay", "VISA"],
    minimumTopUpAmount: 1,
    minimumTopUpCurrency: "CNY",
    supportChannels: ["Website"],
    supportedProviders: ["OpenAI", "Anthropic", "Google"],
    hasPublicPricing: true,
    hasTrialCredit: false,
    hasReferralProgram: false,
    referralUrl: null,
    couponCode: null,
    isSponsored: false,
    isVerified: false,
    status: "published",
    riskLevel: "unknown",
    riskTags: ["manual-review"],
    sourceUrl: "https://howtok.net/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "zenmux",
    name: "Zenmux",
    domain: "zenmux.ai",
    websiteUrl: "https://zenmux.ai/",
    description:
      "Relay station candidate with pay-as-you-go and subscription modes in public directories.",
    billingModes: ["pay_as_you_go", "subscription"],
    paymentMethods: ["WeChat Pay", "Alipay", "USDT"],
    minimumTopUpAmount: 5,
    minimumTopUpCurrency: "USD",
    supportChannels: ["Website"],
    supportedProviders: ["OpenAI", "Anthropic", "Google"],
    hasPublicPricing: true,
    hasTrialCredit: false,
    hasReferralProgram: false,
    referralUrl: null,
    couponCode: null,
    isSponsored: false,
    isVerified: false,
    status: "published",
    riskLevel: "unknown",
    riskTags: ["manual-review"],
    sourceUrl: "https://howtok.net/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "crazyrouter",
    name: "Crazyrouter",
    domain: "crazyrouter.com",
    websiteUrl: "https://crazyrouter.com/",
    description:
      "Relay station candidate supporting multiple payment methods in public directories.",
    billingModes: ["pay_as_you_go"],
    paymentMethods: ["WeChat Pay", "Alipay", "USDT", "VISA"],
    minimumTopUpAmount: 1,
    minimumTopUpCurrency: "USD",
    supportChannels: ["Website"],
    supportedProviders: ["OpenAI", "Anthropic", "Google", "xAI"],
    hasPublicPricing: true,
    hasTrialCredit: false,
    hasReferralProgram: false,
    referralUrl: null,
    couponCode: null,
    isSponsored: false,
    isVerified: false,
    status: "published",
    riskLevel: "unknown",
    riskTags: ["manual-review"],
    sourceUrl: "https://howtok.net/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    slug: "unknown-sample",
    name: "Unverified Sample Relay",
    domain: "example.invalid",
    websiteUrl: "https://example.invalid/",
    description: "Draft example used to verify admin and publication filters.",
    billingModes: ["pay_as_you_go"],
    paymentMethods: ["Unknown"],
    minimumTopUpAmount: null,
    minimumTopUpCurrency: null,
    supportChannels: [],
    supportedProviders: [],
    hasPublicPricing: false,
    hasTrialCredit: false,
    hasReferralProgram: false,
    referralUrl: null,
    couponCode: null,
    isSponsored: false,
    isVerified: false,
    status: "draft",
    riskLevel: "high",
    riskTags: ["no-public-pricing"],
    sourceUrl: "https://example.invalid/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
  },
];

export const relayModelPrices: RelayModelPriceFixture[] = [
  {
    relaySlug: "openrouter",
    modelSlug: "gpt-4o-mini",
    routeName: "default",
    billingType: "token",
    modelMultiplier: null,
    completionMultiplier: null,
    groupMultiplier: 1,
    routeMultiplier: 1,
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.6,
    currency: "USD",
    sourceUrl: "https://openrouter.ai/pricing",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    isCurrent: true,
    notes: "Fixture example based on public pricing page.",
  },
  {
    relaySlug: "302-ai",
    modelSlug: "gpt-4o-mini",
    routeName: "one-api-compatible",
    billingType: "multiplier",
    modelMultiplier: 0.075,
    completionMultiplier: 4,
    groupMultiplier: 1,
    routeMultiplier: 1,
    inputPricePer1M: null,
    outputPricePer1M: null,
    currency: "USD",
    sourceUrl: "https://howtok.net/",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    isCurrent: true,
    notes: "Manual planning estimate. Verify before production use.",
  },
];
