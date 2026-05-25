"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  Tags,
  Wallet,
} from "lucide-react";
import { ProviderAvatar } from "@/components/public/provider-avatar";
import { ChannelBadge } from "@/components/public/relay-channel";
import { TrackedOutboundLink } from "@/components/public/tracked-outbound-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { RelayStationPublic } from "@/lib/data-access/relays";
import { formatDate } from "@/lib/formatters/number";

type RiskFilter = "all" | "unknown" | "low" | "medium" | "high";
type PricingFilter = "all" | "public" | "unclear";
type RelationshipFilter = "all" | "sponsored" | "referral" | "verified";
type ChannelFilter = "all" | "official_direct" | "third_party_relay";
type SortKey = "name" | "last-checked" | "top-up";
type TopUpFilter = "all" | "low" | "known";

type Props = {
  initialFilters?: {
    paymentMethod: string;
    channel: string;
    pricing: string;
    provider: string;
    query: string;
    relationship: string;
    risk: string;
    sortKey: string;
    topUp: string;
  };
  relays: RelayStationPublic[];
};

export function RelayDirectory({ initialFilters, relays }: Props) {
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

  const [query, setQuery] = useState(initialFilters?.query ?? "");
  const [risk, setRisk] = useState<RiskFilter>(
    normalizeRiskFilter(initialFilters?.risk),
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialFilters?.paymentMethod &&
      paymentMethods.includes(initialFilters.paymentMethod)
      ? initialFilters.paymentMethod
      : "all",
  );
  const [provider, setProvider] = useState(
    initialFilters?.provider && providers.includes(initialFilters.provider)
      ? initialFilters.provider
      : "all",
  );
  const [pricing, setPricing] = useState<PricingFilter>(
    normalizePricingFilter(initialFilters?.pricing),
  );
  const [channel, setChannel] = useState<ChannelFilter>(
    normalizeChannelFilter(initialFilters?.channel),
  );
  const [relationship, setRelationship] = useState<RelationshipFilter>(
    normalizeRelationshipFilter(initialFilters?.relationship),
  );
  const [sortKey, setSortKey] = useState<SortKey>(
    normalizeRelaySortKey(initialFilters?.sortKey),
  );
  const [topUp, setTopUp] = useState<TopUpFilter>(
    normalizeTopUpFilter(initialFilters?.topUp),
  );
  const hasActiveFilters =
    query.trim() !== "" ||
    risk !== "all" ||
    paymentMethod !== "all" ||
    provider !== "all" ||
    pricing !== "all" ||
    channel !== "all" ||
    relationship !== "all" ||
    sortKey !== "name" ||
    topUp !== "all";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQueryParam(params, "q", query.trim());
    setQueryParam(params, "risk", risk === "all" ? "" : risk);
    setQueryParam(
      params,
      "payment",
      paymentMethod === "all" ? "" : paymentMethod,
    );
    setQueryParam(params, "provider", provider === "all" ? "" : provider);
    setQueryParam(params, "pricing", pricing === "all" ? "" : pricing);
    setQueryParam(params, "channel", channelToQueryValue(channel));
    setQueryParam(
      params,
      "relationship",
      relationship === "all" ? "" : relationship,
    );
    setQueryParam(params, "sort", sortKey === "name" ? "" : sortKey);
    setQueryParam(params, "topUp", topUp === "all" ? "" : topUp);
    replaceCurrentQuery(params);
  }, [
    channel,
    paymentMethod,
    pricing,
    provider,
    query,
    relationship,
    risk,
    sortKey,
    topUp,
  ]);

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
        const matchesChannel =
          channel === "all" || relay.channelType === channel;
        const matchesRelationship =
          relationship === "all" ||
          (relationship === "sponsored" && relay.isSponsored) ||
          (relationship === "referral" && relay.hasReferralProgram) ||
          (relationship === "verified" && relay.isVerified);
        const matchesTopUp =
          topUp === "all" ||
          (topUp === "known" && relay.minimumTopUpAmount !== null) ||
          (topUp === "low" &&
            relay.minimumTopUpAmount !== null &&
            relay.minimumTopUpAmount <= 5);

        return (
          matchesQuery &&
          matchesRisk &&
          matchesPayment &&
          matchesProvider &&
          matchesPricing &&
          matchesChannel &&
          matchesRelationship &&
          matchesTopUp
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
  }, [
    channel,
    paymentMethod,
    pricing,
    provider,
    query,
    relays,
    relationship,
    risk,
    sortKey,
    topUp,
  ]);

  return (
    <div className="grid gap-5">
      <RelayIntentFilters
        filteredCount={filteredRelays.length}
        hasActiveFilters={hasActiveFilters}
        channel={channel}
        paymentMethod={paymentMethod}
        paymentMethods={paymentMethods}
        pricing={pricing}
        provider={provider}
        providers={providers}
        relationship={relationship}
        relaysCount={relays.length}
        risk={risk}
        sortKey={sortKey}
        topUp={topUp}
        onPaymentMethodChange={setPaymentMethod}
        onChannelChange={setChannel}
        onPricingChange={setPricing}
        onProviderChange={setProvider}
        onRelationshipChange={setRelationship}
        onReset={() => {
          setQuery("");
          setRisk("all");
          setPaymentMethod("all");
          setProvider("all");
          setPricing("all");
          setChannel("all");
          setRelationship("all");
          setSortKey("name");
          setTopUp("all");
        }}
        onRiskChange={setRisk}
        onSortKeyChange={setSortKey}
        onTopUpChange={setTopUp}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRelays.map((relay) => (
          <RelayStationCard key={relay.slug} relay={relay} />
        ))}
      </div>

      {!filteredRelays.length ? (
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground shadow-soft">
          No relay stations match the current filters.
        </div>
      ) : null}
    </div>
  );
}

function RelayIntentFilters({
  channel,
  filteredCount,
  hasActiveFilters,
  onChannelChange,
  onPaymentMethodChange,
  onPricingChange,
  onProviderChange,
  onRelationshipChange,
  onReset,
  onRiskChange,
  onSortKeyChange,
  onTopUpChange,
  paymentMethod,
  paymentMethods,
  pricing,
  provider,
  providers,
  relationship,
  relaysCount,
  risk,
  sortKey,
  topUp,
}: {
  channel: ChannelFilter;
  filteredCount: number;
  hasActiveFilters: boolean;
  onChannelChange: (value: ChannelFilter) => void;
  onPaymentMethodChange: (value: string) => void;
  onPricingChange: (value: PricingFilter) => void;
  onProviderChange: (value: string) => void;
  onRelationshipChange: (value: RelationshipFilter) => void;
  onReset: () => void;
  onRiskChange: (value: RiskFilter) => void;
  onSortKeyChange: (value: SortKey) => void;
  onTopUpChange: (value: TopUpFilter) => void;
  paymentMethod: string;
  paymentMethods: string[];
  pricing: PricingFilter;
  provider: string;
  providers: string[];
  relationship: RelationshipFilter;
  relaysCount: number;
  risk: RiskFilter;
  sortKey: SortKey;
  topUp: TopUpFilter;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h2 className="font-display text-lg font-semibold">按使用场景筛选</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredCount} / {relaysCount} 个入口，优先小额测试并核对价格。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1 rounded-md border border-input bg-card px-2.5 py-1.5 text-sm">
            <Tags className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Sort by</span>
            <select
              aria-label="Sort by"
              className="bg-transparent outline-none"
              value={sortKey}
              onChange={(event) =>
                onSortKeyChange(event.target.value as SortKey)
              }
            >
              <option value="name">Name</option>
              <option value="last-checked">Last checked</option>
              <option value="top-up">Top-up</option>
            </select>
          </label>
          <button
            className="rounded-md border border-input px-2.5 py-1.5 text-sm font-medium text-foreground/70 transition hover:bg-secondary disabled:hidden"
            disabled={!hasActiveFilters}
            onClick={onReset}
            type="button"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <ChipGroup label="入口类型">
          <FilterChip
            active={channel === "all"}
            onClick={() => onChannelChange("all")}
          >
            全部
          </FilterChip>
          <FilterChip
            active={channel === "official_direct"}
            icon={<BadgeCheck className="h-3.5 w-3.5" />}
            onClick={() => onChannelChange("official_direct")}
          >
            官方直连
          </FilterChip>
          <FilterChip
            active={channel === "third_party_relay"}
            onClick={() => onChannelChange("third_party_relay")}
          >
            二次中转
          </FilterChip>
        </ChipGroup>

        <ChipGroup label="支持模型">
          <FilterChip
            active={provider === "all"}
            onClick={() => onProviderChange("all")}
          >
            全部模型
          </FilterChip>
          {providers.map((providerName) => (
            <FilterChip
              active={provider === providerName}
              key={providerName}
              onClick={() => onProviderChange(providerName)}
            >
              {providerName}
            </FilterChip>
          ))}
        </ChipGroup>

        <ChipGroup label="支付方式">
          <FilterChip
            active={paymentMethod === "all"}
            icon={<CreditCard className="h-3.5 w-3.5" />}
            onClick={() => onPaymentMethodChange("all")}
          >
            全部支付
          </FilterChip>
          {paymentMethods.map((method) => (
            <FilterChip
              active={paymentMethod === method}
              key={method}
              onClick={() => onPaymentMethodChange(method)}
            >
              {method}
            </FilterChip>
          ))}
        </ChipGroup>

        <ChipGroup label="起充">
          <FilterChip
            active={topUp === "all"}
            onClick={() => onTopUpChange("all")}
          >
            全部
          </FilterChip>
          <FilterChip
            active={topUp === "low"}
            icon={<Wallet className="h-3.5 w-3.5" />}
            onClick={() => onTopUpChange("low")}
          >
            低起充
          </FilterChip>
          <FilterChip
            active={topUp === "known"}
            onClick={() => onTopUpChange("known")}
          >
            已知起充
          </FilterChip>
        </ChipGroup>

        <ChipGroup label="价格透明">
          <FilterChip
            active={pricing === "all"}
            onClick={() => onPricingChange("all")}
          >
            全部
          </FilterChip>
          <FilterChip
            active={pricing === "public"}
            icon={<BadgeCheck className="h-3.5 w-3.5" />}
            onClick={() => onPricingChange("public")}
          >
            公开价格
          </FilterChip>
          <FilterChip
            active={pricing === "unclear"}
            onClick={() => onPricingChange("unclear")}
          >
            价格不明
          </FilterChip>
        </ChipGroup>

        <ChipGroup label="风险等级">
          <FilterChip
            active={risk === "all"}
            onClick={() => onRiskChange("all")}
          >
            全部风险
          </FilterChip>
          <FilterChip
            active={risk === "low"}
            onClick={() => onRiskChange("low")}
          >
            低风险
          </FilterChip>
          <FilterChip
            active={risk === "unknown"}
            onClick={() => onRiskChange("unknown")}
          >
            待核验
          </FilterChip>
          <FilterChip
            active={risk === "high"}
            icon={<ShieldAlert className="h-3.5 w-3.5" />}
            onClick={() => onRiskChange("high")}
          >
            高风险
          </FilterChip>
        </ChipGroup>

        <ChipGroup label="商业关系">
          <FilterChip
            active={relationship === "all"}
            onClick={() => onRelationshipChange("all")}
          >
            全部关系
          </FilterChip>
          <FilterChip
            active={relationship === "verified"}
            onClick={() => onRelationshipChange("verified")}
          >
            Verified
          </FilterChip>
          <FilterChip
            active={relationship === "referral"}
            onClick={() => onRelationshipChange("referral")}
          >
            Referral
          </FilterChip>
          <FilterChip
            active={relationship === "sponsored"}
            onClick={() => onRelationshipChange("sponsored")}
          >
            Sponsored
          </FilterChip>
        </ChipGroup>
      </div>
    </section>
  );
}

function RelayStationCard({ relay }: { relay: RelayStationPublic }) {
  const visibleProviders = relay.supportedProviders.slice(0, 3);
  const hiddenProviderCount = Math.max(relay.supportedProviders.length - 3, 0);

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <Image
              alt=""
              aria-hidden="true"
              className="rounded-xl border border-border bg-secondary"
              height={40}
              src={`https://www.google.com/s2/favicons?domain=${relay.domain}&sz=64`}
              width={40}
            />
            <div className="min-w-0">
              <Link
                className="font-display text-lg font-semibold hover:text-primary"
                href={`/relays/${relay.slug}`}
              >
                {relay.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                {relay.domain}
              </p>
            </div>
          </div>
          <RiskBadge riskLevel={relay.riskLevel} />
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {relay.description}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <RelayMetric label="起充" value={formatTopUp(relay)} />
          <RelayMetric
            label="支付方式"
            value={relay.paymentMethods.join(", ")}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleProviders.map((providerName) => (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-1 text-xs font-medium text-foreground/75"
              key={providerName}
            >
              <ProviderAvatar label={providerName} size="sm" />
              {providerName}
            </span>
          ))}
          {hiddenProviderCount ? (
            <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-1 text-xs font-medium text-muted-foreground">
              +{hiddenProviderCount}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <ChannelBadge channelType={relay.channelType} />
          {relay.isSponsored ? <Badge tone="amber">Sponsored</Badge> : null}
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

        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span>Checked {formatDate(relay.lastCheckedAt)}</span>
          <div className="flex gap-3 text-sm font-medium">
            <TrackedOutboundLink
              className="inline-flex items-center gap-1 text-primary hover:underline"
              sourcePath="/relays"
              targetSlug={relay.slug}
              targetType="relay"
              url={relay.websiteUrl}
            >
              访问官网
              <ExternalLink className="h-3.5 w-3.5" />
            </TrackedOutboundLink>
            <Link
              className="text-foreground/70 hover:underline"
              href={`/relays/${relay.slug}`}
            >
              查看详情
            </Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ChipGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-[88px_minmax(0,1fr)] lg:items-start">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  children,
  icon,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground/70 hover:bg-secondary"
      }`}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function RelayMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-secondary/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-mono text-sm font-semibold tabular-nums">
        {value}
      </div>
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

function channelToQueryValue(channel: ChannelFilter) {
  if (channel === "official_direct") {
    return "official";
  }

  if (channel === "third_party_relay") {
    return "relay";
  }

  return "";
}

function topUpValue(relay: RelayStationPublic) {
  if (relay.minimumTopUpAmount === null) {
    return Number.POSITIVE_INFINITY;
  }

  return relay.minimumTopUpAmount;
}

function formatTopUp(relay: RelayStationPublic) {
  return relay.minimumTopUpAmount
    ? `${relay.minimumTopUpCurrency} ${relay.minimumTopUpAmount}`
    : "Unknown";
}

function isRiskFilter(value: string | null): value is RiskFilter {
  return (
    value === "all" ||
    value === "unknown" ||
    value === "low" ||
    value === "medium" ||
    value === "high"
  );
}

function isPricingFilter(value: string | null): value is PricingFilter {
  return value === "all" || value === "public" || value === "unclear";
}

function isRelationshipFilter(
  value: string | null,
): value is RelationshipFilter {
  return (
    value === "all" ||
    value === "sponsored" ||
    value === "referral" ||
    value === "verified"
  );
}

function isChannelFilter(value: string | null): value is ChannelFilter {
  return (
    value === "all" ||
    value === "official_direct" ||
    value === "third_party_relay"
  );
}

function isRelaySortKey(value: string | null): value is SortKey {
  return value === "name" || value === "last-checked" || value === "top-up";
}

function isTopUpFilter(value: string | null): value is TopUpFilter {
  return value === "all" || value === "low" || value === "known";
}

function normalizeRiskFilter(value: string | undefined) {
  const normalized = value ?? "";
  return isRiskFilter(normalized) ? normalized : "all";
}

function normalizePricingFilter(value: string | undefined) {
  const normalized = value ?? "";
  return isPricingFilter(normalized) ? normalized : "all";
}

function normalizeRelationshipFilter(value: string | undefined) {
  const normalized = value ?? "";
  return isRelationshipFilter(normalized) ? normalized : "all";
}

function normalizeChannelFilter(value: string | undefined) {
  if (value === "official") {
    return "official_direct";
  }

  if (value === "relay") {
    return "third_party_relay";
  }

  const normalized = value ?? "";
  return isChannelFilter(normalized) ? normalized : "all";
}

function normalizeRelaySortKey(value: string | undefined) {
  const normalized = value ?? "";
  return isRelaySortKey(normalized) ? normalized : "name";
}

function normalizeTopUpFilter(value: string | undefined) {
  const normalized = value ?? "";
  return isTopUpFilter(normalized) ? normalized : "all";
}

function setQueryParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function replaceCurrentQuery(params: URLSearchParams) {
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}
