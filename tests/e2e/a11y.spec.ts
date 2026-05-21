import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home page has no critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical",
  );

  expect(critical).toEqual([]);
});

test("relays page has no critical accessibility violations", async ({
  page,
}) => {
  await page.goto("/relays");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical",
  );

  expect(critical).toEqual([]);
});

test("guide detail has no critical accessibility violations", async ({
  page,
}) => {
  await page.goto("/guides/how-to-calculate-ai-token-cost");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical",
  );

  expect(critical).toEqual([]);
});
