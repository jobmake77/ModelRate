import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import {
  checkRateLimit,
  getClientIp,
  hashIp,
  requireJsonRequest,
} from "@/lib/security/request";
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
  companyWebsite: z.string().trim().max(500).optional(),
  payload: z.object({
    subject: z.string().trim().min(3).max(160),
    message: z.string().trim().min(10).max(4000),
    sourceUrl: urlSchema.optional(),
    modelName: z.string().trim().max(160).optional(),
    relayName: z.string().trim().max(160).optional(),
    paymentMethods: z.string().trim().max(500).optional(),
    minimumTopUp: z.string().trim().max(120).optional(),
    supportedProviders: z.string().trim().max(500).optional(),
    pricingNotes: z.string().trim().max(1000).optional(),
    displayedPrice: z.string().trim().max(120).optional(),
    correctedPrice: z.string().trim().max(120).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    if (!requireJsonRequest(request)) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    const headerStore = await headers();
    const ipHash = hashIp(getClientIp(headerStore)) ?? "anonymous";
    const rateLimit = checkRateLimit({
      key: `submission:${ipHash}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const input = submissionSchema.parse(await request.json());

    if (input.companyWebsite?.trim()) {
      return NextResponse.json(
        {
          accepted: true,
          persisted: false,
          status: "pending",
        },
        { status: 202 },
      );
    }

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

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
