import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { TrackedOutboundLink } from "@/components/public/tracked-outbound-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getCurrentRelayModelPrices,
  getRelayStationBySlug,
} from "@/lib/data-access/relays";
import { formatDate, formatUsd } from "@/lib/formatters/number";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const relay = await getRelayStationBySlug(slug);

  if (!relay) {
    return { title: "Relay station not found" };
  }

  return {
    title: `${relay.name} 中转站信息`,
    description: `${relay.name} 的支付方式、起充金额、支持模型、风险标签和数据来源。`,
  };
}

export default async function RelayStationDetailPage({ params }: Props) {
  const { slug } = await params;
  const [relay, relayPrices] = await Promise.all([
    getRelayStationBySlug(slug),
    getCurrentRelayModelPrices(slug),
  ]);

  if (!relay) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">{relay.domain}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {relay.name}
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">{relay.description}</p>
          <TrackedOutboundLink
            className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            sourcePath={`/relays/${relay.slug}`}
            targetSlug={relay.slug}
            targetType="relay"
            url={relay.referralUrl ?? relay.websiteUrl}
          >
            访问官网
          </TrackedOutboundLink>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">站点信息</h2>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-4 text-sm">
                <Info label="官网" value={relay.websiteUrl} />
                <Info
                  label="支付方式"
                  value={relay.paymentMethods.join(", ")}
                />
                <Info label="计费方式" value={relay.billingModes.join(", ")} />
                <Info
                  label="起充"
                  value={
                    relay.minimumTopUpAmount
                      ? `${relay.minimumTopUpCurrency} ${relay.minimumTopUpAmount}`
                      : "Unknown"
                  }
                />
                <Info
                  label="支持厂商"
                  value={
                    relay.supportedProviders.length
                      ? relay.supportedProviders.join(", ")
                      : "Unknown"
                  }
                />
                <Info
                  label="Last checked"
                  value={formatDate(relay.lastCheckedAt)}
                />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">风险和商业关系</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone="slate">Risk: {relay.riskLevel}</Badge>
                {relay.isSponsored ? (
                  <Badge tone="amber">Sponsored</Badge>
                ) : null}
                {relay.hasReferralProgram ? (
                  <Badge tone="blue">Referral available</Badge>
                ) : null}
                {relay.isVerified ? <Badge tone="green">Verified</Badge> : null}
              </div>
              <div className="space-y-3">
                {relay.riskTagDetails.map((tag) => (
                  <div
                    key={tag.slug}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="text-sm font-medium">{tag.label}</div>
                    <p className="mt-1 text-sm text-slate-600">
                      {tag.description}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-5 text-slate-500">
                ModelRate
                仅展示公开资料和调研信息，不担保任何中转站的可用性、价格稳定性或数据安全。
              </p>
            </CardBody>
          </Card>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">模型价格和倍率</h2>
            <p className="mt-1 text-sm text-slate-600">
              这里展示当前已维护的中转站模型价格或倍率。价格和倍率可能随服务商调整变化。
            </p>
          </div>
          {relayPrices.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Multiplier</th>
                    <th className="px-4 py-3">Direct price</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Last checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relayPrices.map((price) => (
                    <tr
                      key={`${price.modelSlug}-${price.routeName ?? "default"}`}
                    >
                      <td className="px-4 py-4 font-medium">
                        {price.modelName}
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
                            className="text-blue-700 hover:underline"
                            href={price.sourceUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Source
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {price.lastCheckedAt
                          ? formatDate(price.lastCheckedAt)
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">
              暂无已维护的当前模型价格。使用前请以服务商实际账单为准。
            </div>
          )}
        </section>
      </div>
    </SiteShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
