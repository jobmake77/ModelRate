import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminAuthErrorStatus,
  requireAdmin,
  requireAdminRole,
} from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { currentPriceSchema } from "@/lib/validation/common";

const priceCreateSchema = currentPriceSchema.extend({
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
  cachedInputPricePer1M: z.number().finite().min(0).nullable().optional(),
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

    const prisma = getPrisma();
    const prices = await prisma.modelPrice.findMany({
      include: { model: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ prices });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminRole(["owner", "admin"]);

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const prisma = getPrisma();
    const input = priceCreateSchema.parse(await request.json());
    await prisma.modelPrice.updateMany({
      where: {
        modelId: input.modelId,
        isCurrent: true,
      },
      data: { isCurrent: false },
    });
    const price = await prisma.modelPrice.create({
      data: {
        ...input,
        isCurrent: true,
      },
      include: { model: true },
    });

    return NextResponse.json({ price }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create model price",
      },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}
