"use client";

import { FormEvent, useState } from "react";
import { AdminModelRow } from "@/components/admin/model-admin-panel";
import { formatDate, formatUsd } from "@/lib/formatters/number";

type PriceSourceType =
  | "official"
  | "openrouter"
  | "litellm"
  | "portkey"
  | "manual"
  | "relay";

export type AdminModelPriceRow = {
  id: string;
  modelId: string;
  modelName: string;
  sourceType: PriceSourceType;
  sourceName: string;
  sourceUrl: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  cachedInputPricePer1M: number | null;
  lastCheckedAt: string;
  isCurrent: boolean;
};

type PriceFormState = {
  modelId: string;
  sourceType: PriceSourceType;
  sourceName: string;
  sourceUrl: string;
  inputPricePer1M: string;
  outputPricePer1M: string;
  cachedInputPricePer1M: string;
  lastCheckedAt: string;
};

type Props = {
  databaseConfigured: boolean;
  initialPrices: AdminModelPriceRow[];
  models: AdminModelRow[];
};

const sourceTypes: PriceSourceType[] = [
  "official",
  "openrouter",
  "litellm",
  "portkey",
  "manual",
  "relay",
];

export function ModelPriceAdminPanel({
  databaseConfigured,
  initialPrices,
  models,
}: Props) {
  const [prices, setPrices] = useState(initialPrices);
  const [drafts, setDrafts] = useState<Record<string, Partial<PriceFormState>>>(
    {},
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<PriceFormState>({
    modelId: models[0]?.id ?? "",
    sourceType: "official",
    sourceName: "Official",
    sourceUrl: "",
    inputPricePer1M: "",
    outputPricePer1M: "",
    cachedInputPricePer1M: "",
    lastCheckedAt: new Date().toISOString().slice(0, 10),
  });

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/model-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPricePayload(form, true)),
    });
    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create price.");
      return;
    }

    setPrices((current) => [
      toPriceRow(payload.price),
      ...current.map((price) =>
        price.modelId === form.modelId && price.sourceType === form.sourceType
          ? { ...price, isCurrent: false }
          : price,
      ),
    ]);
    setMessage("Price created.");
  }

  async function handleSave(price: AdminModelPriceRow) {
    const draft = drafts[price.id] ?? {};
    const merged: PriceFormState = {
      modelId: draft.modelId ?? price.modelId,
      sourceType: (draft.sourceType ?? price.sourceType) as PriceSourceType,
      sourceName: draft.sourceName ?? price.sourceName,
      sourceUrl: draft.sourceUrl ?? price.sourceUrl,
      inputPricePer1M: draft.inputPricePer1M ?? String(price.inputPricePer1M),
      outputPricePer1M:
        draft.outputPricePer1M ?? String(price.outputPricePer1M),
      cachedInputPricePer1M:
        draft.cachedInputPricePer1M ??
        (price.cachedInputPricePer1M === null
          ? ""
          : String(price.cachedInputPricePer1M)),
      lastCheckedAt: draft.lastCheckedAt ?? price.lastCheckedAt.slice(0, 10),
    };

    const response = await fetch(`/api/admin/model-prices/${price.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPricePayload(merged, price.isCurrent)),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update price.");
      return;
    }

    setPrices((current) =>
      current.map((item) =>
        item.id === price.id ? toPriceRow(payload.price) : item,
      ),
    );
    setMessage("Price updated.");
  }

  async function handleArchive(price: AdminModelPriceRow) {
    const response = await fetch(`/api/admin/model-prices/${price.id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to archive price.");
      return;
    }

    setPrices((current) =>
      current.map((item) =>
        item.id === price.id ? toPriceRow(payload.price) : item,
      ),
    );
    setMessage("Price archived.");
  }

  return (
    <div className="grid gap-6">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前展示 fixture 价格。配置
          <code className="mx-1 rounded bg-white px-1">DATABASE_URL</code>
          后，价格维护表单会启用。
        </section>
      ) : null}

      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-lg font-semibold">Create current price</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Model</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              disabled={!databaseConfigured}
              value={form.modelId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  modelId: event.target.value,
                }))
              }
              required
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Source type</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              disabled={!databaseConfigured}
              value={form.sourceType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sourceType: event.target.value as PriceSourceType,
                }))
              }
            >
              {sourceTypes.map((sourceType) => (
                <option key={sourceType} value={sourceType}>
                  {sourceType}
                </option>
              ))}
            </select>
          </label>
          <TextInput
            disabled={!databaseConfigured}
            label="Source name"
            value={form.sourceName}
            onChange={(value) =>
              setForm((current) => ({ ...current, sourceName: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Source URL"
            type="url"
            value={form.sourceUrl}
            onChange={(value) =>
              setForm((current) => ({ ...current, sourceUrl: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Input USD / 1M"
            min="0"
            step="0.000001"
            type="number"
            value={form.inputPricePer1M}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                inputPricePer1M: value,
              }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Output USD / 1M"
            min="0"
            step="0.000001"
            type="number"
            value={form.outputPricePer1M}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                outputPricePer1M: value,
              }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Cached input USD / 1M"
            min="0"
            step="0.000001"
            type="number"
            value={form.cachedInputPricePer1M}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                cachedInputPricePer1M: value,
              }))
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
            required
          />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!databaseConfigured || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </form>

      <div className="grid gap-4">
        {prices.map((price) => {
          const draft = drafts[price.id] ?? {};
          return (
            <section
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={price.id}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <div>
                  <h2 className="font-semibold">{price.modelName}</h2>
                  <p className="text-sm text-slate-500">
                    {price.isCurrent ? "Current price" : "Archived price"}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    disabled={!databaseConfigured}
                    label="Input USD / 1M"
                    min="0"
                    step="0.000001"
                    type="number"
                    value={
                      draft.inputPricePer1M ?? String(price.inputPricePer1M)
                    }
                    onChange={(value) =>
                      updateDraft(setDrafts, price.id, {
                        inputPricePer1M: value,
                      })
                    }
                  />
                  <TextInput
                    disabled={!databaseConfigured}
                    label="Output USD / 1M"
                    min="0"
                    step="0.000001"
                    type="number"
                    value={
                      draft.outputPricePer1M ?? String(price.outputPricePer1M)
                    }
                    onChange={(value) =>
                      updateDraft(setDrafts, price.id, {
                        outputPricePer1M: value,
                      })
                    }
                  />
                  <TextInput
                    disabled={!databaseConfigured}
                    label="Source URL"
                    type="url"
                    value={draft.sourceUrl ?? price.sourceUrl}
                    onChange={(value) =>
                      updateDraft(setDrafts, price.id, { sourceUrl: value })
                    }
                  />
                  <TextInput
                    disabled={!databaseConfigured}
                    label="Last checked"
                    type="date"
                    value={
                      draft.lastCheckedAt ?? price.lastCheckedAt.slice(0, 10)
                    }
                    onChange={(value) =>
                      updateDraft(setDrafts, price.id, {
                        lastCheckedAt: value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={!databaseConfigured}
                    onClick={() => handleSave(price)}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={!databaseConfigured || !price.isCurrent}
                    onClick={() => handleArchive(price)}
                    type="button"
                  >
                    Archive
                  </button>
                </div>
              </div>
              <dl className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                <div>
                  <dt className="font-medium text-slate-900">Input</dt>
                  <dd>{formatUsd(price.inputPricePer1M)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Output</dt>
                  <dd>{formatUsd(price.outputPricePer1M)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Source</dt>
                  <dd>{price.sourceName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Last checked</dt>
                  <dd>{formatDate(price.lastCheckedAt)}</dd>
                </div>
              </dl>
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

function toPricePayload(form: PriceFormState, isCurrent: boolean) {
  return {
    modelId: form.modelId,
    sourceType: form.sourceType,
    sourceName: form.sourceName,
    sourceUrl: form.sourceUrl,
    inputPricePer1M: Number(form.inputPricePer1M),
    outputPricePer1M: Number(form.outputPricePer1M),
    cachedInputPricePer1M: form.cachedInputPricePer1M
      ? Number(form.cachedInputPricePer1M)
      : null,
    lastCheckedAt: form.lastCheckedAt,
    isCurrent,
  };
}

function toPriceRow(price: {
  id: string;
  modelId: string;
  model: { displayName: string };
  sourceType: PriceSourceType;
  sourceName: string;
  sourceUrl: string;
  inputPricePer1M: string | number;
  outputPricePer1M: string | number;
  cachedInputPricePer1M: string | number | null;
  lastCheckedAt: string;
  isCurrent: boolean;
}): AdminModelPriceRow {
  return {
    id: price.id,
    modelId: price.modelId,
    modelName: price.model.displayName,
    sourceType: price.sourceType,
    sourceName: price.sourceName,
    sourceUrl: price.sourceUrl,
    inputPricePer1M: Number(price.inputPricePer1M),
    outputPricePer1M: Number(price.outputPricePer1M),
    cachedInputPricePer1M:
      price.cachedInputPricePer1M === null
        ? null
        : Number(price.cachedInputPricePer1M),
    lastCheckedAt: price.lastCheckedAt,
    isCurrent: price.isCurrent,
  };
}

function updateDraft(
  setDrafts: (
    updater: (
      current: Record<string, Partial<PriceFormState>>,
    ) => Record<string, Partial<PriceFormState>>,
  ) => void,
  id: string,
  patch: Partial<PriceFormState>,
) {
  setDrafts((current) => ({
    ...current,
    [id]: { ...current[id], ...patch },
  }));
}
