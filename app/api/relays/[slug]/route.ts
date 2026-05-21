import { NextResponse } from "next/server";
import { getRelayStationBySlug } from "@/lib/data-access/relays";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;
  const relay = await getRelayStationBySlug(slug);

  if (!relay) {
    return NextResponse.json(
      { error: "Relay station not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ relay });
}
