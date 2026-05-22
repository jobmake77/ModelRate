import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicMetadata({
  title: "Terms",
  description: "ModelRate terms of use.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-10 leading-7 text-slate-700 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-950">
          Terms
        </h1>
        <div className="space-y-4">
          <p>
            ModelRate 提供价格估算、倍率换算和信息展示，不提供 API
            代售、充值或托管服务。
          </p>
          <p>
            用户在使用任何模型服务商或中转站前，应自行核实实际价格、服务条款和数据安全风险。
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
