import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getModelBySlug } from "@/lib/data-access/models";
import { formatDate, formatNumber, formatUsd } from "@/lib/formatters/number";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);

  if (!model) {
    return { title: "Model not found" };
  }

  return {
    title: `${model.displayName} 价格`,
    description: `${model.displayName} API 输入和输出价格、上下文长度、能力标签和数据来源。`,
  };
}

export default async function ModelDetailPage({ params }: Props) {
  const { slug } = await params;
  const model = await getModelBySlug(slug);

  if (!model) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">
            {model.provider.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {model.displayName}
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">{model.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">价格</h2>
            </CardHeader>
            <CardBody>
              {model.currentPrice ? (
                <dl className="grid gap-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Input / 1M</dt>
                    <dd className="font-semibold">
                      {formatUsd(model.currentPrice.inputPricePer1M)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Output / 1M</dt>
                    <dd className="font-semibold">
                      {formatUsd(model.currentPrice.outputPricePer1M)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Source</dt>
                    <dd>
                      <a
                        className="text-blue-700 hover:underline"
                        href={model.currentPrice.sourceUrl}
                      >
                        {model.currentPrice.sourceName}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Last checked</dt>
                    <dd>{formatDate(model.currentPrice.lastCheckedAt)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-600">暂无当前价格。</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">模型能力</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <dl className="grid gap-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Context window</dt>
                  <dd className="font-semibold">
                    {formatNumber(model.contextWindow)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Max output</dt>
                  <dd className="font-semibold">
                    {formatNumber(model.maxOutputTokens)}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                {model.supportsVision ? (
                  <Badge tone="blue">Vision</Badge>
                ) : null}
                {model.supportsReasoning ? (
                  <Badge tone="amber">Reasoning</Badge>
                ) : null}
                {model.supportsFunctionCalling ? (
                  <Badge tone="green">Function calling</Badge>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
