import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getModelBySlug } from "@/lib/data-access/models";
import { getCurrentRelayPricesForModel } from "@/lib/data-access/relays";
import { formatDate, formatNumber, formatUsd } from "@/lib/formatters/number";
import {
  formatPriceSourceName,
  getPriceSourceNotice,
} from "@/lib/formatters/source";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { softwareApplicationJsonLd } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);

  if (!model) {
    return { title: "Model not found" };
  }

  return createPublicMetadata({
    title: `${model.displayName} 价格`,
    description: `${model.displayName} API 输入和输出价格、上下文长度、能力标签和数据来源。`,
    path: `/models/${model.slug}`,
  });
}

export default async function ModelDetailPage({ params }: Props) {
  const { slug } = await params;
  const [model, relayPrices] = await Promise.all([
    getModelBySlug(slug),
    getCurrentRelayPricesForModel(slug),
  ]);

  if (!model) {
    notFound();
  }

  return (
    <SiteShell>
      <JsonLd
        data={softwareApplicationJsonLd({
          name: model.displayName,
          description: model.description,
          path: `/models/${model.slug}`,
        })}
      />
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
                        {formatPriceSourceName(model.currentPrice)}
                      </a>
                      {getPriceSourceNotice(model.currentPrice) ? (
                        <p className="mt-1 max-w-xs text-xs leading-5 text-amber-700">
                          {getPriceSourceNotice(model.currentPrice)}
                        </p>
                      ) : null}
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

        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">中转站价格和倍率</h2>
            <p className="mt-1 text-sm text-slate-600">
              当前已维护的中转站价格或倍率。推荐、赞助和风险标签不代表官方背书。
            </p>
          </div>
          {relayPrices.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Relay</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Multiplier</th>
                    <th className="px-4 py-3">Direct price</th>
                    <th className="px-4 py-3">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relayPrices.map((price) => (
                    <tr
                      className="align-top"
                      key={`${price.relaySlug}-${price.routeName ?? "default"}`}
                    >
                      <td className="px-4 py-4">
                        <a
                          className="font-medium text-slate-950 hover:underline"
                          href={`/relays/${price.relaySlug}`}
                        >
                          {price.relayName}
                        </a>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge tone="amber">
                            Risk: {price.relayRiskLevel}
                          </Badge>
                          {price.relayIsSponsored ? (
                            <Badge tone="amber">Sponsored</Badge>
                          ) : null}
                          {price.relayHasReferralProgram ? (
                            <Badge tone="blue">Referral</Badge>
                          ) : null}
                          {price.relayIsVerified ? (
                            <Badge tone="green">Verified</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {price.routeName ?? "default"}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          Model:{" "}
                          {price.modelMultiplier === null
                            ? "N/A"
                            : `${price.modelMultiplier}x`}
                        </div>
                        <div className="text-slate-500">
                          Completion:{" "}
                          {price.completionMultiplier === null
                            ? "N/A"
                            : `${price.completionMultiplier}x`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          In:{" "}
                          {price.inputPricePer1M === null
                            ? "N/A"
                            : `${formatUsd(price.inputPricePer1M)} / 1M`}
                        </div>
                        <div className="text-slate-500">
                          Out:{" "}
                          {price.outputPricePer1M === null
                            ? "N/A"
                            : `${formatUsd(price.outputPricePer1M)} / 1M`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {price.sourceUrl ? (
                          <a
                            className="font-medium text-blue-700 hover:underline"
                            href={price.sourceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Source
                          </a>
                        ) : (
                          <span className="text-slate-500">No source</span>
                        )}
                        <div className="mt-1 text-xs text-slate-500">
                          Checked{" "}
                          {price.lastCheckedAt
                            ? formatDate(price.lastCheckedAt)
                            : "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">
              暂无已维护的中转站价格或倍率。
            </div>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
