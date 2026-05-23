import type { Metadata } from "next";
import { UnifiedCostRateCalculator } from "@/components/calculators/unified-cost-rate-calculator";
import { SiteShell } from "@/components/layout/site-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getLatestUsdCnyRate,
  getModelsWithCurrentPrices,
} from "@/lib/data-access/models";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { webApplicationJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "One-API 倍率计算器",
  description:
    "选择模型后输入倍率，直接对比基础 Token 成本和倍率后的 USD/CNY 成本。",
  path: "/tools/model-rate-calculator",
});

export default async function ModelRateCalculatorPage() {
  const [models, exchangeRate] = await Promise.all([
    getModelsWithCurrentPrices(),
    getLatestUsdCnyRate(),
  ]);

  return (
    <SiteShell>
      <JsonLd
        data={webApplicationJsonLd({
          name: "One-API 倍率计算器",
          description:
            "选择模型后输入倍率，直接对比基础 Token 成本和倍率后的 USD/CNY 成本。",
          path: "/tools/model-rate-calculator",
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-amber-700">Multiplier</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            One-API / New API 倍率计算器
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            不需要手动填写输入/输出价格。选择模型后输入 token
            和倍率，即可看到基础成本与倍率后成本。
          </p>
        </div>

        <Card>
          <CardBody>
            <UnifiedCostRateCalculator
              models={models}
              exchangeRate={exchangeRate.rate}
            />
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold">公式说明</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm leading-6 text-slate-600">
            <p>基础输入成本 = 输入 tokens / 1,000,000 × 模型每 1M 输入价格。</p>
            <p>基础输出成本 = 输出 tokens / 1,000,000 × 模型每 1M 输出价格。</p>
            <p>
              倍率后成本 = 基础成本 ×
              倍率。价格仅用于估算，实际账单以模型厂商或中转站为准。
            </p>
          </CardBody>
        </Card>
      </div>
    </SiteShell>
  );
}
