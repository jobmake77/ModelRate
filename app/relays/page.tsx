import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { RelayDirectory } from "@/components/public/relay-directory";
import { getPublishedRelayStations } from "@/lib/data-access/relays";

export const metadata: Metadata = {
  title: "AI 中转站目录",
  description:
    "浏览 AI API 中转站候选、支付方式、起充金额、风险标签和数据来源。",
};

export default async function RelayStationsPage() {
  const relays = await getPublishedRelayStations();

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">Relay stations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            AI 中转站目录
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            第一版目录以人工调研和公开资料为基础，重点展示支付方式、起充金额、风险标签和数据来源。ModelRate
            不对任何中转站稳定性作担保。
          </p>
        </div>

        <RelayDirectory relays={relays} />
      </div>
    </SiteShell>
  );
}
