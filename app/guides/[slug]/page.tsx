import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { MarkdownText } from "@/components/public/markdown-text";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { getGuideBySlug, getPublishedGuides } from "@/lib/data-access/guides";
import { formatDate } from "@/lib/formatters/number";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    return {};
  }

  return createPublicMetadata({
    title: guide.seoTitle,
    description: guide.seoDescription,
    path: `/guides/${guide.slug}`,
  });
}

export async function generateStaticParams() {
  const guides = await getPublishedGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  return (
    <SiteShell>
      <JsonLd
        data={[
          articleJsonLd({
            title: guide.title,
            description: guide.description,
            dateModified: guide.updatedAt,
            path: `/guides/${guide.slug}`,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
        ]}
      />
      <article className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
        <div className="mb-8">
          <Link className="text-sm font-medium text-primary" href="/guides">
            ← 返回指南列表
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Badge tone="blue">{guide.category}</Badge>
            <span className="text-sm text-muted-foreground">
              Updated {formatDate(guide.updatedAt)}
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {guide.description}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <MarkdownText content={guide.contentMd} />
        </div>

        <section className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h2 className="font-display text-lg font-semibold">相关工具</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              className="rounded-md border border-border bg-card px-3 py-2 text-primary hover:bg-secondary/60"
              href="/tools/token-cost-calculator"
            >
              Token 成本计算器
            </Link>
            <Link
              className="rounded-md border border-border bg-card px-3 py-2 text-primary hover:bg-secondary/60"
              href="/tools/model-rate-calculator"
            >
              倍率计算器
            </Link>
            <Link
              className="rounded-md border border-border bg-card px-3 py-2 text-primary hover:bg-secondary/60"
              href="/models"
            >
              模型价格表
            </Link>
          </div>
        </section>
      </article>
    </SiteShell>
  );
}
