import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicMetadata({
  title: "Disclaimer",
  description: "ModelRate pricing and relay station disclaimer.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-10 leading-7 text-slate-700 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-950">
          Disclaimer
        </h1>
        <div className="space-y-4">
          <p>
            所有价格和倍率结果仅用于估算和比较，实际账单以官方模型厂商或中转站服务商为准。
          </p>
          <p>
            中转站存在稳定性、隐私、价格变动和服务中断风险。建议用户小额测试并避免处理敏感数据。
          </p>
          <p>
            Sponsored、Referral 或 Verified 标识必须明确展示，不能被理解为
            ModelRate 对服务商稳定性的担保。
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
