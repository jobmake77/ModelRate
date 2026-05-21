"use client";

import { FormEvent, useMemo, useState } from "react";

export type AdminProviderOption = {
  id: string;
  name: string;
};

export type AdminModelRow = {
  id: string;
  providerId: string;
  providerName: string;
  slug: string;
  canonicalModelId: string;
  displayName: string;
  family: string;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsFunctionCalling: boolean;
  sourceUrl: string;
  status: "active" | "deprecated" | "hidden";
};

type ModelFormState = {
  providerId: string;
  slug: string;
  canonicalModelId: string;
  displayName: string;
  family: string;
  contextWindow: string;
  maxOutputTokens: string;
  sourceUrl: string;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsFunctionCalling: boolean;
};

type Props = {
  databaseConfigured: boolean;
  providers: AdminProviderOption[];
  initialModels: AdminModelRow[];
};

const emptyForm: ModelFormState = {
  providerId: "",
  slug: "",
  canonicalModelId: "",
  displayName: "",
  family: "",
  contextWindow: "",
  maxOutputTokens: "",
  sourceUrl: "",
  supportsVision: false,
  supportsReasoning: false,
  supportsFunctionCalling: false,
};

export function ModelAdminPanel({
  databaseConfigured,
  providers,
  initialModels,
}: Props) {
  const [models, setModels] = useState(initialModels);
  const [form, setForm] = useState<ModelFormState>({
    ...emptyForm,
    providerId: providers[0]?.id ?? "",
  });
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminModelRow>>>(
    {},
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const providerNameById = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider.name])),
    [providers],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: form.providerId,
        slug: form.slug,
        canonicalModelId: form.canonicalModelId,
        displayName: form.displayName,
        family: optionalString(form.family),
        contextWindow: optionalNumber(form.contextWindow),
        maxOutputTokens: optionalNumber(form.maxOutputTokens),
        supportsVision: form.supportsVision,
        supportsReasoning: form.supportsReasoning,
        supportsFunctionCalling: form.supportsFunctionCalling,
        sourceUrl: optionalString(form.sourceUrl),
      }),
    });

    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create model.");
      return;
    }

    setModels((current) => [toModelRow(payload.model), ...current]);
    setForm({ ...emptyForm, providerId: providers[0]?.id ?? "" });
    setMessage("Model created.");
  }

  async function handleSave(model: AdminModelRow) {
    const draft = drafts[model.id] ?? {};
    setMessage("");

    const response = await fetch(`/api/admin/models/${model.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: draft.displayName ?? model.displayName,
        status: draft.status ?? model.status,
        sourceUrl: normalizeNullableString(draft.sourceUrl ?? model.sourceUrl),
        contextWindow:
          draft.contextWindow === undefined
            ? model.contextWindow
            : draft.contextWindow,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update model.");
      return;
    }

    setModels((current) =>
      current.map((item) =>
        item.id === model.id ? toModelRow(payload.model) : item,
      ),
    );
    setMessage("Model updated.");
  }

  async function handleHide(model: AdminModelRow) {
    setMessage("");

    const response = await fetch(`/api/admin/models/${model.id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to hide model.");
      return;
    }

    setModels((current) =>
      current.map((item) =>
        item.id === model.id ? toModelRow(payload.model) : item,
      ),
    );
    setMessage("Model hidden.");
  }

  return (
    <div className="grid gap-6">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前展示 fixture 数据。配置
          <code className="mx-1 rounded bg-white px-1">DATABASE_URL</code>
          后，下面的创建、编辑和隐藏操作会启用。
        </section>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Create model</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Provider</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              disabled={!databaseConfigured}
              value={form.providerId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  providerId: event.target.value,
                }))
              }
              required
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>
          <TextInput
            disabled={!databaseConfigured}
            label="Display name"
            value={form.displayName}
            onChange={(value) =>
              setForm((current) => ({ ...current, displayName: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Slug"
            value={form.slug}
            onChange={(value) =>
              setForm((current) => ({ ...current, slug: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Canonical model id"
            value={form.canonicalModelId}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                canonicalModelId: value,
              }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Family"
            value={form.family}
            onChange={(value) =>
              setForm((current) => ({ ...current, family: value }))
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
            label="Context window"
            type="number"
            value={form.contextWindow}
            onChange={(value) =>
              setForm((current) => ({ ...current, contextWindow: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Max output tokens"
            type="number"
            value={form.maxOutputTokens}
            onChange={(value) =>
              setForm((current) => ({ ...current, maxOutputTokens: value }))
            }
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Checkbox
            checked={form.supportsVision}
            disabled={!databaseConfigured}
            label="Vision"
            onChange={(value) =>
              setForm((current) => ({ ...current, supportsVision: value }))
            }
          />
          <Checkbox
            checked={form.supportsReasoning}
            disabled={!databaseConfigured}
            label="Reasoning"
            onChange={(value) =>
              setForm((current) => ({ ...current, supportsReasoning: value }))
            }
          />
          <Checkbox
            checked={form.supportsFunctionCalling}
            disabled={!databaseConfigured}
            label="Function calling"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                supportsFunctionCalling: value,
              }))
            }
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

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source URL</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((model) => {
                const draft = drafts[model.id] ?? {};
                return (
                  <tr key={model.id}>
                    <td className="min-w-64 px-4 py-4">
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                        disabled={!databaseConfigured}
                        value={draft.displayName ?? model.displayName}
                        onChange={(event) =>
                          updateDraft(setDrafts, model.id, {
                            displayName: event.target.value,
                          })
                        }
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {model.slug}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {providerNameById.get(model.providerId) ??
                        model.providerName}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="rounded-md border border-slate-300 px-3 py-2"
                        disabled={!databaseConfigured}
                        value={draft.status ?? model.status}
                        onChange={(event) =>
                          updateDraft(setDrafts, model.id, {
                            status: event.target
                              .value as AdminModelRow["status"],
                          })
                        }
                      >
                        <option value="active">active</option>
                        <option value="deprecated">deprecated</option>
                        <option value="hidden">hidden</option>
                      </select>
                    </td>
                    <td className="min-w-72 px-4 py-4">
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                        disabled={!databaseConfigured}
                        value={draft.sourceUrl ?? model.sourceUrl}
                        onChange={(event) =>
                          updateDraft(setDrafts, model.id, {
                            sourceUrl: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-400"
                          disabled={!databaseConfigured}
                          onClick={() => handleSave(model)}
                          type="button"
                        >
                          Save
                        </button>
                        <button
                          className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:text-slate-400"
                          disabled={
                            !databaseConfigured || model.status === "hidden"
                          }
                          onClick={() => handleHide(model)}
                          type="button"
                        >
                          Hide
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TextInput({
  disabled,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
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
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
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

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return Number(value);
}

function toModelRow(model: {
  id: string;
  providerId: string;
  provider: { name: string };
  slug: string;
  canonicalModelId: string;
  displayName: string;
  family: string | null;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsFunctionCalling: boolean;
  sourceUrl: string | null;
  status: AdminModelRow["status"];
}): AdminModelRow {
  return {
    id: model.id,
    providerId: model.providerId,
    providerName: model.provider.name,
    slug: model.slug,
    canonicalModelId: model.canonicalModelId,
    displayName: model.displayName,
    family: model.family ?? "",
    contextWindow: model.contextWindow,
    maxOutputTokens: model.maxOutputTokens,
    supportsVision: model.supportsVision,
    supportsReasoning: model.supportsReasoning,
    supportsFunctionCalling: model.supportsFunctionCalling,
    sourceUrl: model.sourceUrl ?? "",
    status: model.status,
  };
}

function updateDraft(
  setDrafts: (
    updater: (
      current: Record<string, Partial<AdminModelRow>>,
    ) => Record<string, Partial<AdminModelRow>>,
  ) => void,
  id: string,
  patch: Partial<AdminModelRow>,
) {
  setDrafts((current) => ({
    ...current,
    [id]: { ...current[id], ...patch },
  }));
}
