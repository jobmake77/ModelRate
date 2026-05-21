import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { slugSchema, urlSchema } from "@/lib/validation/common";

const modelUpdateSchema = z
  .object({
    providerId: z.string().uuid(),
    slug: slugSchema,
    canonicalModelId: z.string().min(1),
    displayName: z.string().min(1),
    family: z.string().nullable(),
    description: z.string().nullable(),
    contextWindow: z.number().int().positive().nullable(),
    maxOutputTokens: z.number().int().positive().nullable(),
    supportsVision: z.boolean(),
    supportsReasoning: z.boolean(),
    supportsFunctionCalling: z.boolean(),
    sourceUrl: urlSchema.nullable(),
    status: z.enum(["active", "deprecated", "hidden"]),
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
    const input = modelUpdateSchema.parse(await request.json());
    const model = await getPrisma().model.update({
      where: { id },
      data: input,
      include: { provider: true },
    });

    return NextResponse.json({ model });
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
    const model = await getPrisma().model.update({
      where: { id },
      data: { status: "hidden" },
      include: { provider: true },
    });

    return NextResponse.json({ model });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to hide" },
      { status: 401 },
    );
  }
}
