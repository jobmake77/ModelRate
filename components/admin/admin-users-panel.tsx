"use client";

import { FormEvent, useState } from "react";
import { formatDate } from "@/lib/formatters/number";

type AdminRole = "owner" | "admin" | "editor" | "viewer";
type AdminStatus = "active" | "disabled";

export type AdminUserRow = {
  authUserId: string | null;
  createdAt: string;
  email: string;
  id: string;
  lastLoginAt: string | null;
  name: string | null;
  role: AdminRole;
  status: string;
};

type Props = {
  databaseConfigured: boolean;
  initialUsers: AdminUserRow[];
};

const roles: AdminRole[] = ["owner", "admin", "editor", "viewer"];
const statuses: AdminStatus[] = ["active", "disabled"];

export function AdminUsersPanel({ databaseConfigured, initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminUserRow>>>(
    {},
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authUserId: nullableString(formData.get("authUserId")),
        email: stringValue(formData.get("email")),
        name: nullableString(formData.get("name")),
        role: stringValue(formData.get("role")),
        status: stringValue(formData.get("status")),
      }),
    });
    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create admin user.");
      return;
    }

    setUsers((current) => [toUserRow(payload.user), ...current]);
    event.currentTarget.reset();
    setMessage("Admin user created.");
  }

  async function handleSave(user: AdminUserRow) {
    const draft = drafts[user.id] ?? {};
    setMessage("");

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authUserId: normalizeNullable(draft.authUserId),
        name: normalizeNullable(draft.name),
        role: draft.role ?? user.role,
        status: draft.status ?? user.status,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update admin user.");
      return;
    }

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id ? toUserRow(payload.user) : item,
      ),
    );
    setMessage("Admin user updated.");
  }

  return (
    <div className="grid gap-6">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前只展示本地 bootstrap 管理员。配置
          <code className="mx-1 rounded bg-white px-1">DATABASE_URL</code>
          后才可维护后台用户。
        </section>
      ) : null}

      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-lg font-semibold">Create admin user</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextInput label="Email" name="email" required type="email" />
          <TextInput label="Name" name="name" />
          <TextInput label="Supabase auth user id" name="authUserId" />
          <SelectInput label="Role" name="role" options={roles} />
          <SelectInput label="Status" name="status" options={statuses} />
        </div>
        <button
          className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!databaseConfigured || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
      </form>

      {message ? (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4">
        {users.map((user) => {
          const draft = drafts[user.id] ?? {};

          return (
            <div
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={user.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{user.email}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Last login:{" "}
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "N/A"}
                  </p>
                </div>
                <div className="text-sm font-medium text-slate-500">
                  {user.status}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Name"
                  name={`name-${user.id}`}
                  onChange={(value) => updateDraft(user.id, { name: value })}
                  value={draft.name ?? user.name ?? ""}
                />
                <TextInput
                  label="Supabase auth user id"
                  name={`auth-${user.id}`}
                  onChange={(value) =>
                    updateDraft(user.id, { authUserId: value })
                  }
                  value={draft.authUserId ?? user.authUserId ?? ""}
                />
                <SelectInput
                  label="Role"
                  name={`role-${user.id}`}
                  onChange={(value) =>
                    updateDraft(user.id, { role: value as AdminRole })
                  }
                  options={roles}
                  value={(draft.role ?? user.role) as string}
                />
                <SelectInput
                  label="Status"
                  name={`status-${user.id}`}
                  onChange={(value) => updateDraft(user.id, { status: value })}
                  options={statuses}
                  value={draft.status ?? user.status}
                />
              </div>

              <button
                className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={!databaseConfigured}
                onClick={() => handleSave(user)}
                type="button"
              >
                Save
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );

  function updateDraft(id: string, draft: Partial<AdminUserRow>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...draft,
      },
    }));
  }
}

function TextInput({
  label,
  name,
  onChange,
  required,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  required?: boolean;
  type?: string;
  value?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-md border border-slate-300 px-3 py-2"
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectInput({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options: string[];
  value?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="rounded-md border border-slate-300 px-3 py-2"
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
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

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: FormDataEntryValue | null) {
  return normalizeNullable(stringValue(value));
}

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toUserRow(
  user: Omit<AdminUserRow, "createdAt" | "lastLoginAt"> & {
    createdAt: Date | string;
    lastLoginAt: Date | string | null;
  },
) {
  return {
    ...user,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt,
    lastLoginAt:
      user.lastLoginAt instanceof Date
        ? user.lastLoginAt.toISOString()
        : user.lastLoginAt,
  };
}
