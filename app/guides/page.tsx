import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getPublishedGuides } from "@/lib/data-access/guides";
import { formatDate } from "@/lib/formatters/number";

export const metadata: Metadata = {
  title: "AI API 成本与中转站指南",
  description:
    "阅读 AI API Token 成本、One-API 倍率、中转站风险和模型价格数据来源的实用指南。",
};

export default async function GuidesPage() {
  const guides = await getPublishedGuides();

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">Guides</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            AI API 成本与中转站指南
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            用可复核的公式、数据口径和风险清单，帮助开发者在调用模型前先看清成本和服务边界。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <Card key={guide.slug}>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Badge tone="blue">{guide.category}</Badge>
                  <span className="text-sm text-slate-500">
                    Updated {formatDate(guide.updatedAt)}
                  </span>
                </div>
                <div>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-xl font-semibold hover:underline"
                  >
                    {guide.title}
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {guide.description}
                  </p>
                </div>
                <Link
                  className="inline-flex text-sm font-medium text-blue-700 hover:underline"
                  href={`/guides/${guide.slug}`}
                >
                  阅读指南
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
