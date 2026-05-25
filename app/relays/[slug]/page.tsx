import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import {
  ChannelBadge,
  formatChannelType,
} from "@/components/public/relay-channel";
import { TrackedOutboundLink } from "@/components/public/tracked-outbound-link";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getCurrentRelayModelPrices,
  getRelayStationBySlug,
} from "@/lib/data-access/relays";
import { formatDate, formatUsd } from "@/lib/formatters/number";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { organizationPageJsonLd } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const relay = await getRelayStationBySlug(slug);

  if (!relay) {
    return { title: "Relay station not found" };
  }

  return createPublicMetadata({
    title: `${relay.name} 中转站信息`,
    description: `${relay.name} 的支付方式、起充金额、支持模型、风险标签和数据来源。`,
    path: `/relays/${relay.slug}`,
  });
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
      <JsonLd
        data={organizationPageJsonLd({
          name: relay.name,
          description: relay.description,
          path: `/relays/${relay.slug}`,
          websiteUrl: relay.websiteUrl,
        })}
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">{relay.domain}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {relay.name}
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {relay.description}
          </p>
          <TrackedOutboundLink
            className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
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
                  label="入口类型"
                  value={formatChannelType(relay.channelType)}
                />
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
                <ChannelBadge channelType={relay.channelType} />
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
                    className="rounded-md border border-border p-3"
                  >
                    <div className="text-sm font-medium">{tag.label}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tag.description}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {relay.channelType === "official_direct"
                  ? "官方直连表示该入口由模型厂商官方提供，不代表 ModelRate 与该厂商存在商业合作。"
                  : "二次中转表示该入口由第三方聚合、路由或代理服务提供，使用前需要自行核对价格和数据安全。"}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                ModelRate
                仅展示公开资料和调研信息，不担保任何中转站的可用性、价格稳定性或数据安全。
              </p>
            </CardBody>
          </Card>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display font-semibold">模型价格和倍率</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              这里展示当前已维护的中转站模型价格或倍率。价格和倍率可能随服务商调整变化。
            </p>
          </div>
          {relayPrices.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Multiplier</th>
                    <th className="px-4 py-3">Direct price</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Last checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {relayPrices.map((price) => (
                    <tr
                      key={`${price.modelSlug}-${price.routeName ?? "default"}`}
                    >
                      <td className="px-4 py-4 font-medium text-foreground">
                        {price.modelName}
                      </td>
                      <td className="px-4 py-4">
                        {price.routeName ?? "default"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono">
                          Model:{" "}
                          {price.modelMultiplier === null
                            ? "N/A"
                            : `${price.modelMultiplier}x`}
                        </div>
                        <div className="font-mono text-muted-foreground">
                          Completion:{" "}
                          {price.completionMultiplier === null
                            ? "N/A"
                            : `${price.completionMultiplier}x`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono">
                          In:{" "}
                          {price.inputPricePer1M === null
                            ? "N/A"
                            : `${formatUsd(price.inputPricePer1M)} / 1M`}
                        </div>
                        <div className="font-mono text-muted-foreground">
                          Out:{" "}
                          {price.outputPricePer1M === null
                            ? "N/A"
                            : `${formatUsd(price.outputPricePer1M)} / 1M`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {price.sourceUrl ? (
                          <a
                            className="text-primary hover:underline"
                            href={price.sourceUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Source
                          </a>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
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
            <div className="p-5 text-sm text-muted-foreground">
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
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
