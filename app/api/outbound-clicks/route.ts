import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { getRelayStationBySlug } from "@/lib/data-access/relays";
import {
  checkRateLimit,
  getClientIp,
  hashIp,
  requireJsonRequest,
} from "@/lib/security/request";
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
    if (!requireJsonRequest(request)) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    const input = outboundClickSchema.parse(await request.json());
    const allowed = await isAllowedOutboundTarget(input);

    if (!allowed.ok) {
      return NextResponse.json({ error: allowed.error }, { status: 400 });
    }

    const headerStore = await headers();
    const ipHash = hashIp(getClientIp(headerStore));
    const rateLimit = checkRateLimit({
      key: `outbound:${ipHash ?? "anonymous"}:${input.targetSlug ?? "none"}`,
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many outbound clicks. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
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

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
    return { ok: false, error: "Only relay outbound clicks are supported." };
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
