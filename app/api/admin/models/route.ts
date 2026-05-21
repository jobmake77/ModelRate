import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { slugSchema, urlSchema } from "@/lib/validation/common";

const modelCreateSchema = z.object({
  providerId: z.string().uuid(),
  slug: slugSchema,
  canonicalModelId: z.string().min(1),
  displayName: z.string().min(1),
  family: z.string().optional(),
  description: z.string().optional(),
  contextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  supportsVision: z.boolean().default(false),
  supportsReasoning: z.boolean().default(false),
  supportsFunctionCalling: z.boolean().default(false),
  sourceUrl: urlSchema.optional(),
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
    const [models, providers] = await Promise.all([
      prisma.model.findMany({
        include: { provider: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.provider.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ models, providers });
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

    const prisma = getPrisma();
    const input = modelCreateSchema.parse(await request.json());
    const model = await prisma.model.create({
      data: input,
      include: { provider: true },
    });

    return NextResponse.json({ model }, { status: 201 });
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
          error instanceof Error ? error.message : "Unable to create model",
      },
      { status: 401 },
    );
  }
}
