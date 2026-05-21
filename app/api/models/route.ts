import { NextResponse } from "next/server";
import { getModelsWithCurrentPrices } from "@/lib/data-access/models";

export async function GET() {
  const models = await getModelsWithCurrentPrices();
  return NextResponse.json({ models });
}
