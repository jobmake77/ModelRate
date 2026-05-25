import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthErrorStatus, requireAdminRole } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { urlSchema } from "@/lib/validation/common";

const relayUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    domain: z.string().trim().min(1).max(255),
    websiteUrl: urlSchema,
    description: z.string().trim().max(1000).nullable(),
    billingModes: z.array(z.string().trim().min(1)),
    paymentMethods: z.array(z.string().trim().min(1)),
    minimumTopUpAmount: z.number().finite().min(0).nullable(),
    minimumTopUpCurrency: z.string().trim().max(16).nullable(),
    supportChannels: z.array(z.string().trim().min(1)),
    channelType: z.enum(["official_direct", "third_party_relay"]),
    hasPublicPricing: z.boolean(),
    hasTrialCredit: z.boolean(),
    hasReferralProgram: z.boolean(),
    referralUrl: urlSchema.nullable(),
    couponCode: z.string().trim().max(80).nullable(),
    isSponsored: z.boolean(),
    isVerified: z.boolean(),
    status: z.enum(["draft", "published", "hidden", "archived"]),
    riskLevel: z.enum(["unknown", "low", "medium", "high"]),
    lastCheckedAt: z.coerce.date().nullable(),
  })
  .partial();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRole(["owner", "admin"]);

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const input = relayUpdateSchema.parse(await request.json());
    const relay = await getPrisma().relayStation.update({
      where: { id },
      data: input,
    });

    return NextResponse.json({ relay });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRole(["owner", "admin"]);

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const relay = await getPrisma().relayStation.update({
      where: { id },
      data: { status: "hidden" },
    });

    return NextResponse.json({ relay });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to hide" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}
