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
});

test("models page displays source and last checked metadata", async ({
  page,
}) => {
  await page.goto("/models");

  await expect(page.getByRole("heading", { name: "模型价格表" })).toBeVisible();
  await expect(page.getByText("GPT-4o mini")).toBeVisible();
  await expect(page.getByText(/Checked/).first()).toBeVisible();
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
  await page.getByRole("link", { name: "OpenRouter" }).click();
  await expect(page.getByRole("heading", { name: "OpenRouter" })).toBeVisible();
  await expect(page.getByText("风险和商业关系")).toBeVisible();
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
  expect(await robots?.text()).toContain("Disallow: /admin");

  const sitemap = await page.goto("/sitemap.xml");
  const body = await sitemap?.text();
  expect(body).toContain("/tools/token-cost-calculator");
  expect(body).toContain("/guides/how-to-calculate-ai-token-cost");
});

test("contact page exposes submission form and API accepts pending feedback", async ({
  page,
  request,
}) => {
  await page.goto("/contact");

  await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
  await expect(page.getByRole("button", { name: "提交" })).toBeVisible();

  const response = await request.post("/api/submissions", {
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
