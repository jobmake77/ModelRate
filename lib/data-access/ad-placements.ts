import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { canUseFixtureFallback } from "@/lib/env";

export type AdPlacementPublic = {
  slotKey: string;
  name: string;
  pageType: string;
  position: string;
  provider: string;
  adCode: string | null;
  isEnabled: boolean;
};

const fixturePlacements: AdPlacementPublic[] = [
  {
    slotKey: "home-sidebar",
    name: "Home sidebar",
    pageType: "home",
    position: "sidebar",
    provider: "placeholder",
    adCode: null,
    isEnabled: false,
  },
  {
    slotKey: "models-footer",
    name: "Models footer",
    pageType: "models",
    position: "footer",
    provider: "placeholder",
    adCode: null,
    isEnabled: false,
  },
];

export async function getAdPlacementBySlot(slotKey: string) {
  if (!hasDatabaseUrl) {
    if (!canUseFixtureFallback()) {
      throw new Error("DATABASE_URL is required for production data access.");
    }

    return (
      fixturePlacements.find((placement) => placement.slotKey === slotKey) ??
      null
    );
  }

  try {
    const placement = await getPrisma().adPlacement.findUnique({
      where: { slotKey },
    });

    if (!placement) {
      return null;
    }

    return {
      slotKey: placement.slotKey,
      name: placement.name,
      pageType: placement.pageType,
      position: placement.position,
      provider: placement.provider,
      adCode: placement.adCode,
      isEnabled: placement.isEnabled,
    };
  } catch (error) {
    if (!canUseFixtureFallback()) {
      throw error;
    }

    return (
      fixturePlacements.find((placement) => placement.slotKey === slotKey) ??
      null
    );
  }
}

export async function getAdminAdPlacements(): Promise<AdPlacementPublic[]> {
  if (!hasDatabaseUrl) {
    if (!canUseFixtureFallback()) {
      throw new Error("DATABASE_URL is required for production data access.");
    }

    return fixturePlacements;
  }

  const placements = await getPrisma().adPlacement.findMany({
    orderBy: [{ pageType: "asc" }, { position: "asc" }],
  });

  return placements.map((placement) => ({
    slotKey: placement.slotKey,
    name: placement.name,
    pageType: placement.pageType,
    position: placement.position,
    provider: placement.provider,
    adCode: placement.adCode,
    isEnabled: placement.isEnabled,
  }));
}
