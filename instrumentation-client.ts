import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === "true",
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",
    release:
      process.env.NEXT_PUBLIC_SENTRY_RELEASE ??
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      0.05,
    ),
  });
}

function parseSampleRate(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : fallback;
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
