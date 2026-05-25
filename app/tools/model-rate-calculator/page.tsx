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
    "选择模型后输入中转站倍率，直接对比基础单价和倍率后的 USD/CNY 单价。",
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
            "选择模型后输入中转站倍率，直接对比基础单价和倍率后的 USD/CNY 单价。",
          path: "/tools/model-rate-calculator",
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Multiplier</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            One-API / New API 倍率计算器
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            不需要手动填写输入/输出价格，也不需要输入 token
            数。选择模型后输入倍率，即可看到每 1M tokens
            的基础单价与倍率后单价。
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
            <h2 className="font-display font-semibold">公式说明</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>基础输入单价 = 模型每 1M 输入价格。</p>
            <p>基础输出单价 = 模型每 1M 输出价格。</p>
            <p>
              倍率后单价 = 基础单价 ×
              倍率。价格仅用于估算，实际账单以模型厂商或中转站为准。
            </p>
          </CardBody>
        </Card>
      </div>
    </SiteShell>
  );
}
