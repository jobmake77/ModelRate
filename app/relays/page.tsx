import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getPublishedRelayStations } from "@/lib/data-access/relays";
import { formatDate } from "@/lib/formatters/number";

export const metadata: Metadata = {
  title: "AI 中转站目录",
  description:
    "浏览 AI API 中转站候选、支付方式、起充金额、风险标签和数据来源。",
};

export default async function RelayStationsPage() {
  const relays = await getPublishedRelayStations();

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">Relay stations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            AI 中转站目录
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            第一版目录以人工调研和公开资料为基础，重点展示支付方式、起充金额、风险标签和数据来源。ModelRate
            不对任何中转站稳定性作担保。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {relays.map((relay) => (
            <Card key={relay.slug}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/relays/${relay.slug}`}
                      className="text-lg font-semibold hover:underline"
                    >
                      {relay.name}
                    </Link>
                    <p className="text-sm text-slate-500">{relay.domain}</p>
                  </div>
                  <RiskBadge riskLevel={relay.riskLevel} />
                </div>

                <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                  {relay.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {relay.isSponsored ? (
                    <Badge tone="amber">Sponsored</Badge>
                  ) : null}
                  {relay.hasReferralProgram ? (
                    <Badge tone="blue">Referral</Badge>
                  ) : null}
                  {relay.isVerified ? (
                    <Badge tone="green">Verified</Badge>
                  ) : null}
                  {relay.hasPublicPricing ? (
                    <Badge tone="green">Public pricing</Badge>
                  ) : (
                    <Badge tone="amber">Pricing unclear</Badge>
                  )}
                </div>

                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">支付方式</dt>
                    <dd className="text-right">
                      {relay.paymentMethods.join(", ")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">起充</dt>
                    <dd>
                      {relay.minimumTopUpAmount
                        ? `${relay.minimumTopUpCurrency} ${relay.minimumTopUpAmount}`
                        : "Unknown"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Last checked</dt>
                    <dd>{formatDate(relay.lastCheckedAt)}</dd>
                  </div>
                </dl>

                <div className="flex gap-3 text-sm font-medium">
                  <Link
                    className="text-blue-700 hover:underline"
                    href={`/relays/${relay.slug}`}
                  >
                    查看详情
                  </Link>
                  <a
                    className="text-slate-700 hover:underline"
                    href={relay.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    访问官网
                  </a>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}

function RiskBadge({
  riskLevel,
}: {
  riskLevel: "unknown" | "low" | "medium" | "high";
}) {
  const tone =
    riskLevel === "low" ? "green" : riskLevel === "high" ? "amber" : "slate";
  return <Badge tone={tone}>Risk: {riskLevel}</Badge>;
}
