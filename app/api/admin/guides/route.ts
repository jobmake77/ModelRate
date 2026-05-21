import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { slugSchema } from "@/lib/validation/common";

const guideSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  contentMd: z.string().trim().min(1).max(60_000),
  category: z.string().trim().min(1).max(80),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seoTitle: z.string().trim().min(1).max(160),
  seoDescription: z.string().trim().min(1).max(300),
  publishedAt: z.coerce.date().nullable().optional(),
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

    const guides = await getPrisma().guide.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ guides });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
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

    const input = guideSchema.parse(await request.json());
    const guide = await getPrisma().guide.create({
      data: {
        ...input,
        publishedAt:
          input.status === "published"
            ? (input.publishedAt ?? new Date())
            : (input.publishedAt ?? null),
      },
    });

    return NextResponse.json({ guide }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create" },
      { status: 401 },
    );
  }
}
