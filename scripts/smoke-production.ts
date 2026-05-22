import "dotenv/config";

type SmokeCheck = {
  name: string;
  run: () => Promise<void>;
};

const baseUrl = normalizeBaseUrl(
  process.argv[2] ??
    process.env.MODELRATE_SMOKE_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL,
);

if (!baseUrl) {
  console.error(
    "Usage: npm run ops:smoke-production -- https://preview.example.com",
  );
  console.error(
    "Or set MODELRATE_SMOKE_BASE_URL / NEXT_PUBLIC_SITE_URL before running.",
  );
  process.exit(1);
}

const checks: SmokeCheck[] = [
  pageCheck("/", "模型价格"),
  pageCheck("/models", "模型价格表"),
  pageCheck("/relays", "AI 中转站目录"),
  pageCheck("/tools/token-cost-calculator", "Token 成本计算器"),
  pageCheck("/tools/model-rate-calculator", "倍率计算器"),
  pageCheck("/privacy", "Privacy Policy"),
  pageCheck("/terms", "Terms"),
  pageCheck("/disclaimer", "Disclaimer"),
  {
    name: "security headers",
    run: async () => {
      const response = await get("/");
      expectHeader(response, "x-frame-options", "DENY");
      expectHeader(response, "x-content-type-options", "nosniff");
      expectHeader(
        response,
        "referrer-policy",
        "strict-origin-when-cross-origin",
      );
    },
  },
  {
    name: "robots blocks admin",
    run: async () => {
      const text = await textResponse("/robots.txt");
      expectIncludes(text, "Disallow: /admin", "/robots.txt");
      expectIncludes(text, "Disallow: /api/admin", "/robots.txt");
    },
  },
  {
    name: "sitemap only includes public URLs",
    run: async () => {
      const text = await textResponse("/sitemap.xml");
      expectIncludes(text, "/tools/token-cost-calculator", "/sitemap.xml");
      expectNotIncludes(text, "/admin", "/sitemap.xml");
      expectNotIncludes(text, "/api", "/sitemap.xml");
    },
  },
  {
    name: "admin requires login",
    run: async () => {
      const response = await get("/admin");
      const text = await response.text();

      if (text.includes("Admin Dashboard")) {
        throw new Error("/admin rendered dashboard without an explicit login.");
      }

      if (
        !response.url.includes("/admin/login") &&
        !text.includes("Admin Login")
      ) {
        throw new Error(
          `/admin did not redirect or render login. Final URL: ${response.url}`,
        );
      }
    },
  },
];

async function main() {
  console.log(`Production smoke target: ${baseUrl}`);

  const failures: string[] = [];
  for (const check of checks) {
    try {
      await check.run();
      console.log(`PASS ${check.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${check.name}: ${message}`);
      console.error(`FAIL ${check.name}: ${message}`);
    }
  }

  if (failures.length) {
    console.error("");
    console.error(`${failures.length} smoke check(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("All production smoke checks passed.");
}

function pageCheck(path: string, expectedText: string): SmokeCheck {
  return {
    name: `page ${path}`,
    run: async () => {
      const text = await textResponse(path);
      expectIncludes(text, expectedText, path);
    },
  };
}

async function textResponse(path: string) {
  const response = await get(path);

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.text();
}

async function get(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "follow",
  });

  if (response.status >= 500) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response;
}

function expectHeader(response: Response, name: string, expected: string) {
  const actual = response.headers.get(name);
  if (actual !== expected) {
    throw new Error(`${name} expected ${expected}, got ${actual ?? "missing"}`);
  }
}

function expectIncludes(text: string, expected: string, context: string) {
  if (!text.includes(expected)) {
    throw new Error(`${context} does not include ${expected}`);
  }
}

function expectNotIncludes(text: string, unexpected: string, context: string) {
  if (text.includes(unexpected)) {
    throw new Error(`${context} unexpectedly includes ${unexpected}`);
  }
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
}

void main();
