import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { TokenCostCalculator } from "@/components/calculators/token-cost-calculator";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getLatestUsdCnyRate,
  getModelsWithCurrentPrices,
} from "@/lib/data-access/models";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { webApplicationJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "Token 成本计算器",
  description:
    "输入模型、Token 数和请求次数，估算 AI API 的 USD 和人民币调用成本。",
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
          name: "Token 成本计算器",
          description:
            "输入模型、Token 数和请求次数，估算 AI API 的 USD 和人民币调用成本。",
          path: "/tools/token-cost-calculator",
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">Calculator</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Token 成本计算器
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            选择模型并输入输入/输出 token 数，ModelRate 会按统一的 USD per 1M
            tokens 口径计算单次和总成本。
          </p>
        </div>

        <Card>
          <CardBody>
            <TokenCostCalculator
              models={models}
              exchangeRate={exchangeRate.rate}
            />
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold">计算公式</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              输入成本 = 输入 tokens / 1,000,000 × 每 1M 输入价格；输出成本 =
              输出 tokens / 1,000,000 × 每 1M 输出价格。
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
