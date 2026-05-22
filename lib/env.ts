import { z } from "zod";

const requiredProductionEnv = z.object({
  ADMIN_EMAILS: z.string().trim().min(1),
  CLICK_HASH_SALT: z.string().trim().min(16),
  DATABASE_URL: z.string().trim().min(1),
  DIRECT_URL: z.string().trim().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
});

export function validateEnv(input: Record<string, string | undefined>) {
  const nodeEnv = input.NODE_ENV ?? "development";
  const strictProduction =
    nodeEnv === "production" || input.VERCEL_ENV === "production";
  const adminEmails = (input.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!strictProduction) {
    return {
      NODE_ENV: nodeEnv,
      ADMIN_EMAILS: adminEmails,
      CLICK_HASH_SALT: input.CLICK_HASH_SALT,
      DATABASE_URL: input.DATABASE_URL,
      DIRECT_URL: input.DIRECT_URL,
      NEXT_PUBLIC_SITE_URL:
        input.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: input.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_URL: input.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: input.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  const result = requiredProductionEnv.safeParse(input);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(`Missing or invalid production environment: ${missing}`);
  }

  return {
    NODE_ENV: nodeEnv,
    ADMIN_EMAILS: adminEmails,
    CLICK_HASH_SALT: result.data.CLICK_HASH_SALT,
    DATABASE_URL: result.data.DATABASE_URL,
    DIRECT_URL: result.data.DIRECT_URL,
    NEXT_PUBLIC_SITE_URL: result.data.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: result.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: result.data.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function shouldEnforceProductionEnv() {
  return (
    process.env.MODELRATE_STRICT_ENV === "true" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function assertProductionEnv() {
  if (!shouldEnforceProductionEnv()) {
    return;
  }

  validateEnv(process.env);
}

export function canUseFixtureFallback() {
  return !shouldEnforceProductionEnv();
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
