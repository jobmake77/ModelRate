import { NextResponse } from "next/server";
import { getPublishedRelayStations } from "@/lib/data-access/relays";

export async function GET() {
  const relays = await getPublishedRelayStations();
  return NextResponse.json({ relays });
}
