import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { SubmissionForm } from "@/components/public/submission-form";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicMetadata({
  title: "中转站收录申请",
  description:
    "提交 AI API 中转站官网、支付方式、起充金额、支持模型和价格说明。",
  path: "/relays/submit",
});

export default function RelaySubmitPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <Link className="text-sm font-medium text-primary" href="/relays">
            ← 返回中转站目录
          </Link>
          <p className="mt-5 text-sm font-medium text-primary">Relay listing</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            中转站收录申请
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-[15px]">
            请提交官网、支付方式、起充金额、支持模型厂商和价格说明。提交后进入后台
            pending 队列，人工确认公开信息、风险标签和商业关系后才会展示。
          </p>
        </div>

        <SubmissionForm
          defaultType="relay_submission"
          description="收录申请不会自动发布。请尽量提供公开来源链接，便于核验价格和站点信息。"
          relayMode
          title="填写收录信息"
        />
      </div>
    </SiteShell>
  );
}
