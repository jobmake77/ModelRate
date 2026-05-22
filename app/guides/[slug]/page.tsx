import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
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
      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link className="text-sm font-medium text-blue-700" href="/guides">
            ← 返回指南列表
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Badge tone="blue">{guide.category}</Badge>
            <span className="text-sm text-slate-500">
              Updated {formatDate(guide.updatedAt)}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            {guide.description}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <MarkdownText content={guide.contentMd} />
        </div>

        <section className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-lg font-semibold">相关工具</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              className="rounded-md bg-white px-3 py-2 text-blue-700 shadow-sm hover:underline"
              href="/tools/token-cost-calculator"
            >
              Token 成本计算器
            </Link>
            <Link
              className="rounded-md bg-white px-3 py-2 text-blue-700 shadow-sm hover:underline"
              href="/tools/model-rate-calculator"
            >
              倍率计算器
            </Link>
            <Link
              className="rounded-md bg-white px-3 py-2 text-blue-700 shadow-sm hover:underline"
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

function MarkdownText({ content }: { content: string }) {
  return (
    <div className="space-y-4 leading-7 text-slate-700">
      {content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          if (line.startsWith("# ")) {
            return null;
          }

          if (line.startsWith("## ")) {
            return (
              <h3
                className="pt-4 text-xl font-semibold text-slate-950"
                key={`${line}-${index}`}
              >
                {line.replace(/^## /, "")}
              </h3>
            );
          }

          if (line.startsWith("- ")) {
            return (
              <p className="pl-4" key={`${line}-${index}`}>
                • {line.replace(/^- /, "")}
              </p>
            );
          }

          return <p key={`${line}-${index}`}>{line}</p>;
        })}
    </div>
  );
}
