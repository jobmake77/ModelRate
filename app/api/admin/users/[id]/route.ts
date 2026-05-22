import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthErrorStatus, requireAdminRole } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

const adminUserUpdateSchema = z
  .object({
    authUserId: z.string().trim().max(255).nullable(),
    name: z.string().trim().max(160).nullable(),
    role: z.enum(["owner", "admin", "editor", "viewer"]),
    status: z.enum(["active", "disabled"]),
  })
  .partial();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRole(["owner"]);

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const input = adminUserUpdateSchema.parse(await request.json());
    const prisma = getPrisma();
    const existing = await prisma.adminUser.findUniqueOrThrow({
      where: { id },
    });
    const nextRole = input.role ?? existing.role;
    const nextStatus = input.status ?? existing.status;

    if (
      existing.role === "owner" &&
      existing.status === "active" &&
      (nextRole !== "owner" || nextStatus !== "active")
    ) {
      const otherOwners = await prisma.adminUser.count({
        where: {
          id: { not: id },
          role: "owner",
          status: "active",
        },
      });

      if (otherOwners === 0) {
        return NextResponse.json(
          { error: "At least one active owner is required." },
          { status: 409 },
        );
      }
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: input,
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}
