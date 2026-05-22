import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { SubmissionForm } from "@/components/public/submission-form";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicMetadata({
  title: "Contact",
  description:
    "Contact ModelRate for data corrections, relay submissions and partnerships.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-10 leading-7 text-slate-700 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-950">
          Contact
        </h1>
        <div className="space-y-4">
          <p>
            ModelRate
            接收服务商投稿、价格纠错和合作反馈。所有提交都会先进入待审核状态，不会直接修改公开价格或推荐信息。
          </p>
          <p>
            价格纠错请提供模型名称、当前展示价格、正确价格、来源链接和检查时间。
          </p>
        </div>
        <SubmissionForm />
      </article>
    </SiteShell>
  );
}
