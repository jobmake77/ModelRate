import "dotenv/config";
import { PrismaClient } from "@prisma/client";

type IssueLevel = "fail" | "warn";

type Issue = {
  code: string;
  detail?: string;
  level: IssueLevel;
  message: string;
};

const prisma = new PrismaClient();
const strict = process.argv.includes("--strict");
const allowEnabledAds = process.env.MODELRATE_ALLOW_ENABLED_ADS === "true";
const publicLaunchRelayTarget = Number(
  process.env.MODELRATE_PUBLIC_LAUNCH_RELAY_TARGET ?? 30,
);
const publicLaunchGuideTarget = Number(
  process.env.MODELRATE_PUBLIC_LAUNCH_GUIDE_TARGET ?? 10,
);

async function main() {
  const issues: Issue[] = [];

  if (!process.env.DATABASE_URL) {
    addIssue(issues, {
      level: "fail",
      code: "DATABASE_URL_MISSING",
      message: "DATABASE_URL is required to validate production data.",
    });
    printReport(issues);
    process.exitCode = 1;
    return;
  }

  const [
    activeOwners,
    activeModels,
    currentModelPrices,
    latestUsdCny,
    publishedRelays,
    publishedGuides,
    enabledAdPlacements,
    oldPendingSubmissions,
  ] = await Promise.all([
    prisma.adminUser.findMany({
      where: { role: "owner", status: "active" },
      orderBy: { email: "asc" },
    }),
    prisma.model.findMany({
      where: { status: "active" },
      include: { prices: { where: { isCurrent: true } } },
      orderBy: { displayName: "asc" },
    }),
    prisma.modelPrice.findMany({
      where: { isCurrent: true },
      include: { model: true },
      orderBy: [{ model: { displayName: "asc" } }, { sourceType: "asc" }],
    }),
    prisma.exchangeRate.findFirst({
      where: { baseCurrency: "USD", quoteCurrency: "CNY" },
      orderBy: { fetchedAt: "desc" },
    }),
    prisma.relayStation.findMany({
      where: { status: "published" },
      include: { relayModelPrices: { where: { isCurrent: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.guide.findMany({
      where: { status: "published" },
      orderBy: { title: "asc" },
    }),
    prisma.adPlacement.findMany({
      where: { isEnabled: true },
      orderBy: { slotKey: "asc" },
    }),
    prisma.submission.findMany({
      where: {
        status: "pending",
        createdAt: { lt: daysAgo(7) },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!activeOwners.length) {
    addIssue(issues, {
      level: "fail",
      code: "NO_ACTIVE_OWNER",
      message: "At least one active owner is required before launch.",
    });
  }

  if (!latestUsdCny) {
    addIssue(issues, {
      level: "fail",
      code: "USD_CNY_RATE_MISSING",
      message: "A USD -> CNY exchange rate is required for calculators.",
    });
  }

  if (!activeModels.length) {
    addIssue(issues, {
      level: "fail",
      code: "NO_ACTIVE_MODELS",
      message: "At least one active model is required.",
    });
  }

  for (const model of activeModels) {
    if (!model.prices.length) {
      addIssue(issues, {
        level: "fail",
        code: "ACTIVE_MODEL_WITHOUT_CURRENT_PRICE",
        message: "Active models must have a current public price.",
        detail: model.displayName,
      });
    }

    if (model.prices.length > 1) {
      addIssue(issues, {
        level: "fail",
        code: "MULTIPLE_CURRENT_MODEL_PRICES",
        message: "Each active model should have exactly one current price.",
        detail: `${model.displayName}: ${model.prices.length} current prices`,
      });
    }
  }

  for (const price of currentModelPrices) {
    if (isBlank(price.sourceUrl)) {
      addIssue(issues, {
        level: "fail",
        code: "MODEL_PRICE_SOURCE_MISSING",
        message: "Current model prices must include sourceUrl.",
        detail: `${price.model.displayName} (${price.sourceType})`,
      });
    }

    if (
      Number(price.inputPricePer1M) < 0 ||
      Number(price.outputPricePer1M) < 0
    ) {
      addIssue(issues, {
        level: "fail",
        code: "MODEL_PRICE_NEGATIVE",
        message: "Current model prices cannot be negative.",
        detail: `${price.model.displayName} (${price.sourceType})`,
      });
    }

    const age = daysSince(price.lastCheckedAt);
    if (age > 90) {
      addIssue(issues, {
        level: "warn",
        code: "MODEL_PRICE_VERY_STALE",
        message: "Current model prices older than 90 days need review.",
        detail: `${price.model.displayName}: ${age} days`,
      });
    } else if (age > 30) {
      addIssue(issues, {
        level: "warn",
        code: "MODEL_PRICE_STALE",
        message: "Current model prices older than 30 days should be reviewed.",
        detail: `${price.model.displayName}: ${age} days`,
      });
    }
  }

  for (const relay of publishedRelays) {
    if (
      isBlank(relay.name) ||
      isBlank(relay.domain) ||
      isBlank(relay.websiteUrl)
    ) {
      addIssue(issues, {
        level: "fail",
        code: "PUBLISHED_RELAY_IDENTITY_INCOMPLETE",
        message: "Published relays must have name, domain and websiteUrl.",
        detail: relay.slug,
      });
    }

    if (!relay.lastCheckedAt) {
      addIssue(issues, {
        level: "fail",
        code: "PUBLISHED_RELAY_LAST_CHECKED_MISSING",
        message: "Published relays must include lastCheckedAt.",
        detail: relay.name,
      });
    }

    if (relay.riskLevel === "unknown") {
      addIssue(issues, {
        level: "fail",
        code: "PUBLISHED_RELAY_RISK_UNKNOWN",
        message: "Published relays must have an explicit risk level.",
        detail: relay.name,
      });
    }

    if (relay.hasReferralProgram && isBlank(relay.referralUrl)) {
      addIssue(issues, {
        level: "fail",
        code: "REFERRAL_RELAY_URL_MISSING",
        message: "Referral relays must include referralUrl.",
        detail: relay.name,
      });
    }

    if (relay.hasPublicPricing && !relay.relayModelPrices.length) {
      addIssue(issues, {
        level: "warn",
        code: "PUBLIC_PRICING_WITHOUT_CURRENT_RELAY_PRICE",
        message:
          "Relays marked as public pricing should have at least one current relay model price.",
        detail: relay.name,
      });
    }
  }

  for (const guide of publishedGuides) {
    const missingFields = [
      ["title", guide.title],
      ["description", guide.description],
      ["seoTitle", guide.seoTitle],
      ["seoDescription", guide.seoDescription],
      ["contentMd", guide.contentMd],
    ]
      .filter(([, value]) => isBlank(value))
      .map(([field]) => field);

    if (missingFields.length) {
      addIssue(issues, {
        level: "fail",
        code: "PUBLISHED_GUIDE_METADATA_MISSING",
        message: "Published guides must include content and SEO metadata.",
        detail: `${guide.slug}: ${missingFields.join(", ")}`,
      });
    }

    if (!guide.publishedAt) {
      addIssue(issues, {
        level: "warn",
        code: "PUBLISHED_GUIDE_DATE_MISSING",
        message: "Published guides should include publishedAt.",
        detail: guide.slug,
      });
    }
  }

  if (enabledAdPlacements.length && !allowEnabledAds) {
    addIssue(issues, {
      level: "fail",
      code: "AD_PLACEMENTS_ENABLED",
      message:
        "Ad placements should remain disabled before explicit monetization approval.",
      detail: enabledAdPlacements
        .map((placement) => placement.slotKey)
        .join(", "),
    });
  }

  if (publishedRelays.length < publicLaunchRelayTarget) {
    addIssue(issues, {
      level: "warn",
      code: "PUBLIC_RELAY_TARGET_NOT_MET",
      message: "Published relay count is below the public launch target.",
      detail: `${publishedRelays.length}/${publicLaunchRelayTarget}`,
    });
  }

  if (publishedGuides.length < publicLaunchGuideTarget) {
    addIssue(issues, {
      level: "warn",
      code: "PUBLIC_GUIDE_TARGET_NOT_MET",
      message: "Published guide count is below the public launch target.",
      detail: `${publishedGuides.length}/${publicLaunchGuideTarget}`,
    });
  }

  if (oldPendingSubmissions.length) {
    addIssue(issues, {
      level: "warn",
      code: "OLD_PENDING_SUBMISSIONS",
      message: "Pending submissions older than 7 days should be reviewed.",
      detail: `${oldPendingSubmissions.length} old pending submissions`,
    });
  }

  printSummary({
    activeOwners: activeOwners.length,
    activeModels: activeModels.length,
    currentModelPrices: currentModelPrices.length,
    publishedGuides: publishedGuides.length,
    publishedRelays: publishedRelays.length,
  });
  printReport(issues);

  const failures = issues.filter(
    (issue) => issue.level === "fail" || (strict && issue.level === "warn"),
  );
  process.exitCode = failures.length ? 1 : 0;
}

function addIssue(issues: Issue[], issue: Issue) {
  issues.push(issue);
}

function printSummary(summary: Record<string, number>) {
  console.log("Launch data summary");
  for (const [key, value] of Object.entries(summary)) {
    console.log(`- ${key}: ${value}`);
  }
}

function printReport(issues: Issue[]) {
  const failures = issues.filter((issue) => issue.level === "fail");
  const warnings = issues.filter((issue) => issue.level === "warn");

  console.log("");
  console.log(`Failures: ${failures.length}`);
  for (const issue of failures) {
    printIssue(issue);
  }

  console.log("");
  console.log(`Warnings: ${warnings.length}`);
  for (const issue of warnings) {
    printIssue(issue);
  }

  if (!issues.length) {
    console.log("");
    console.log("No launch data issues found.");
  }

  if (strict && warnings.length) {
    console.log("");
    console.log("Strict mode is enabled: warnings fail the launch data check.");
  }
}

function printIssue(issue: Issue) {
  const detail = issue.detail ? ` (${issue.detail})` : "";
  console.log(`- [${issue.code}] ${issue.message}${detail}`);
}

function isBlank(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysSince(date: Date) {
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / 86_400_000);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
