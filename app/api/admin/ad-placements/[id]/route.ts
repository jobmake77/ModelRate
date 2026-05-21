import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

const adPlacementUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    pageType: z.string().trim().min(1).max(80),
    position: z.string().trim().min(1).max(80),
    provider: z.string().trim().min(1).max(80),
    adCode: z.string().trim().max(4000).nullable(),
    isEnabled: z.boolean(),
  })
  .partial();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    if (!["owner", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const input = adPlacementUpdateSchema.parse(await request.json());
    const placement = await getPrisma().adPlacement.update({
      where: { slotKey: id },
      data: input,
    });

    return NextResponse.json({ placement });
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
