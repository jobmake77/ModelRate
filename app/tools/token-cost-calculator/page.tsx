import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { UnifiedCostRateCalculator } from "@/components/calculators/unified-cost-rate-calculator";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getLatestUsdCnyRate,
  getModelsWithCurrentPrices,
} from "@/lib/data-access/models";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { webApplicationJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "模型单价倍率换算器",
  description:
    "选择模型并输入中转站倍率，按每 1M tokens 口径换算 USD 和人民币单价。",
  path: "/tools/token-cost-calculator",
});

export default async function TokenCostCalculatorPage() {
  const [models, exchangeRate] = await Promise.all([
    getModelsWithCurrentPrices(),
    getLatestUsdCnyRate(),
  ]);

  return (
    <SiteShell>
      <JsonLd
        data={webApplicationJsonLd({
          name: "模型单价倍率换算器",
          description:
            "选择模型并输入中转站倍率，按每 1M tokens 口径换算 USD 和人民币单价。",
          path: "/tools/token-cost-calculator",
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Calculator</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            模型单价倍率换算器
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            选择模型并输入中转站倍率，ModelRate 会按统一的 USD per 1M tokens
            口径展示官方基础单价和倍率后的中转站单价。
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
            <h2 className="font-display font-semibold">计算公式</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              本页不再要求输入单次请求 token 数。基础单价直接采用模型每 1M
              输入/输出价格；倍率后单价 = 基础单价 × 中转站倍率。
            </p>
            <p>
              人民币金额使用当前汇率估算。价格仅供规划和比较，实际账单以模型厂商或中转站为准。
            </p>
          </CardBody>
        </Card>
      </div>
    </SiteShell>
  );
}
