export type GuideFixture = {
  slug: string;
  title: string;
  description: string;
  category: string;
  contentMd: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  updatedAt: string;
};

export const guides: GuideFixture[] = [
  {
    slug: "how-to-calculate-ai-token-cost",
    title: "如何估算一次 AI API 调用的 Token 成本",
    description:
      "用统一的 USD per 1M tokens 口径，把输入、输出、倍率和汇率换算成可比较的调用成本。",
    category: "calculator",
    seoTitle: "AI Token 成本计算方法",
    seoDescription:
      "学习如何用输入 token、输出 token、模型价格和汇率估算 AI API 调用成本。",
    publishedAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
    contentMd: `# 如何估算一次 AI API 调用的 Token 成本

AI API 价格通常拆成输入价格和输出价格。ModelRate 第一版统一使用 USD per 1M tokens，避免不同服务商在 1K、1M、人民币、美元之间切换造成误判。

## 计算公式

input_cost = input_tokens / 1_000_000 * input_price_per_1m
output_cost = output_tokens / 1_000_000 * output_price_per_1m
base_total = input_cost + output_cost
multiplied_total = base_total * multiplier

## 示例

如果模型输入价格是 5 USD / 1M tokens，输出价格是 20 USD / 1M tokens，一次调用消耗 100,000 输入 tokens 和 10,000 输出 tokens，那么单次成本约为 0.70 USD。

## 使用建议

- 对长上下文任务，先估算输入 token，因为输入通常是主要成本。
- 对代码生成、长文生成任务，必须单独估算输出 token。
- 使用中转站时，先看基础成本，再用倍率估算人民币预算。

价格仅供规划和比较，正式调用前请以模型厂商或服务商账单为准。`,
  },
  {
    slug: "one-api-model-rate-basics",
    title: "One-API / New API 倍率应该怎么理解",
    description:
      "解释模型倍率、补全倍率、分组倍率和线路倍率之间的关系，帮助判断中转站价格是否合理。",
    category: "multiplier",
    seoTitle: "One-API 倍率计算入门",
    seoDescription:
      "了解 One-API 模型倍率、补全倍率、分组倍率和线路倍率的基础计算逻辑。",
    publishedAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
    contentMd: `# One-API / New API 倍率应该怎么理解

很多中转站会用倍率描述模型价格。倍率本身不是问题，问题是用户必须知道倍率基准是什么，以及输出 token 是否还有额外补全倍率。

## 默认基准

ModelRate 第一版默认使用 1x = 2 USD / 1M input tokens。模型倍率可以由官方输入价格除以 2 得到。

## 常见字段

- model_multiplier：模型输入价格相对于基准价的倍数。
- completion_multiplier：输出价格相对于输入价格的倍数。
- group_multiplier：用户组、套餐或渠道层面的倍率。
- route_multiplier：线路或供应商路由层面的倍率。

## 示例

如果某模型输入价格为 3 USD / 1M tokens，输出价格为 15 USD / 1M tokens，那么模型倍率是 1.5，补全倍率是 5。

## 风险提示

如果站点只展示模型倍率，不展示补全倍率、分组倍率或线路倍率，最终账单可能和用户直觉不一致。`,
  },
  {
    slug: "relay-station-risk-checklist",
    title: "选择 AI API 中转站前需要检查什么",
    description:
      "从公开价格、支付方式、起充金额、推荐关系和社区反馈五个维度评估中转站风险。",
    category: "relay",
    seoTitle: "AI API 中转站风险检查清单",
    seoDescription:
      "使用中转站前，检查公开价格、支付方式、起充金额、推荐关系和风险标签。",
    publishedAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
    contentMd: `# 选择 AI API 中转站前需要检查什么

中转站可以降低接入门槛，但也会引入价格、稳定性、隐私和资金风险。ModelRate 不为任何中转站作担保，只提供结构化信息和风险提示。

## 检查清单

- 是否有公开价格页。
- 是否清楚标注输入、输出、补全倍率和线路倍率。
- 是否支持小额充值，避免一次性投入过高。
- 是否公开说明推荐计划或赞助关系。
- 是否有可验证的社区反馈和客服渠道。

## 建议

首次使用建议小额测试，确认账单、模型可用性、退款规则和客服响应后再增加调用量。`,
  },
  {
    slug: "model-price-data-source-policy",
    title: "为什么模型价格必须保留来源和检查时间",
    description:
      "说明 source、last checked、current price 和人工审核对工具站可信度的重要性。",
    category: "data",
    seoTitle: "模型价格数据来源规范",
    seoDescription:
      "了解为什么模型价格页必须展示 source、last checked 和数据更新时间。",
    publishedAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
    contentMd: `# 为什么模型价格必须保留来源和检查时间

AI 模型价格变化很快。一个没有来源和更新时间的价格表，即使数字看起来精确，也很难被信任。

## ModelRate 的数据原则

- 当前价格必须有 source URL。
- 当前价格必须有 last checked。
- 自动同步不能直接覆盖人工确认价格。
- 价格展示必须带免责声明。

## 对用户的意义

用户可以根据来源自行复核，也可以根据检查时间判断数据是否可能过期。对成本敏感的生产业务，这比单纯展示最低价更重要。`,
  },
];
