import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { slugSchema, urlSchema } from "@/lib/validation/common";

const relaySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(160),
  domain: z.string().trim().min(1).max(255),
  websiteUrl: urlSchema,
  description: z.string().trim().max(1000).optional(),
  billingModes: z.array(z.string().trim().min(1)).default([]),
  paymentMethods: z.array(z.string().trim().min(1)).default([]),
  minimumTopUpAmount: z.number().finite().min(0).nullable().optional(),
  minimumTopUpCurrency: z.string().trim().max(16).nullable().optional(),
  supportChannels: z.array(z.string().trim().min(1)).default([]),
  hasPublicPricing: z.boolean().default(false),
  hasTrialCredit: z.boolean().default(false),
  hasReferralProgram: z.boolean().default(false),
  referralUrl: urlSchema.nullable().optional(),
  couponCode: z.string().trim().max(80).nullable().optional(),
  isSponsored: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  status: z.enum(["draft", "published", "hidden", "archived"]).default("draft"),
  riskLevel: z.enum(["unknown", "low", "medium", "high"]).default("unknown"),
  lastCheckedAt: z.coerce.date().nullable().optional(),
});

export async function GET() {
  try {
    await requireAdmin();

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const relays = await getPrisma().relayStation.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ relays });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const input = relaySchema.parse(await request.json());
    const relay = await getPrisma().relayStation.create({
      data: input,
    });

    return NextResponse.json({ relay }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create" },
      { status: 401 },
    );
  }
}
