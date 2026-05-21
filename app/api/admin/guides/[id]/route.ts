import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { slugSchema } from "@/lib/validation/common";

const guideUpdateSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(500),
    contentMd: z.string().trim().min(1).max(60_000),
    category: z.string().trim().min(1).max(80),
    status: z.enum(["draft", "published", "archived"]),
    seoTitle: z.string().trim().min(1).max(160),
    seoDescription: z.string().trim().min(1).max(300),
    publishedAt: z.coerce.date().nullable(),
  })
  .partial();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    if (!["owner", "admin", "editor"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const input = guideUpdateSchema.parse(await request.json());
    const existing = await getPrisma().guide.findUniqueOrThrow({
      where: { id },
    });
    const guide = await getPrisma().guide.update({
      where: { id },
      data: {
        ...input,
        publishedAt:
          input.status === "published" && !existing.publishedAt
            ? (input.publishedAt ?? new Date())
            : input.publishedAt,
      },
    });

    return NextResponse.json({ guide });
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
    const admin = await requireAdmin();

    if (!["owner", "admin", "editor"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const guide = await getPrisma().guide.update({
      where: { id },
      data: { status: "archived" },
    });

    return NextResponse.json({ guide });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to archive" },
      { status: 401 },
    );
  }
}
