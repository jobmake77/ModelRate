import { expect, test } from "@playwright/test";

test("home page renders calculator and model pricing", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /模型价格、Token 成本和倍率换算工具/ }),
  ).toBeVisible();
  await expect(page.getByLabel("模型")).toBeVisible();
  await expect(page.getByText(/估算结果/)).toBeVisible();
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
  await expect(page.getByText(/Checked/).first()).toBeVisible();
  await page.getByLabel("Provider").selectOption("Anthropic");
  await expect(page.getByText("Claude Sonnet 4.5")).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).not.toBeVisible();
  await expect(page).toHaveURL(/provider=Anthropic/);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page).toHaveURL(/\/models$/);
  await page.getByLabel("Search").fill("gpt-4o");
  await expect(page.getByText("GPT-4o mini")).toBeVisible();
  await expect(page).toHaveURL(/q=gpt-4o/);
});

test("models page restores filters from URL", async ({ page }) => {
  await page.goto("/models?provider=Anthropic&capability=vision&q=claude");

  await expect(page.getByText("Claude Sonnet 4.5")).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).not.toBeVisible();
  await expect(page.getByLabel("Provider")).toHaveValue("Anthropic");
  await expect(page.getByLabel("Capability")).toHaveValue("vision");
  await expect(page.getByLabel("Search")).toHaveValue("claude");
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

  await page.getByLabel("输入 tokens").fill("100000");
  await page.getByLabel("输出 tokens").fill("10000");
  await page.getByLabel("请求次数").fill("2");

  await expect(page.getByText("估算结果")).toBeVisible();
  await expect(page.getByText(/约/)).toBeVisible();
});

test("model rate calculator renders multiplier result", async ({ page }) => {
  await page.goto("/tools/model-rate-calculator");

  await expect(
    page.getByRole("heading", { name: "One-API / New API 倍率计算器" }),
  ).toBeVisible();
  await expect(page.getByText("模型倍率", { exact: true })).toBeVisible();
  await expect(page.locator("textarea")).toContainText("model_multiplier=");
});

test("relays page displays risk and referral metadata", async ({ page }) => {
  await page.goto("/relays");

  await expect(
    page.getByRole("heading", { name: "AI 中转站目录" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "OpenRouter" })).toBeVisible();
  await expect(page.getByText(/Risk:/).first()).toBeVisible();
  await page.getByLabel("Payment").selectOption("Alipay");
  await expect(page.getByRole("link", { name: "302.AI" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenRouter" }),
  ).not.toBeVisible();
  await page.getByLabel("Payment").selectOption("all");
  await page.getByLabel("Provider").selectOption("xAI");
  await expect(page.getByRole("link", { name: "Crazyrouter" })).toBeVisible();
  await expect(page.getByRole("link", { name: "302.AI" })).not.toBeVisible();
  await expect(page).toHaveURL(/provider=xAI/);
  await page.getByLabel("Provider").selectOption("all");
  await page.getByLabel("Relationship").selectOption("referral");
  await expect(page.getByRole("link", { name: "302.AI" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenRouter" }),
  ).not.toBeVisible();
  await expect(page).toHaveURL(/relationship=referral/);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page).toHaveURL(/\/relays$/);
  await page.getByRole("link", { name: "OpenRouter" }).click();
  await expect(page.getByRole("heading", { name: "OpenRouter" })).toBeVisible();
  await expect(page.getByText("风险和商业关系")).toBeVisible();
  await expect(page.getByText("模型价格和倍率")).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).toBeVisible();
});

test("relays page restores filters from URL", async ({ page }) => {
  await page.goto(
    "/relays?payment=Alipay&provider=OpenAI&relationship=referral",
  );

  await expect(page.getByRole("link", { name: "302.AI" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenRouter" }),
  ).not.toBeVisible();
  await expect(page.getByLabel("Payment")).toHaveValue("Alipay");
  await expect(page.getByLabel("Provider")).toHaveValue("OpenAI");
  await expect(page.getByLabel("Relationship")).toHaveValue("referral");
});

test("guides page links to a useful guide detail", async ({ page }) => {
  await page.goto("/guides");

  await expect(
    page.getByRole("heading", { name: "AI API 成本与中转站指南" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "如何估算一次 AI API 调用的 Token 成本" })
    .click();
  await expect(
    page.getByRole("heading", {
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
