import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { guides, type GuideFixture } from "@/lib/fixtures/guide-data";

export type GuidePublic = GuideFixture;

export type AdminGuideRow = GuidePublic & {
  id: string;
  status: "draft" | "published" | "archived";
};

export async function getPublishedGuides(): Promise<GuidePublic[]> {
  if (!hasDatabaseUrl) {
    return guides;
  }

  try {
    const prisma = getPrisma();
    const rows = await prisma.guide.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    });

    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      contentMd: row.contentMd,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      publishedAt:
        row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  } catch {
    return guides;
  }
}

export async function getGuideBySlug(slug: string) {
  const publishedGuides = await getPublishedGuides();
  return publishedGuides.find((guide) => guide.slug === slug) ?? null;
}

export async function getAdminGuides(): Promise<AdminGuideRow[]> {
  if (!hasDatabaseUrl) {
    return guides.map((guide) => ({
      ...guide,
      id: guide.slug,
      status: "published",
    }));
  }

  try {
    const rows = await getPrisma().guide.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      contentMd: row.contentMd,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      status: row.status,
      publishedAt:
        row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  } catch {
    return guides.map((guide) => ({
      ...guide,
      id: guide.slug,
      status: "published",
    }));
  }
}
