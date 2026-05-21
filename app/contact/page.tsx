import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ModelRate for data corrections, relay submissions and partnerships.",
};

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
            后续会提供服务商投稿、价格纠错和合作入口。当前阶段可以先通过仓库
            issue 或项目维护者渠道提交反馈。
          </p>
          <p>
            价格纠错请提供模型名称、当前展示价格、正确价格、来源链接和检查时间。
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
