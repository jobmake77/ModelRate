import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Database, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { TokenCostCalculator } from "@/components/calculators/token-cost-calculator";
import { AdSlot } from "@/components/public/ad-slot";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getLatestUsdCnyRate,
  getModelsWithCurrentPrices,
} from "@/lib/data-access/models";
import { getPublishedGuides } from "@/lib/data-access/guides";
import { getPublishedRelayStations } from "@/lib/data-access/relays";
import { formatUsd } from "@/lib/formatters/number";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { itemListJsonLd, webApplicationJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "ModelRate - AI API Cost & Multiplier Calculator",
  description:
    "用统一价格口径计算 AI API Token 成本、One-API 倍率，并浏览模型价格和中转站信息。",
  path: "/",
});

export default async function Home() {
  const [models, exchangeRate, relays, guides] = await Promise.all([
    getModelsWithCurrentPrices(),
    getLatestUsdCnyRate(),
    getPublishedRelayStations(),
    getPublishedGuides(),
  ]);
  const pricedModels = models.filter((model) => model.currentPrice).slice(0, 6);
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 max-w-3xl">
              <p className="mb-3 text-sm font-medium text-blue-700">
                AI API cost transparency
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                模型价格、Token 成本和倍率换算工具
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                ModelRate 用统一的 USD per 1M tokens
                口径展示模型价格，并把调用量、汇率和中转站倍率转换成可比较的成本结果。
              </p>
            </div>
            <TokenCostCalculator
              models={models}
              exchangeRate={exchangeRate.rate}
              compact
            />
          </section>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <h2 className="font-semibold">热门模型价格</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {pricedModels.map((model) => (
                  <div
                    key={model.slug}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <Link
                        href={`/models/${model.slug}`}
                        className="font-medium hover:underline"
                      >
                        {model.displayName}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {model.provider.name}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div>
                        {formatUsd(model.currentPrice!.inputPricePer1M)} / 1M in
                      </div>
                      <div className="text-slate-500">
                        {formatUsd(model.currentPrice!.outputPricePer1M)} / 1M
                        out
                      </div>
                    </div>
                  </div>
                ))}
                <Link
                  className="inline-flex text-sm font-medium text-blue-700 hover:underline"
                  href="/models"
                >
                  查看完整模型价格表
                </Link>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <h2 className="font-semibold">第一阶段范围</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-3 text-sm text-slate-600">
                <p>
                  当前已接入模型价格、成本计算器、倍率计算器和中转站目录的第一版。
                </p>
                <p>推荐链接统计、投稿和广告位会在后续 Sprint 接入。</p>
                <Link
                  className="inline-flex font-medium text-blue-700 hover:underline"
                  href="/relays"
                >
                  查看中转站目录
                </Link>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-amber-600" />
                  <h2 className="font-semibold">倍率计算</h2>
                </div>
              </CardHeader>
              <CardBody>
                <Link
                  className="text-sm font-medium text-blue-700 hover:underline"
                  href="/tools/model-rate-calculator"
                >
                  进入 One-API 倍率计算器
                </Link>
              </CardBody>
            </Card>

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
                      <p className="text-xs text-slate-500">
                        {relay.paymentMethods.join(", ")}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      Risk: {relay.riskLevel}
                    </span>
                  </div>
                ))}
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
                  className="inline-flex text-sm font-medium text-blue-700 hover:underline"
                  href="/guides"
                >
                  查看全部指南
                </Link>
              </CardBody>
            </Card>

            <AdSlot slotKey="home-sidebar" />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
