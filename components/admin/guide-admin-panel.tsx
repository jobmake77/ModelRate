"use client";

import { FormEvent, useState } from "react";
import { AdminGuideRow } from "@/lib/data-access/guides";
import { formatDate } from "@/lib/formatters/number";

type GuideStatus = "draft" | "published" | "archived";

type GuideFormState = {
  slug: string;
  title: string;
  description: string;
  contentMd: string;
  category: string;
  status: GuideStatus;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
};

type Props = {
  databaseConfigured: boolean;
  initialGuides: AdminGuideRow[];
};

const emptyForm: GuideFormState = {
  slug: "",
  title: "",
  description: "",
  contentMd: "",
  category: "calculator",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  publishedAt: new Date().toISOString().slice(0, 10),
};

export function GuideAdminPanel({ databaseConfigured, initialGuides }: Props) {
  const [guides, setGuides] = useState(initialGuides);
  const [form, setForm] = useState(emptyForm);
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminGuideRow>>>(
    {},
  );
  const [message, setMessage] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toCreatePayload(form)),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create guide.");
      return;
    }

    setGuides((current) => [toGuideRow(payload.guide), ...current]);
    setForm(emptyForm);
    setMessage("Guide created.");
  }

  async function handleSave(guide: AdminGuideRow) {
    const draft = drafts[guide.id] ?? {};
    setMessage("");

    const response = await fetch(`/api/admin/guides/${guide.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toUpdatePayload(guide, draft)),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update guide.");
      return;
    }

    setGuides((current) =>
      current.map((item) =>
        item.id === guide.id ? toGuideRow(payload.guide) : item,
      ),
    );
    setDrafts((current) => {
      const next = { ...current };
      delete next[guide.id];
      return next;
    });
    setMessage("Guide updated.");
  }

  async function handleArchive(guide: AdminGuideRow) {
    setMessage("");

    const response = await fetch(`/api/admin/guides/${guide.id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to archive guide.");
      return;
    }

    setGuides((current) =>
      current.map((item) =>
        item.id === guide.id ? toGuideRow(payload.guide) : item,
      ),
    );
    setMessage("Guide archived.");
  }

  return (
    <div className="grid gap-6">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前展示 fixture
          指南。配置数据库后可创建、编辑和归档。
        </section>
      ) : null}

      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-lg font-semibold">Create guide</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextInput
            disabled={!databaseConfigured}
            label="Title"
            required
            value={form.title}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                title: value,
                seoTitle: current.seoTitle || value,
              }))
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
            label="Category"
            required
            value={form.category}
            onChange={(value) =>
              setForm((current) => ({ ...current, category: value }))
            }
          />
          <SelectInput
            disabled={!databaseConfigured}
            label="Status"
            options={["draft", "published", "archived"]}
            value={form.status}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as GuideStatus,
              }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="SEO title"
            required
            value={form.seoTitle}
            onChange={(value) =>
              setForm((current) => ({ ...current, seoTitle: value }))
            }
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Published at"
            type="date"
            value={form.publishedAt}
            onChange={(value) =>
              setForm((current) => ({ ...current, publishedAt: value }))
            }
          />
        </div>

        <TextareaInput
          disabled={!databaseConfigured}
          label="Description"
          required
          value={form.description}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              description: value,
              seoDescription: current.seoDescription || value,
            }))
          }
        />
        <TextareaInput
          disabled={!databaseConfigured}
          label="SEO description"
          required
          value={form.seoDescription}
          onChange={(value) =>
            setForm((current) => ({ ...current, seoDescription: value }))
          }
        />
        <TextareaInput
          disabled={!databaseConfigured}
          label="Markdown content"
          required
          rows={10}
          value={form.contentMd}
          onChange={(value) =>
            setForm((current) => ({ ...current, contentMd: value }))
          }
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
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
        {guides.map((guide) => {
          const draft = drafts[guide.id] ?? {};
          return (
            <section
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={guide.id}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="min-w-0 rounded-md border border-slate-300 px-3 py-2 text-lg font-semibold"
                      disabled={!databaseConfigured}
                      value={draft.title ?? guide.title}
                      onChange={(event) =>
                        updateDraft(setDrafts, guide.id, {
                          title: event.target.value,
                        })
                      }
                    />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {draft.status ?? guide.status}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      {draft.category ?? guide.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    /guides/{guide.slug} · updated {formatDate(guide.updatedAt)}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {draft.description ?? guide.description}
                  </p>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-blue-700">
                      Edit content and SEO
                    </summary>
                    <div className="mt-4 grid gap-4">
                      <TextInput
                        disabled={!databaseConfigured}
                        label="Slug"
                        value={draft.slug ?? guide.slug}
                        onChange={(value) =>
                          updateDraft(setDrafts, guide.id, { slug: value })
                        }
                      />
                      <TextareaInput
                        disabled={!databaseConfigured}
                        label="Description"
                        value={draft.description ?? guide.description}
                        onChange={(value) =>
                          updateDraft(setDrafts, guide.id, {
                            description: value,
                          })
                        }
                      />
                      <TextareaInput
                        disabled={!databaseConfigured}
                        label="Markdown content"
                        rows={8}
                        value={draft.contentMd ?? guide.contentMd}
                        onChange={(value) =>
                          updateDraft(setDrafts, guide.id, {
                            contentMd: value,
                          })
                        }
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextInput
                          disabled={!databaseConfigured}
                          label="SEO title"
                          value={draft.seoTitle ?? guide.seoTitle}
                          onChange={(value) =>
                            updateDraft(setDrafts, guide.id, {
                              seoTitle: value,
                            })
                          }
                        />
                        <TextInput
                          disabled={!databaseConfigured}
                          label="Category"
                          value={draft.category ?? guide.category}
                          onChange={(value) =>
                            updateDraft(setDrafts, guide.id, {
                              category: value,
                            })
                          }
                        />
                      </div>
                      <TextareaInput
                        disabled={!databaseConfigured}
                        label="SEO description"
                        value={draft.seoDescription ?? guide.seoDescription}
                        onChange={(value) =>
                          updateDraft(setDrafts, guide.id, {
                            seoDescription: value,
                          })
                        }
                      />
                    </div>
                  </details>
                </div>
                <div className="grid min-w-60 content-start gap-3">
                  <SelectInput
                    disabled={!databaseConfigured}
                    label="Status"
                    options={["draft", "published", "archived"]}
                    value={draft.status ?? guide.status}
                    onChange={(value) =>
                      updateDraft(setDrafts, guide.id, {
                        status: value as GuideStatus,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-400"
                      disabled={!databaseConfigured}
                      onClick={() => handleSave(guide)}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      disabled={
                        !databaseConfigured || guide.status === "archived"
                      }
                      onClick={() => handleArchive(guide)}
                      type="button"
                    >
                      Archive
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

function TextareaInput({
  disabled,
  label,
  onChange,
  required,
  rows = 3,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  value: string;
}) {
  return (
    <label className="mt-4 grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        className="rounded-md border border-slate-300 px-3 py-2"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={rows}
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

function toCreatePayload(form: GuideFormState) {
  return {
    slug: form.slug,
    title: form.title,
    description: form.description,
    contentMd: form.contentMd,
    category: form.category,
    status: form.status,
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    publishedAt: form.publishedAt || null,
  };
}

function toUpdatePayload(guide: AdminGuideRow, draft: Partial<AdminGuideRow>) {
  return {
    slug: draft.slug ?? guide.slug,
    title: draft.title ?? guide.title,
    description: draft.description ?? guide.description,
    contentMd: draft.contentMd ?? guide.contentMd,
    category: draft.category ?? guide.category,
    status: draft.status ?? guide.status,
    seoTitle: draft.seoTitle ?? guide.seoTitle,
    seoDescription: draft.seoDescription ?? guide.seoDescription,
    publishedAt: draft.publishedAt ?? guide.publishedAt,
  };
}

function toGuideRow(guide: {
  category: string;
  contentMd: string;
  createdAt?: Date | string;
  description: string;
  id: string;
  publishedAt: Date | string | null;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  status: GuideStatus;
  title: string;
  updatedAt: Date | string;
}): AdminGuideRow {
  return {
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    description: guide.description,
    contentMd: guide.contentMd,
    category: guide.category,
    status: guide.status,
    seoTitle: guide.seoTitle,
    seoDescription: guide.seoDescription,
    publishedAt: guide.publishedAt
      ? new Date(guide.publishedAt).toISOString()
      : new Date(guide.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(guide.updatedAt).toISOString(),
  };
}

function updateDraft<T extends { id: string }>(
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, Partial<T>>>>,
  id: string,
  patch: Partial<T>,
) {
  setDrafts((current) => ({
    ...current,
    [id]: { ...current[id], ...patch },
  }));
}
