import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  calculateTokenCost,
  tokenCostInputSchema,
} from "@/lib/calculators/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = tokenCostInputSchema.parse(body);
    return NextResponse.json({ result: calculateTokenCost(input) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to calculate token cost" },
      { status: 400 },
    );
  }
}
