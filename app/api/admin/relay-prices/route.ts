import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminAuthErrorStatus,
  requireAdmin,
  requireAdminRole,
} from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { urlSchema } from "@/lib/validation/common";

const relayPriceSchema = z.object({
  relayStationId: z.string().uuid(),
  modelId: z.string().uuid(),
  routeName: z.string().trim().max(120).nullable().optional(),
  billingType: z.string().trim().min(1).max(80).default("token"),
  modelMultiplier: z.number().finite().min(0).nullable().optional(),
  completionMultiplier: z.number().finite().min(0).nullable().optional(),
  groupMultiplier: z.number().finite().min(0).default(1),
  routeMultiplier: z.number().finite().min(0).default(1),
  inputPricePer1M: z.number().finite().min(0).nullable().optional(),
  outputPricePer1M: z.number().finite().min(0).nullable().optional(),
  currency: z.string().trim().min(1).max(16).default("USD"),
  sourceUrl: urlSchema.nullable().optional(),
  lastCheckedAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
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

    const prices = await getPrisma().relayModelPrice.findMany({
      include: { model: true, relayStation: true },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }],
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

    const input = relayPriceSchema.parse(await request.json());
    const prisma = getPrisma();
    await prisma.relayModelPrice.updateMany({
      where: {
        relayStationId: input.relayStationId,
        modelId: input.modelId,
        routeName: input.routeName,
        isCurrent: true,
      },
      data: { isCurrent: false },
    });
    const price = await prisma.relayModelPrice.create({
      data: {
        ...input,
        isCurrent: true,
      },
      include: { model: true, relayStation: true },
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
      { error: error instanceof Error ? error.message : "Unable to create" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}
