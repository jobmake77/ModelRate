import { expect, test } from "@playwright/test";

test("home page renders calculator and model pricing", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /模型价格和中转站倍率换算工具/ }),
  ).toBeVisible();
  await expect(page.getByLabel("模型")).toBeVisible();
  await expect(page.locator("select", { hasText: "GPT-4o" })).toHaveCount(0);
  await page.getByLabel("模型").click();
  await expect(page.getByPlaceholder("搜索模型或厂商")).toBeVisible();
  await page.getByPlaceholder("搜索模型或厂商").fill("claude");
  await page.getByRole("option", { name: /Claude Sonnet 4.6/ }).click();
  await expect(page.getByAltText("Anthropic logo").first()).toBeVisible();
  await expect(page.getByText("上下文窗口（来源值）")).toBeVisible();
  await expect(page.getByText("最大输出（来源值）")).toBeVisible();
  await expect(page.getByText(/来源未公开时显示“未公开”/)).toBeVisible();
  await expect(page.getByText(/每 1M tokens 单价换算/)).toBeVisible();
  await expect(page.getByLabel("输入 tokens")).toHaveCount(0);
  await expect(page.getByLabel("输出 tokens")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "1x" })).toHaveCount(0);
  await expect(page.getByLabel("中转站倍率")).toHaveValue("");
  await expect(
    page.getByText("请输入倍率后查看中转站换算结果。"),
  ).toBeVisible();
  await expect(page.getByText("输入价差 / 1M")).toHaveCount(0);
  await expect(page.getByText("输出价差 / 1M")).toHaveCount(0);
  await expect(page.getByLabel("请求次数")).toHaveCount(0);
  await expect(page.getByText("第一阶段范围")).toHaveCount(0);
  await expect(page.getByRole("navigation")).not.toContainText("管理后台");
  await expect(page.getByRole("navigation")).not.toContainText("关于");
  await expect(
    page.getByRole("link", { name: "查看完整模型价格表" }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:3000",
  );
  await expect(
    page.locator('script[type="application/ld+json"]').first(),
  ).toBeAttached();
});

test("models page displays source and last checked metadata", async ({
  page,
}) => {
  await page.goto("/models");

  await expect(page.getByRole("heading", { name: "模型价格表" })).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).toBeVisible();
  await expect(page.getByText("Last checked").first()).toBeVisible();
  await expect(page.getByText("数据来源").first()).toBeVisible();
  await expect(page.getByText("输出 / 1M").first()).toBeVisible();
  await page.getByRole("button", { name: "Anthropic" }).click();
  await expect(page.getByText("Claude Sonnet 4.6")).toBeVisible();
  await expect(page.getByAltText("Anthropic logo").first()).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).not.toBeVisible();
  await expect(page).toHaveURL(/provider=Anthropic/);
  await page.getByRole("button", { name: "重置筛选" }).click();
  await expect(page).toHaveURL(/\/models$/);
  await page.getByLabel("搜索").fill("gpt-4o");
  await expect(page.getByText("GPT-4o mini")).toBeVisible();
  await expect(page).toHaveURL(/q=gpt-4o/);
  await page.getByRole("button", { name: "CNY" }).click();
  await expect(page.getByText(/¥/).first()).toBeVisible();
});

test("models page restores filters from URL", async ({ page }) => {
  await page.goto("/models?provider=Anthropic&capability=vision&q=claude");

  await expect(page.getByText("Claude Sonnet 4.6")).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Anthropic" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "视觉" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel("搜索")).toHaveValue("claude");
});

test("model detail links maintained relay pricing", async ({ page }) => {
  await page.goto("/models/gpt-4o-mini");

  await expect(
    page.getByRole("heading", { name: "GPT-4o mini" }),
  ).toBeVisible();
  await expect(page.getByText("中转站价格和倍率")).toBeVisible();
  await expect(page.getByRole("link", { name: "OpenRouter" })).toBeVisible();
  await expect(page.getByText("Referral")).toBeVisible();
});

test("token cost calculator updates result", async ({ page }) => {
  await page.goto("/tools/token-cost-calculator");

  await expect(page.getByLabel("输入 tokens")).toHaveCount(0);
  await expect(page.getByLabel("输出 tokens")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "1x" })).toHaveCount(0);
  await expect(page.getByLabel("中转站倍率")).toHaveValue("");
  await page.getByLabel("中转站倍率").fill("0.2");

  await expect(page.getByText("每 1M tokens 单价换算")).toBeVisible();
  await expect(page.getByText("基础输入 / 1M")).toBeVisible();
  await expect(page.getByText("中转站换算价 · 0.2x")).toBeVisible();
});

test("model rate calculator renders multiplier result", async ({ page }) => {
  await page.goto("/tools/model-rate-calculator");

  await expect(
    page.getByRole("heading", { name: "One-API / New API 倍率计算器" }),
  ).toBeVisible();
  await expect(page.getByText("基础输入 / 1M")).toBeVisible();
  await expect(page.getByLabel("中转站倍率")).toHaveValue("");
  await page.getByLabel("中转站倍率").fill("0.01");
  await expect(page.getByText("中转站换算价 · 0.01x")).toBeVisible();
});

test("relays page displays risk and referral metadata", async ({ page }) => {
  await page.goto("/relays");

  await expect(
    page.getByRole("heading", { name: "AI 中转站目录" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "OpenRouter" })).toBeVisible();
  await expect(page.getByText(/Risk:/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "中转站收录" })).toBeVisible();
  await expect(page.getByText("入口类型")).toBeVisible();
  await expect(page.getByText("官方直连").first()).toBeVisible();
  await expect(page.getByText("二次中转").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "中转站收录申请" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "官方直连" }).click();
  await expect(
    page.getByRole("link", { name: "OpenAI Platform" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenRouter" }),
  ).not.toBeVisible();
  await expect(page).toHaveURL(/channel=official/);
  await page.getByRole("button", { name: "二次中转" }).click();
  await expect(page.getByRole("link", { name: "OpenRouter" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenAI Platform" }),
  ).not.toBeVisible();
  await expect(page).toHaveURL(/channel=relay/);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByRole("button", { name: "Alipay" }).click();
  await expect(page.getByRole("link", { name: "302.AI" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenRouter" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "全部支付" }).click();
  await page.getByRole("button", { name: "xAI" }).click();
  await expect(page.getByRole("link", { name: "Crazyrouter" })).toBeVisible();
  await expect(page.getByRole("link", { name: "302.AI" })).not.toBeVisible();
  await expect(page).toHaveURL(/provider=xAI/);
  await page.getByRole("button", { name: "全部模型" }).click();
  await page.getByRole("button", { name: "Referral" }).click();
  await expect(page.getByRole("link", { name: "302.AI" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenRouter" }),
  ).not.toBeVisible();
  await expect(page).toHaveURL(/relationship=referral/);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page).toHaveURL(/\/relays$/);
  await expect(
    page
      .locator('a[href="/relays/openrouter"]')
      .filter({ hasText: "查看详情" }),
  ).toBeVisible();
  await page.goto("/relays/openrouter");
  await expect(page.getByRole("heading", { name: "OpenRouter" })).toBeVisible();
  await expect(
    page.getByText("二次中转表示该入口由第三方聚合", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("风险和商业关系")).toBeVisible();
  await expect(page.getByText("模型价格和倍率")).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).toBeVisible();
});

test("relays page restores filters from URL", async ({ page }) => {
  await page.goto(
    "/relays?payment=Alipay&provider=OpenAI&relationship=referral&channel=relay",
  );

  await expect(page.getByRole("link", { name: "302.AI" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenRouter" }),
  ).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Alipay" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "OpenAI" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Referral" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "二次中转" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("relay submission page accepts listing requests", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/relays");
  await expect(page.getByRole("link", { name: "中转站收录" })).toHaveAttribute(
    "href",
    "/relays/submit",
  );
  await page.goto("/relays/submit");

  await expect(
    page.getByRole("heading", { name: "中转站收录申请" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "填写收录信息" }),
  ).toBeVisible();
  await expect(page.getByLabel("入口类型")).toHaveValue("third_party_relay");

  const response = await request.post("/api/submissions", {
    headers: {
      "x-forwarded-for": `relay-submit-${testInfo.project.name}-${Date.now()}`,
    },
    data: {
      type: "relay_submission",
      submitterEmail: "relay@example.com",
      payload: {
        subject: "Relay listing",
        message: "Please review this relay station.",
        relayName: "Example Relay",
        channelType: "third_party_relay",
        sourceUrl: "https://example.com/",
        paymentMethods: "Alipay, USDT",
        minimumTopUp: "CNY 10",
        supportedProviders: "OpenAI, Claude",
        pricingNotes: "Public pricing page available.",
      },
    },
  });

  expect([201, 202]).toContain(response.status());
  const body = await response.json();
  expect(body.submission?.status ?? body.status).toBe("pending");
});

test("guides page links to a useful guide detail", async ({ page }) => {
  await page.goto("/guides");

  await expect(
    page.getByRole("heading", { name: "AI API 成本与中转站指南" }),
  ).toBeVisible();
  if ((page.viewportSize()?.width ?? 1440) >= 1024) {
    await expect(page.getByText("文档目录")).toBeVisible();
  } else {
    await expect(page.getByLabel("选择指南")).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: "打开独立页面" }),
  ).toHaveAttribute("href", "/guides/how-to-calculate-ai-token-cost");
  await page.goto("/guides/how-to-calculate-ai-token-cost");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "如何估算一次 AI API 调用的 Token 成本",
    }),
  ).toBeVisible();
  await expect(page.getByText("相关工具")).toBeVisible();
});

test("robots and sitemap expose public URLs and block admin", async ({
  page,
}) => {
  const robots = await page.goto("/robots.txt");
  expect(robots?.headers()["x-frame-options"]).toBe("DENY");
  expect(await robots?.text()).toContain("Disallow: /admin");

  const sitemap = await page.goto("/sitemap.xml");
  const body = await sitemap?.text();
  expect(body).toContain("/tools/token-cost-calculator");
  expect(body).toContain("/guides/how-to-calculate-ai-token-cost");
  expect(body).toContain("/relays/submit");
  expect(body).not.toContain("/about");
});

test("contact page exposes submission form and API accepts pending feedback", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/contact");

  await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
  await expect(page.getByRole("button", { name: "提交" })).toBeVisible();

  const response = await request.post("/api/submissions", {
    headers: {
      "x-forwarded-for": `e2e-${testInfo.project.name}-${Date.now()}`,
    },
    data: {
      type: "price_correction",
      submitterEmail: "tester@example.com",
      payload: {
        subject: "GPT price correction",
        message: "The displayed price should be checked against source.",
        sourceUrl: "https://example.com/pricing",
        modelName: "GPT test",
        displayedPrice: "$1.00",
        correctedPrice: "$0.50",
      },
    },
  });

  expect([201, 202]).toContain(response.status());
  const body = await response.json();
  expect(body.submission?.status ?? body.status).toBe("pending");
});

test("outbound click API validates relay targets without open redirect", async ({
  request,
}) => {
  const valid = await request.post("/api/outbound-clicks", {
    data: {
      targetType: "relay",
      targetSlug: "openrouter",
      url: "https://openrouter.ai/",
      sourcePath: "/relays",
    },
  });
  expect([200, 202]).toContain(valid.status());

  const invalid = await request.post("/api/outbound-clicks", {
    data: {
      targetType: "relay",
      targetSlug: "openrouter",
      url: "https://evil.example/",
      sourcePath: "/relays",
    },
  });
  expect(invalid.status()).toBe(400);
});

test("admin dashboard is reachable in local bootstrap mode", async ({
  page,
}) => {
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Admin Dashboard" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Models" })).toBeVisible();
  await expect(page.getByText("Relay stations")).toBeVisible();
  await expect(page.getByText("Pending submissions")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Data Quality" }),
  ).toBeVisible();
});

test("admin ad placements page is reachable and disabled by default", async ({
  page,
}) => {
  await page.goto("/admin/ad-placements");

  await expect(
    page.getByRole("heading", { name: "Ad Placements" }),
  ).toBeVisible();
  await expect(page.getByText("Home sidebar")).toBeVisible();
  await expect(page.getByText("disabled").first()).toBeVisible();
});

test("admin relays page is reachable in local bootstrap mode", async ({
  page,
}) => {
  await page.goto("/admin/relays");

  await expect(
    page.getByRole("heading", { name: "Relay Stations" }),
  ).toBeVisible();
  await expect(page.getByText("OpenRouter")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();
});

test("admin relay prices page is reachable in local bootstrap mode", async ({
  page,
}) => {
  await page.goto("/admin/relay-prices");

  await expect(
    page.getByRole("heading", { name: "Relay Model Prices" }),
  ).toBeVisible();
  await expect(page.getByText("Create relay model price")).toBeVisible();
  await expect(page.getByText("No relay prices yet.")).toBeVisible();
});

test("admin guides page is reachable in local bootstrap mode", async ({
  page,
}) => {
  await page.goto("/admin/guides");

  await expect(page.getByRole("heading", { name: "Guides" })).toBeVisible();
  await expect(page.getByText("Create guide")).toBeVisible();
  await expect(
    page.getByText("/guides/how-to-calculate-ai-token-cost"),
  ).toBeVisible();
});

test("admin users page is owner-only and reachable in local bootstrap mode", async ({
  page,
}) => {
  await page.goto("/admin/users");

  await expect(
    page.getByRole("heading", { name: "Admin Users" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "admin@example.com" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" }).nth(1)).toHaveValue(
    "Development admin",
  );
});
