import type { Metadata } from "next";
import Link from "next/link";
import { MailPlus } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { RelayDirectory } from "@/components/public/relay-directory";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedRelayStations } from "@/lib/data-access/relays";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { itemListJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPublicMetadata({
  title: "AI 中转站目录",
  description:
    "浏览 AI API 中转站候选、支付方式、起充金额、风险标签和数据来源。",
  path: "/relays",
});

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function RelayStationsPage({ searchParams }: PageProps) {
  const [relays, params] = await Promise.all([
    getPublishedRelayStations(),
    searchParams ?? Promise.resolve({} as SearchParams),
  ]);

  return (
    <SiteShell>
      <JsonLd
        data={itemListJsonLd({
          name: "AI API relay stations",
          path: "/relays",
          items: relays.map((relay) => ({
            name: relay.name,
            path: `/relays/${relay.slug}`,
          })),
        })}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Relay stations</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              AI 中转站目录
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-[15px]">
              第一版目录以人工调研和公开资料为基础，重点展示支付方式、起充金额、风险标签和数据来源。ModelRate
              不对任何中转站稳定性作担保。
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
            href="/relays/submit"
          >
            <MailPlus className="h-4 w-4" />
            中转站收录
          </Link>
        </div>

        <RelayDirectory
          initialFilters={{
            paymentMethod: getSearchParam(params.payment),
            channel: getSearchParam(params.channel),
            pricing: getSearchParam(params.pricing),
            provider: getSearchParam(params.provider),
            query: getSearchParam(params.q),
            relationship: getSearchParam(params.relationship),
            risk: getSearchParam(params.risk),
            sortKey: getSearchParam(params.sort),
            topUp: getSearchParam(params.topUp),
          }}
          relays={relays}
        />
      </div>
    </SiteShell>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
