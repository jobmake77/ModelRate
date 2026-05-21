import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ModelRate privacy policy for analytics, cookies and future affiliate tracking.",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-10 leading-7 text-slate-700 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-950">
          Privacy Policy
        </h1>
        <div className="space-y-4">
          <p>
            ModelRate 当前不要求普通用户注册，也不保存用户 API Key 或充值信息。
          </p>
          <p>
            后续接入 analytics、AdSense 或 affiliate click tracking
            时，会在本页面说明 cookies、事件统计和推荐链接记录方式。
          </p>
          <p>
            推荐链接点击统计不得保存明文
            IP，只能保存匿名事件或哈希后的基础反作弊字段。
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
