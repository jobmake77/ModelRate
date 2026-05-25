import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { UnifiedCostRateCalculator } from "@/components/calculators/unified-cost-rate-calculator";
import { AdSlot } from "@/components/public/ad-slot";
import { PopularModelGroups } from "@/components/public/popular-model-groups";
import { ChannelBadge } from "@/components/public/relay-channel";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getLatestUsdCnyRate,
  getModelsWithCurrentPrices,
} from "@/lib/data-access/models";
import { getPublishedGuides } from "@/lib/data-access/guides";
import { getPublishedRelayStations } from "@/lib/data-access/relays";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { itemListJsonLd, webApplicationJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "ModelRate - AI API Cost & Multiplier Calculator",
  description:
    "用统一每 1M tokens 价格口径换算 AI API 官方单价、中转站倍率价，并浏览模型价格和中转站信息。",
  path: "/",
});

export default async function Home() {
  const [models, exchangeRate, relays, guides] = await Promise.all([
    getModelsWithCurrentPrices(),
    getLatestUsdCnyRate(),
    getPublishedRelayStations(),
    getPublishedGuides(),
  ]);
  const pricedModels = models
    .filter((model) => model.currentPrice)
    .slice(0, 12);
  const highlightedRelays = relays.slice(0, 3);
  const latestGuides = guides.slice(0, 3);

  return (
    <SiteShell>
      <JsonLd
        data={[
          webApplicationJsonLd({
            name: "ModelRate Token Cost Calculator",
            description:
              "Calculate AI API token costs and compare model pricing by USD per 1M tokens.",
            path: "/tools/token-cost-calculator",
          }),
          itemListJsonLd({
            name: "Featured model prices",
            path: "/models",
            items: pricedModels.map((model) => ({
              name: model.displayName,
              path: `/models/${model.slug}`,
            })),
          }),
        ]}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <section className="rounded-xl border bg-card p-6 shadow-soft md:p-8">
          <div className="mb-6 max-w-3xl">
            <p className="mb-2 text-sm font-medium text-primary">
              AI API cost transparency
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-[34px]">
              模型价格和中转站倍率换算工具
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-[15px]">
              选择模型后自动带出每 1M tokens
              的输入/输出单价，填写中转站倍率即可看到官方基础单价、倍率后单价和
              USD/CNY 换算。
            </p>
          </div>
          <UnifiedCostRateCalculator
            models={models}
            exchangeRate={exchangeRate.rate}
          />
        </section>

        <div className="mt-8">
          <PopularModelGroups models={pricedModels} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">中转站候选</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {highlightedRelays.map((relay) => (
                <div
                  key={relay.slug}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <div>
                    <Link
                      href={`/relays/${relay.slug}`}
                      className="font-medium hover:underline"
                    >
                      {relay.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {relay.paymentMethods.join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ChannelBadge channelType={relay.channelType} />
                    <span className="text-xs text-muted-foreground">
                      Risk: {relay.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
              <Link
                className="inline-flex text-sm font-medium text-primary hover:underline"
                href="/relays"
              >
                查看中转站目录
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">最新指南</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {latestGuides.map((guide) => (
                <Link
                  className="block text-sm font-medium hover:underline"
                  href={`/guides/${guide.slug}`}
                  key={guide.slug}
                >
                  {guide.title}
                </Link>
              ))}
              <Link
                className="inline-flex text-sm font-medium text-primary hover:underline"
                href="/guides"
              >
                查看全部指南
              </Link>
            </CardBody>
          </Card>
        </div>

        <AdSlot slotKey="home-sidebar" />
      </div>
    </SiteShell>
  );
}
