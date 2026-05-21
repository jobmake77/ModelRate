import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = {
  title: "About",
  description: "About ModelRate and its AI API cost transparency mission.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <TextPage title="About ModelRate">
        <p>
          ModelRate 是一个面向中文 AI API
          用户的成本透明化工具站，目标是把模型价格、Token
          用量、倍率和人民币预算转换成可理解的成本结果。
        </p>
        <p>
          当前版本聚焦模型价格表和 Token
          成本计算。中转站目录、推荐链接、投稿审核和内容系统会在后续 Sprint
          中逐步接入。
        </p>
      </TextPage>
    </SiteShell>
  );
}

function TextPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 leading-7 text-slate-700 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <div className="space-y-4">{children}</div>
    </article>
  );
}
