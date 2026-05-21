import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { urlSchema } from "@/lib/validation/common";

const submissionSchema = z.object({
  type: z.enum([
    "relay_submission",
    "price_correction",
    "model_correction",
    "general_feedback",
  ]),
  submitterName: z.string().trim().max(120).optional(),
  submitterEmail: z.string().trim().email().max(255).optional(),
  payload: z.object({
    subject: z.string().trim().min(3).max(160),
    message: z.string().trim().min(10).max(4000),
    sourceUrl: urlSchema.optional(),
    modelName: z.string().trim().max(160).optional(),
    relayName: z.string().trim().max(160).optional(),
    displayedPrice: z.string().trim().max(120).optional(),
    correctedPrice: z.string().trim().max(120).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const input = submissionSchema.parse(await request.json());

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        {
          accepted: true,
          persisted: false,
          status: "pending",
          message: "Database is not configured; submission was validated only.",
        },
        { status: 202 },
      );
    }

    const submission = await getPrisma().submission.create({
      data: {
        type: input.type,
        status: "pending",
        submitterName: normalizeOptional(input.submitterName),
        submitterEmail: normalizeOptional(input.submitterEmail),
        payload: input.payload,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create submission" },
      { status: 500 },
    );
  }
}

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
