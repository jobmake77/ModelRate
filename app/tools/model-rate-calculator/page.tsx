import type { Metadata } from "next";
import { ModelRateCalculator } from "@/components/calculators/model-rate-calculator";
import { SiteShell } from "@/components/layout/site-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { webApplicationJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "One-API 倍率计算器",
  description:
    "将模型输入和输出价格换算为 One-API / New API 的模型倍率、补全倍率、分组倍率和线路倍率。",
  path: "/tools/model-rate-calculator",
});

export default function ModelRateCalculatorPage() {
  return (
    <SiteShell>
      <JsonLd
        data={webApplicationJsonLd({
          name: "One-API 倍率计算器",
          description:
            "将模型输入和输出价格换算为 One-API / New API 的模型倍率、补全倍率、分组倍率和线路倍率。",
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
            输入官方或中转站模型价格，按默认 1x = USD 2 / 1M input tokens
            的口径计算模型倍率和补全倍率。
          </p>
        </div>

        <Card>
          <CardBody>
            <ModelRateCalculator />
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold">公式说明</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              模型倍率 = 输入价格 / 基准价格。默认基准价格为 USD 2 / 1M tokens。
            </p>
            <p>
              补全倍率 = 输出价格 / 输入价格。输出 token
              通常更贵，因此补全倍率常大于 1。
            </p>
            <p>
              最终输入价格 = 基准价格 × 模型倍率 × 分组倍率 ×
              线路倍率。最终输出价格再乘以补全倍率。
            </p>
          </CardBody>
        </Card>
      </div>
    </SiteShell>
  );
}
