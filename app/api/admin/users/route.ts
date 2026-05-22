import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthErrorStatus, requireAdminRole } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

const adminUserSchema = z.object({
  authUserId: z.string().trim().max(255).nullable().optional(),
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(160).nullable().optional(),
  role: z.enum(["owner", "admin", "editor", "viewer"]).default("editor"),
  status: z.enum(["active", "disabled"]).default("active"),
});

export async function GET() {
  try {
    await requireAdminRole(["owner"]);

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const users = await getPrisma().adminUser.findMany({
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminRole(["owner"]);

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const input = adminUserSchema.parse(await request.json());
    const user = await getPrisma().adminUser.create({
      data: {
        ...input,
        email: input.email.toLowerCase(),
      },
    });

    return NextResponse.json({ user }, { status: 201 });
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
