import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  calculateModelRate,
  modelRateInputSchema,
} from "@/lib/calculators/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = modelRateInputSchema.parse(body);
    return NextResponse.json({ result: calculateModelRate(input) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate model rate",
      },
      { status: 400 },
    );
  }
}
