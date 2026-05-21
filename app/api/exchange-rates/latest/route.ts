import { NextResponse } from "next/server";
import { getLatestUsdCnyRate } from "@/lib/data-access/models";

export async function GET() {
  const rate = await getLatestUsdCnyRate();
  return NextResponse.json({ rate });
}
