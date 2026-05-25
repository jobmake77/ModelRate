"use client";

import { FormEvent, useState } from "react";
import { AdminRelayRow } from "@/lib/data-access/relays";
import { formatDate } from "@/lib/formatters/number";

type RelayStatus = "draft" | "published" | "hidden" | "archived";
type RiskLevel = "unknown" | "low" | "medium" | "high";
type RelayChannelType = "official_direct" | "third_party_relay";

type RelayFormState = {
  slug: string;
  name: string;
  domain: string;
  websiteUrl: string;
  description: string;
  billingModes: string;
  paymentMethods: string;
  minimumTopUpAmount: string;
  minimumTopUpCurrency: string;
  supportChannels: string;
  channelType: RelayChannelType;
  hasPublicPricing: boolean;
  hasTrialCredit: boolean;
  hasReferralProgram: boolean;
  referralUrl: string;
  couponCode: string;
  isSponsored: boolean;
  isVerified: boolean;
  status: RelayStatus;
  riskLevel: RiskLevel;
  lastCheckedAt: string;
};

type Props = {
  databaseConfigured: boolean;
  initialRelays: AdminRelayRow[];
};

const emptyForm: RelayFormState = {
  slug: "",
  name: "",
  domain: "",
  websiteUrl: "",
  description: "",
  billingModes: "pay_as_you_go",
  paymentMethods: "",
  minimumTopUpAmount: "",
  minimumTopUpCurrency: "",
  supportChannels: "",
  channelType: "third_party_relay",
  hasPublicPricing: false,
  hasTrialCredit: false,
  hasReferralProgram: false,
  referralUrl: "",
  couponCode: "",
  isSponsored: false,
  isVerified: false,
  status: "draft",
  riskLevel: "unknown",
  lastCheckedAt: new Date().toISOString().slice(0, 10),
};

export function RelayAdminPanel({ databaseConfigured, initialRelays }: Props) {
  const [relays, setRelays] = useState(initialRelays);
  const [form, setForm] = useState(emptyForm);
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminRelayRow>>>(
    {},
  );
  const [message, setMessage] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/relays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toCreatePayload(form)),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create relay.");
      return;
    }

    setRelays((current) => [toRelayRow(payload.relay), ...current]);
    setForm(emptyForm);
    setMessage("Relay created.");
  }

  async function handleSave(relay: AdminRelayRow) {
    const draft = drafts[relay.id] ?? {};
    setMessage("");

    const response = await fetch(`/api/admin/relays/${relay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toUpdatePayload(relay, draft)),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update relay.");
      return;
    }

    setRelays((current) =>
      current.map((item) =>
        item.id === relay.id ? toRelayRow(payload.relay) : item,
      ),
    );
    setMessage("Relay updated.");
  }

  async function handleHide(relay: AdminRelayRow) {
    setMessage("");

    const response = await fetch(`/api/admin/relays/${relay.id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to hide relay.");
      return;
    }

    setRelays((current) =>
      current.map((item) =>
        item.id === relay.id ? toRelayRow(payload.relay) : item,
      ),
    );
    setMessage("Relay hidden.");
  }

  return (
    <div className="grid gap-6">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前展示 fixture
          中转站。配置数据库后可创建、编辑和隐藏。
        </section>
      ) : null}

      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-lg font-semibold">Create relay</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextInput
            disabled={!databaseConfigured}
            label="Name"
            required
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({ ...current, name: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Slug"
            required
            value={form.slug}
            onChange={(value) =>
              setForm((current) => ({ ...current, slug: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Domain"
            required
            value={form.domain}
            onChange={(value) =>
              setForm((current) => ({ ...current, domain: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Website URL"
            required
            type="url"
            value={form.websiteUrl}
            onChange={(value) =>
              setForm((current) => ({ ...current, websiteUrl: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Payment methods"
            placeholder="Alipay, USDT"
            value={form.paymentMethods}
            onChange={(value) =>
              setForm((current) => ({ ...current, paymentMethods: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Billing modes"
            placeholder="pay_as_you_go"
            value={form.billingModes}
            onChange={(value) =>
              setForm((current) => ({ ...current, billingModes: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Minimum top-up"
            min="0"
            type="number"
            value={form.minimumTopUpAmount}
            onChange={(value) =>
              setForm((current) => ({ ...current, minimumTopUpAmount: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Minimum top-up currency"
            value={form.minimumTopUpCurrency}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                minimumTopUpCurrency: value,
              }))
            }
          />
          <SelectInput
            disabled={!databaseConfigured}
            label="Channel type"
            value={form.channelType}
            options={["official_direct", "third_party_relay"]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                channelType: value as RelayChannelType,
              }))
            }
          />
          <SelectInput
            disabled={!databaseConfigured}
            label="Status"
            value={form.status}
            options={["draft", "published", "hidden", "archived"]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as RelayStatus,
              }))
            }
          />
          <SelectInput
            disabled={!databaseConfigured}
            label="Risk level"
            value={form.riskLevel}
            options={["unknown", "low", "medium", "high"]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                riskLevel: value as RiskLevel,
              }))
            }
          />
        </div>

        <label className="mt-4 grid gap-1 text-sm">
          <span className="font-medium">Description</span>
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
            disabled={!databaseConfigured}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Checkbox
            checked={form.hasPublicPricing}
            disabled={!databaseConfigured}
            label="Public pricing"
            onChange={(value) =>
              setForm((current) => ({ ...current, hasPublicPricing: value }))
            }
          />
          <Checkbox
            checked={form.hasTrialCredit}
            disabled={!databaseConfigured}
            label="Trial credit"
            onChange={(value) =>
              setForm((current) => ({ ...current, hasTrialCredit: value }))
            }
          />
          <Checkbox
            checked={form.hasReferralProgram}
            disabled={!databaseConfigured}
            label="Referral"
            onChange={(value) =>
              setForm((current) => ({ ...current, hasReferralProgram: value }))
            }
          />
          <Checkbox
            checked={form.isSponsored}
            disabled={!databaseConfigured}
            label="Sponsored"
            onChange={(value) =>
              setForm((current) => ({ ...current, isSponsored: value }))
            }
          />
          <Checkbox
            checked={form.isVerified}
            disabled={!databaseConfigured}
            label="Verified"
            onChange={(value) =>
              setForm((current) => ({ ...current, isVerified: value }))
            }
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!databaseConfigured}
            type="submit"
          >
            Create
          </button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </form>

      <div className="grid gap-4">
        {relays.map((relay) => {
          const draft = drafts[relay.id] ?? {};
          return (
            <section
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={relay.id}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="rounded-md border border-slate-300 px-3 py-2 text-lg font-semibold"
                      disabled={!databaseConfigured}
                      value={draft.name ?? relay.name}
                      onChange={(event) =>
                        updateDraft(setDrafts, relay.id, {
                          name: event.target.value,
                        })
                      }
                    />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {draft.status ?? relay.status}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      {formatChannelType(
                        draft.channelType ?? relay.channelType,
                      )}
                    </span>
                    {relay.isSponsored ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                        Sponsored
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {relay.domain} · checked{" "}
                    {relay.lastCheckedAt
                      ? formatDate(relay.lastCheckedAt)
                      : "N/A"}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {relay.description}
                  </p>
                </div>
                <div className="grid min-w-72 gap-3">
                  <SelectInput
                    disabled={!databaseConfigured}
                    label="Channel"
                    value={draft.channelType ?? relay.channelType}
                    options={["official_direct", "third_party_relay"]}
                    onChange={(value) =>
                      updateDraft(setDrafts, relay.id, {
                        channelType: value as RelayChannelType,
                      })
                    }
                  />
                  <SelectInput
                    disabled={!databaseConfigured}
                    label="Status"
                    value={draft.status ?? relay.status}
                    options={["draft", "published", "hidden", "archived"]}
                    onChange={(value) =>
                      updateDraft(setDrafts, relay.id, {
                        status: value as RelayStatus,
                      })
                    }
                  />
                  <SelectInput
                    disabled={!databaseConfigured}
                    label="Risk"
                    value={draft.riskLevel ?? relay.riskLevel}
                    options={["unknown", "low", "medium", "high"]}
                    onChange={(value) =>
                      updateDraft(setDrafts, relay.id, {
                        riskLevel: value as RiskLevel,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-400"
                      disabled={!databaseConfigured}
                      onClick={() => handleSave(relay)}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      disabled={
                        !databaseConfigured || relay.status === "hidden"
                      }
                      onClick={() => handleHide(relay)}
                      type="button"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TextInput({
  disabled,
  label,
  min,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  disabled: boolean;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-md border border-slate-300 px-3 py-2"
        disabled={disabled}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectInput({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="rounded-md border border-slate-300 px-3 py-2"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

function toCreatePayload(form: RelayFormState) {
  return {
    slug: form.slug,
    name: form.name,
    domain: form.domain,
    websiteUrl: form.websiteUrl,
    description: optionalString(form.description),
    billingModes: splitList(form.billingModes),
    paymentMethods: splitList(form.paymentMethods),
    minimumTopUpAmount: optionalNumber(form.minimumTopUpAmount),
    minimumTopUpCurrency: optionalNullableString(form.minimumTopUpCurrency),
    supportChannels: splitList(form.supportChannels),
    channelType: form.channelType,
    hasPublicPricing: form.hasPublicPricing,
    hasTrialCredit: form.hasTrialCredit,
    hasReferralProgram: form.hasReferralProgram,
    referralUrl: optionalNullableString(form.referralUrl),
    couponCode: optionalNullableString(form.couponCode),
    isSponsored: form.isSponsored,
    isVerified: form.isVerified,
    status: form.status,
    riskLevel: form.riskLevel,
    lastCheckedAt: form.lastCheckedAt,
  };
}

function toUpdatePayload(relay: AdminRelayRow, draft: Partial<AdminRelayRow>) {
  return {
    name: draft.name ?? relay.name,
    status: draft.status ?? relay.status,
    riskLevel: draft.riskLevel ?? relay.riskLevel,
    domain: draft.domain ?? relay.domain,
    websiteUrl: draft.websiteUrl ?? relay.websiteUrl,
    description: draft.description ?? relay.description,
    billingModes: draft.billingModes ?? relay.billingModes,
    paymentMethods: draft.paymentMethods ?? relay.paymentMethods,
    minimumTopUpAmount:
      draft.minimumTopUpAmount === undefined
        ? relay.minimumTopUpAmount
        : draft.minimumTopUpAmount,
    minimumTopUpCurrency:
      draft.minimumTopUpCurrency === undefined
        ? relay.minimumTopUpCurrency
        : draft.minimumTopUpCurrency,
    supportChannels: draft.supportChannels ?? relay.supportChannels,
    channelType: draft.channelType ?? relay.channelType,
    hasPublicPricing: draft.hasPublicPricing ?? relay.hasPublicPricing,
    hasTrialCredit: draft.hasTrialCredit ?? relay.hasTrialCredit,
    hasReferralProgram: draft.hasReferralProgram ?? relay.hasReferralProgram,
    referralUrl: draft.referralUrl ?? relay.referralUrl,
    couponCode: draft.couponCode ?? relay.couponCode,
    isSponsored: draft.isSponsored ?? relay.isSponsored,
    isVerified: draft.isVerified ?? relay.isVerified,
    lastCheckedAt: draft.lastCheckedAt ?? relay.lastCheckedAt,
  };
}

function toRelayRow(relay: {
  billingModes: string[];
  couponCode: string | null;
  description: string | null;
  domain: string;
  hasPublicPricing: boolean;
  hasReferralProgram: boolean;
  hasTrialCredit: boolean;
  id: string;
  isSponsored: boolean;
  isVerified: boolean;
  lastCheckedAt: Date | string | null;
  channelType: RelayChannelType;
  minimumTopUpAmount: number | string | null;
  minimumTopUpCurrency: string | null;
  name: string;
  paymentMethods: string[];
  referralUrl: string | null;
  riskLevel: RiskLevel;
  slug: string;
  status: RelayStatus;
  supportChannels: string[];
  websiteUrl: string;
}): AdminRelayRow {
  return {
    id: relay.id,
    slug: relay.slug,
    name: relay.name,
    domain: relay.domain,
    websiteUrl: relay.websiteUrl,
    description: relay.description ?? "",
    billingModes: relay.billingModes,
    paymentMethods: relay.paymentMethods,
    minimumTopUpAmount:
      relay.minimumTopUpAmount === null
        ? null
        : Number(relay.minimumTopUpAmount),
    minimumTopUpCurrency: relay.minimumTopUpCurrency,
    supportChannels: relay.supportChannels,
    channelType: relay.channelType,
    supportedProviders: [],
    hasPublicPricing: relay.hasPublicPricing,
    hasTrialCredit: relay.hasTrialCredit,
    hasReferralProgram: relay.hasReferralProgram,
    referralUrl: relay.referralUrl,
    couponCode: relay.couponCode,
    isSponsored: relay.isSponsored,
    isVerified: relay.isVerified,
    status: relay.status,
    riskLevel: relay.riskLevel,
    riskTags: [],
    riskTagDetails: [],
    sourceUrl: relay.websiteUrl,
    lastCheckedAt: relay.lastCheckedAt
      ? new Date(relay.lastCheckedAt).toISOString()
      : "",
  };
}

function formatChannelType(value: RelayChannelType) {
  return value === "official_direct" ? "官方直连" : "二次中转";
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function optionalNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? Number(trimmed) : null;
}

function updateDraft(
  setDrafts: (
    updater: (
      current: Record<string, Partial<AdminRelayRow>>,
    ) => Record<string, Partial<AdminRelayRow>>,
  ) => void,
  id: string,
  patch: Partial<AdminRelayRow>,
) {
  setDrafts((current) => ({
    ...current,
    [id]: { ...current[id], ...patch },
  }));
}
