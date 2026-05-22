import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminAuthErrorStatus,
  requireAdmin,
  requireAdminRole,
} from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

const adPlacementSchema = z.object({
  slotKey: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  pageType: z.string().trim().min(1).max(80),
  position: z.string().trim().min(1).max(80),
  provider: z.string().trim().min(1).max(80),
  adCode: z.string().trim().max(4000).nullable().optional(),
  isEnabled: z.boolean().default(false),
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

    const placements = await getPrisma().adPlacement.findMany({
      orderBy: [{ pageType: "asc" }, { position: "asc" }],
    });

    return NextResponse.json({ placements });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
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

    const input = adPlacementSchema.parse(await request.json());
    const placement = await getPrisma().adPlacement.upsert({
      where: { slotKey: input.slotKey },
      update: input,
      create: input,
    });

    return NextResponse.json({ placement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}
