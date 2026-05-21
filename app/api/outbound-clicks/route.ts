import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { getRelayStationBySlug } from "@/lib/data-access/relays";
import { urlSchema } from "@/lib/validation/common";

const outboundClickSchema = z.object({
  targetType: z.enum(["relay", "guide", "model", "external"]),
  targetSlug: z.string().trim().max(160).optional(),
  url: urlSchema,
  sourcePath: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const input = outboundClickSchema.parse(await request.json());
    const allowed = await isAllowedOutboundTarget(input);

    if (!allowed.ok) {
      return NextResponse.json({ error: allowed.error }, { status: 400 });
    }

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        {
          recorded: false,
          validated: true,
          message: "Database is not configured; click was validated only.",
        },
        { status: 202 },
      );
    }

    const headerStore = await headers();
    const ipHash = hashIp(
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headerStore.get("x-real-ip") ??
        "",
    );

    await getPrisma().outboundClick.create({
      data: {
        targetType: input.targetType,
        targetId: allowed.targetId,
        url: input.url,
        sourcePath: input.sourcePath,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        ipHash,
        userAgent: headerStore.get("user-agent"),
        referer: headerStore.get("referer"),
      },
    });

    return NextResponse.json({ recorded: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to record outbound click" },
      { status: 500 },
    );
  }
}

async function isAllowedOutboundTarget(input: {
  targetType: "relay" | "guide" | "model" | "external";
  targetSlug?: string;
  url: string;
}): Promise<{ ok: true; targetId?: string } | { ok: false; error: string }> {
  if (input.targetType !== "relay") {
    return { ok: true };
  }

  if (!input.targetSlug) {
    return { ok: false, error: "targetSlug is required for relay clicks." };
  }

  const relay = await getRelayStationBySlug(input.targetSlug);

  if (!relay) {
    return { ok: false, error: "Relay target is not published." };
  }

  const allowedUrls = [relay.websiteUrl, relay.referralUrl].filter(Boolean);

  if (!allowedUrls.includes(input.url)) {
    return { ok: false, error: "URL does not match the relay target." };
  }

  return { ok: true };
}

function hashIp(ip: string) {
  if (!ip) {
    return null;
  }

  return createHash("sha256")
    .update(`${process.env.CLICK_HASH_SALT ?? "modelrate-local"}:${ip}`)
    .digest("hex");
}
