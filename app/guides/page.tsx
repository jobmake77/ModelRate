import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { GuidesDocViewer } from "@/components/public/guides-doc-viewer";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedGuides } from "@/lib/data-access/guides";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { itemListJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "AI API 成本与中转站指南",
  description:
    "阅读 AI API Token 成本、One-API 倍率、中转站风险和模型价格数据来源的实用指南。",
  path: "/guides",
});

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function GuidesPage({ searchParams }: PageProps) {
  const [guides, params] = await Promise.all([
    getPublishedGuides(),
    searchParams ?? Promise.resolve({} as SearchParams),
  ]);

  return (
    <SiteShell>
      <JsonLd
        data={itemListJsonLd({
          name: "AI API cost guides",
          path: "/guides",
          items: guides.map((guide) => ({
            name: guide.title,
            path: `/guides/${guide.slug}`,
          })),
        })}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Guides</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            AI API 成本与中转站指南
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-[15px]">
            用可复核的公式、数据口径和风险清单，帮助开发者在调用模型前先看清成本和服务边界。
          </p>
        </div>

        <GuidesDocViewer
          guides={guides}
          initialSlug={getSearchParam(params.guide)}
        />
      </div>
    </SiteShell>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
