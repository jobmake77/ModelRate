"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TrackedOutboundLink } from "@/components/public/tracked-outbound-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { RelayStationPublic } from "@/lib/data-access/relays";
import { formatDate } from "@/lib/formatters/number";

type RiskFilter = "all" | "unknown" | "low" | "medium" | "high";
type PricingFilter = "all" | "public" | "unclear";
type SortKey = "name" | "last-checked" | "top-up";

type Props = {
  relays: RelayStationPublic[];
};

export function RelayDirectory({ relays }: Props) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [provider, setProvider] = useState("all");
  const [pricing, setPricing] = useState<PricingFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const hasActiveFilters =
    query.trim() !== "" ||
    risk !== "all" ||
    paymentMethod !== "all" ||
    provider !== "all" ||
    pricing !== "all" ||
    sortKey !== "name";

  const paymentMethods = useMemo(
    () =>
      Array.from(new Set(relays.flatMap((relay) => relay.paymentMethods))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [relays],
  );

  const providers = useMemo(
    () =>
      Array.from(
        new Set(relays.flatMap((relay) => relay.supportedProviders)),
      ).sort((left, right) => left.localeCompare(right)),
    [relays],
  );

  const filteredRelays = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return relays
      .filter((relay) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            relay.name,
            relay.domain,
            relay.description,
            relay.supportedProviders.join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesRisk = risk === "all" || relay.riskLevel === risk;
        const matchesPayment =
          paymentMethod === "all" ||
          relay.paymentMethods.includes(paymentMethod);
        const matchesProvider =
          provider === "all" || relay.supportedProviders.includes(provider);
        const matchesPricing =
          pricing === "all" ||
          (pricing === "public" && relay.hasPublicPricing) ||
          (pricing === "unclear" && !relay.hasPublicPricing);

        return (
          matchesQuery &&
          matchesRisk &&
          matchesPayment &&
          matchesProvider &&
          matchesPricing
        );
      })
      .sort((left, right) => {
        if (sortKey === "last-checked") {
          return (
            new Date(right.lastCheckedAt).getTime() -
            new Date(left.lastCheckedAt).getTime()
          );
        }

        if (sortKey === "top-up") {
          return topUpValue(left) - topUpValue(right);
        }

        return left.name.localeCompare(right.name);
      });
  }, [paymentMethod, pricing, provider, query, relays, risk, sortKey]);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_140px_160px_160px_150px_140px]">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Search</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="OpenRouter, Alipay, Claude..."
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Risk</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={risk}
              onChange={(event) => setRisk(event.target.value as RiskFilter)}
            >
              <option value="all">All risk</option>
              <option value="unknown">Unknown</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Payment</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="all">All payments</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Provider</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              <option value="all">All providers</option>
              {providers.map((providerName) => (
                <option key={providerName} value={providerName}>
                  {providerName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Pricing</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={pricing}
              onChange={(event) =>
                setPricing(event.target.value as PricingFilter)
              }
            >
              <option value="all">All pricing</option>
              <option value="public">Public pricing</option>
              <option value="unclear">Pricing unclear</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Sort by</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="name">Name</option>
              <option value="last-checked">Last checked</option>
              <option value="top-up">Top-up</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing {filteredRelays.length} of {relays.length} relay stations
          </span>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={!hasActiveFilters}
            onClick={() => {
              setQuery("");
              setRisk("all");
              setPaymentMethod("all");
              setProvider("all");
              setPricing("all");
              setSortKey("name");
            }}
            type="button"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRelays.map((relay) => (
          <Card key={relay.slug}>
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    className="text-lg font-semibold hover:underline"
                    href={`/relays/${relay.slug}`}
                  >
                    {relay.name}
                  </Link>
                  <p className="text-sm text-slate-500">{relay.domain}</p>
                </div>
                <RiskBadge riskLevel={relay.riskLevel} />
              </div>

              <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                {relay.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {relay.isSponsored ? (
                  <Badge tone="amber">Sponsored</Badge>
                ) : null}
                {relay.hasReferralProgram ? (
                  <Badge tone="blue">Referral</Badge>
                ) : null}
                {relay.isVerified ? <Badge tone="green">Verified</Badge> : null}
                {relay.hasPublicPricing ? (
                  <Badge tone="green">Public pricing</Badge>
                ) : (
                  <Badge tone="amber">Pricing unclear</Badge>
                )}
              </div>

              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">支付方式</dt>
                  <dd className="text-right">
                    {relay.paymentMethods.join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">起充</dt>
                  <dd>
                    {relay.minimumTopUpAmount
                      ? `${relay.minimumTopUpCurrency} ${relay.minimumTopUpAmount}`
                      : "Unknown"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">模型厂商</dt>
                  <dd className="text-right">
                    {relay.supportedProviders.length
                      ? relay.supportedProviders.join(", ")
                      : "Unknown"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Last checked</dt>
                  <dd>{formatDate(relay.lastCheckedAt)}</dd>
                </div>
              </dl>

              <div className="flex gap-3 text-sm font-medium">
                <Link
                  className="text-blue-700 hover:underline"
                  href={`/relays/${relay.slug}`}
                >
                  查看详情
                </Link>
                <TrackedOutboundLink
                  className="text-slate-700 hover:underline"
                  sourcePath="/relays"
                  targetSlug={relay.slug}
                  targetType="relay"
                  url={relay.websiteUrl}
                >
                  访问官网
                </TrackedOutboundLink>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {!filteredRelays.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
          No relay stations match the current filters.
        </div>
      ) : null}
    </div>
  );
}

function RiskBadge({
  riskLevel,
}: {
  riskLevel: "unknown" | "low" | "medium" | "high";
}) {
  const tone =
    riskLevel === "low" ? "green" : riskLevel === "high" ? "amber" : "slate";
  return <Badge tone={tone}>Risk: {riskLevel}</Badge>;
}

function topUpValue(relay: RelayStationPublic) {
  if (relay.minimumTopUpAmount === null) {
    return Number.POSITIVE_INFINITY;
  }

  return relay.minimumTopUpAmount;
}
