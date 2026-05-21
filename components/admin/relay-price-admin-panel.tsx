"use client";

import { FormEvent, useState } from "react";
import { AdminModelRow } from "@/components/admin/model-admin-panel";
import { AdminRelayRow } from "@/lib/data-access/relays";
import { formatDate, formatUsd } from "@/lib/formatters/number";

export type AdminRelayPriceRow = {
  id: string;
  relayStationId: string;
  relayName: string;
  modelId: string;
  modelName: string;
  routeName: string | null;
  billingType: string;
  modelMultiplier: number | null;
  completionMultiplier: number | null;
  groupMultiplier: number;
  routeMultiplier: number;
  inputPricePer1M: number | null;
  outputPricePer1M: number | null;
  currency: string;
  sourceUrl: string | null;
  lastCheckedAt: string | null;
  isCurrent: boolean;
  notes: string | null;
};

type FormState = {
  relayStationId: string;
  modelId: string;
  routeName: string;
  billingType: string;
  modelMultiplier: string;
  completionMultiplier: string;
  groupMultiplier: string;
  routeMultiplier: string;
  inputPricePer1M: string;
  outputPricePer1M: string;
  currency: string;
  sourceUrl: string;
  lastCheckedAt: string;
  notes: string;
};

type Props = {
  databaseConfigured: boolean;
  initialPrices: AdminRelayPriceRow[];
  models: AdminModelRow[];
  relays: AdminRelayRow[];
};

export function RelayPriceAdminPanel({
  databaseConfigured,
  initialPrices,
  models,
  relays,
}: Props) {
  const [prices, setPrices] = useState(initialPrices);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<FormState>({
    relayStationId: relays[0]?.id ?? "",
    modelId: models[0]?.id ?? "",
    routeName: "",
    billingType: "token",
    modelMultiplier: "",
    completionMultiplier: "",
    groupMultiplier: "1",
    routeMultiplier: "1",
    inputPricePer1M: "",
    outputPricePer1M: "",
    currency: "USD",
    sourceUrl: "",
    lastCheckedAt: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/relay-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create relay price.");
      return;
    }

    setPrices((current) => [toPriceRow(payload.price), ...current]);
    setMessage("Relay price created.");
  }

  async function archivePrice(price: AdminRelayPriceRow) {
    const response = await fetch(`/api/admin/relay-prices/${price.id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to archive relay price.");
      return;
    }

    setPrices((current) =>
      current.map((item) =>
        item.id === price.id ? toPriceRow(payload.price) : item,
      ),
    );
    setMessage("Relay price archived.");
  }

  return (
    <div className="grid gap-6">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前只能展示空状态。配置数据库后可维护中转站模型价格。
        </section>
      ) : null}

      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-lg font-semibold">Create relay model price</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectInput
            disabled={!databaseConfigured}
            label="Relay"
            value={form.relayStationId}
            options={relays.map((relay) => ({
              label: relay.name,
              value: relay.id,
            }))}
            onChange={(value) =>
              setForm((current) => ({ ...current, relayStationId: value }))
            }
          />
          <SelectInput
            disabled={!databaseConfigured}
            label="Model"
            value={form.modelId}
            options={models.map((model) => ({
              label: model.displayName,
              value: model.id,
            }))}
            onChange={(value) =>
              setForm((current) => ({ ...current, modelId: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Route name"
            value={form.routeName}
            onChange={(value) =>
              setForm((current) => ({ ...current, routeName: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Billing type"
            required
            value={form.billingType}
            onChange={(value) =>
              setForm((current) => ({ ...current, billingType: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Model multiplier"
            min="0"
            step="0.000001"
            type="number"
            value={form.modelMultiplier}
            onChange={(value) =>
              setForm((current) => ({ ...current, modelMultiplier: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Completion multiplier"
            min="0"
            step="0.000001"
            type="number"
            value={form.completionMultiplier}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                completionMultiplier: value,
              }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Group multiplier"
            min="0"
            required
            step="0.000001"
            type="number"
            value={form.groupMultiplier}
            onChange={(value) =>
              setForm((current) => ({ ...current, groupMultiplier: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Route multiplier"
            min="0"
            required
            step="0.000001"
            type="number"
            value={form.routeMultiplier}
            onChange={(value) =>
              setForm((current) => ({ ...current, routeMultiplier: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Input USD / 1M"
            min="0"
            step="0.000001"
            type="number"
            value={form.inputPricePer1M}
            onChange={(value) =>
              setForm((current) => ({ ...current, inputPricePer1M: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Output USD / 1M"
            min="0"
            step="0.000001"
            type="number"
            value={form.outputPricePer1M}
            onChange={(value) =>
              setForm((current) => ({ ...current, outputPricePer1M: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Source URL"
            type="url"
            value={form.sourceUrl}
            onChange={(value) =>
              setForm((current) => ({ ...current, sourceUrl: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Last checked"
            type="date"
            value={form.lastCheckedAt}
            onChange={(value) =>
              setForm((current) => ({ ...current, lastCheckedAt: value }))
            }
          />
        </div>
        <label className="mt-4 grid gap-1 text-sm">
          <span className="font-medium">Notes</span>
          <textarea
            className="min-h-20 rounded-md border border-slate-300 px-3 py-2"
            disabled={!databaseConfigured}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </label>
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
        {prices.length ? (
          prices.map((price) => (
            <section
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={price.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="font-semibold">
                    {price.relayName} · {price.modelName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {price.routeName ?? "default route"} ·{" "}
                    {price.isCurrent ? "current" : "archived"}
                  </p>
                  <dl className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                    <Metric
                      label="Model x"
                      value={price.modelMultiplier?.toString() ?? "N/A"}
                    />
                    <Metric
                      label="Completion x"
                      value={price.completionMultiplier?.toString() ?? "N/A"}
                    />
                    <Metric
                      label="Input"
                      value={
                        price.inputPricePer1M === null
                          ? "N/A"
                          : formatUsd(price.inputPricePer1M)
                      }
                    />
                    <Metric
                      label="Output"
                      value={
                        price.outputPricePer1M === null
                          ? "N/A"
                          : formatUsd(price.outputPricePer1M)
                      }
                    />
                  </dl>
                  <p className="mt-3 text-xs text-slate-500">
                    Last checked:{" "}
                    {price.lastCheckedAt
                      ? formatDate(price.lastCheckedAt)
                      : "N/A"}
                  </p>
                </div>
                <button
                  className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  disabled={!databaseConfigured || !price.isCurrent}
                  onClick={() => archivePrice(price)}
                  type="button"
                >
                  Archive
                </button>
              </div>
            </section>
          ))
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No relay prices yet.
          </section>
        )}
      </div>
    </div>
  );
}

function TextInput({
  disabled,
  label,
  min,
  onChange,
  required,
  step,
  type = "text",
  value,
}: {
  disabled: boolean;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  required?: boolean;
  step?: string;
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
        required={required}
        step={step}
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
  options: Array<{ label: string; value: string }>;
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-900">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function toPayload(form: FormState) {
  return {
    relayStationId: form.relayStationId,
    modelId: form.modelId,
    routeName: optionalNullableString(form.routeName),
    billingType: form.billingType,
    modelMultiplier: optionalNumber(form.modelMultiplier),
    completionMultiplier: optionalNumber(form.completionMultiplier),
    groupMultiplier: Number(form.groupMultiplier),
    routeMultiplier: Number(form.routeMultiplier),
    inputPricePer1M: optionalNumber(form.inputPricePer1M),
    outputPricePer1M: optionalNumber(form.outputPricePer1M),
    currency: form.currency,
    sourceUrl: optionalNullableString(form.sourceUrl),
    lastCheckedAt: optionalNullableString(form.lastCheckedAt),
    notes: optionalNullableString(form.notes),
  };
}

function toPriceRow(price: {
  billingType: string;
  completionMultiplier: number | string | null;
  currency: string;
  groupMultiplier: number | string;
  id: string;
  inputPricePer1M: number | string | null;
  isCurrent: boolean;
  lastCheckedAt: Date | string | null;
  model: { displayName: string };
  modelId: string;
  modelMultiplier: number | string | null;
  notes: string | null;
  outputPricePer1M: number | string | null;
  relayStation: { name: string };
  relayStationId: string;
  routeMultiplier: number | string;
  routeName: string | null;
  sourceUrl: string | null;
}): AdminRelayPriceRow {
  return {
    id: price.id,
    relayStationId: price.relayStationId,
    relayName: price.relayStation.name,
    modelId: price.modelId,
    modelName: price.model.displayName,
    routeName: price.routeName,
    billingType: price.billingType,
    modelMultiplier:
      price.modelMultiplier === null ? null : Number(price.modelMultiplier),
    completionMultiplier:
      price.completionMultiplier === null
        ? null
        : Number(price.completionMultiplier),
    groupMultiplier: Number(price.groupMultiplier),
    routeMultiplier: Number(price.routeMultiplier),
    inputPricePer1M:
      price.inputPricePer1M === null ? null : Number(price.inputPricePer1M),
    outputPricePer1M:
      price.outputPricePer1M === null ? null : Number(price.outputPricePer1M),
    currency: price.currency,
    sourceUrl: price.sourceUrl,
    lastCheckedAt: price.lastCheckedAt
      ? new Date(price.lastCheckedAt).toISOString()
      : null,
    isCurrent: price.isCurrent,
    notes: price.notes,
  };
}

function optionalNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? Number(trimmed) : null;
}
