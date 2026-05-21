import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { currentPriceSchema } from "@/lib/validation/common";

const priceUpdateSchema = currentPriceSchema
  .extend({
    modelId: z.string().uuid(),
    sourceType: z.enum([
      "official",
      "openrouter",
      "litellm",
      "portkey",
      "manual",
      "relay",
    ]),
    sourceName: z.string().min(1),
    cachedInputPricePer1M: z.number().finite().min(0).nullable(),
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
    const input = priceUpdateSchema.parse(await request.json());
    const prisma = getPrisma();

    if (input.isCurrent && input.modelId && input.sourceType) {
      await prisma.modelPrice.updateMany({
        where: {
          id: { not: id },
          modelId: input.modelId,
          sourceType: input.sourceType,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });
    }

    const price = await prisma.modelPrice.update({
      where: { id },
      data: input,
      include: { model: true },
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
    const price = await getPrisma().modelPrice.update({
      where: { id },
      data: { isCurrent: false },
      include: { model: true },
    });

    return NextResponse.json({ price });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to archive" },
      { status: 401 },
    );
  }
}
