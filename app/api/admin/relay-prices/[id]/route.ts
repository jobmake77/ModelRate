import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { urlSchema } from "@/lib/validation/common";

const relayPriceUpdateSchema = z
  .object({
    routeName: z.string().trim().max(120).nullable(),
    billingType: z.string().trim().min(1).max(80),
    modelMultiplier: z.number().finite().min(0).nullable(),
    completionMultiplier: z.number().finite().min(0).nullable(),
    groupMultiplier: z.number().finite().min(0),
    routeMultiplier: z.number().finite().min(0),
    inputPricePer1M: z.number().finite().min(0).nullable(),
    outputPricePer1M: z.number().finite().min(0).nullable(),
    currency: z.string().trim().min(1).max(16),
    sourceUrl: urlSchema.nullable(),
    lastCheckedAt: z.coerce.date().nullable(),
    notes: z.string().trim().max(1000).nullable(),
    isCurrent: z.boolean(),
  })
  .partial();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const input = relayPriceUpdateSchema.parse(await request.json());
    const price = await getPrisma().relayModelPrice.update({
      where: { id },
      data: input,
      include: { model: true, relayStation: true },
    });

    return NextResponse.json({ price });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update" },
      { status: 401 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const price = await getPrisma().relayModelPrice.update({
      where: { id },
      data: { isCurrent: false },
      include: { model: true, relayStation: true },
    });

    return NextResponse.json({ price });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to archive" },
      { status: 401 },
    );
  }
}
