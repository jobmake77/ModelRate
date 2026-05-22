import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthErrorStatus, requireAdminRole } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRole(["owner", "admin"]);

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const input = reviewSchema.parse(await request.json());
    const prisma = getPrisma();
    const updateResult = await prisma.submission.updateMany({
      where: {
        id,
        status: "pending",
      },
      data: {
        status: input.status,
        reviewNotes: input.reviewNotes,
        reviewedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: "Submission is not pending or does not exist." },
        { status: 409 },
      );
    }

    const submission = await prisma.submission.findUniqueOrThrow({
      where: { id },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to review" },
      { status: getAdminAuthErrorStatus(error) },
    );
  }
}
