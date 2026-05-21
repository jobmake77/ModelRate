import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getRelayStationBySlug } from "@/lib/data-access/relays";
import { formatDate } from "@/lib/formatters/number";

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
  const relay = await getRelayStationBySlug(slug);

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
