import { NextResponse } from "next/server";
import { getPublishedGuides } from "@/lib/data-access/guides";

export async function GET() {
  const guides = await getPublishedGuides();

  return NextResponse.json({
    guides: guides.map((guide) => ({
      slug: guide.slug,
      title: guide.title,
      description: guide.description,
      category: guide.category,
      publishedAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
    })),
  });
}
