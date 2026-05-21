"use client";

import { FormEvent, useState } from "react";
import { AdPlacementPublic } from "@/lib/data-access/ad-placements";

type FormState = {
  slotKey: string;
  name: string;
  pageType: string;
  position: string;
  provider: string;
  adCode: string;
  isEnabled: boolean;
};

type Props = {
  databaseConfigured: boolean;
  initialPlacements: AdPlacementPublic[];
};

const emptyForm: FormState = {
  slotKey: "",
  name: "",
  pageType: "home",
  position: "sidebar",
  provider: "adsense",
  adCode: "",
  isEnabled: false,
};

export function AdPlacementsPanel({
  databaseConfigured,
  initialPlacements,
}: Props) {
  const [placements, setPlacements] = useState(initialPlacements);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/ad-placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save ad placement.");
      return;
    }

    setPlacements((current) => [
      toPlacement(payload.placement),
      ...current.filter((item) => item.slotKey !== payload.placement.slotKey),
    ]);
    setForm(emptyForm);
    setMessage("Ad placement saved.");
  }

  async function togglePlacement(placement: AdPlacementPublic) {
    setMessage("");

    const response = await fetch(
      `/api/admin/ad-placements/${placement.slotKey}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !placement.isEnabled }),
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update ad placement.");
      return;
    }

    setPlacements((current) =>
      current.map((item) =>
        item.slotKey === placement.slotKey
          ? toPlacement(payload.placement)
          : item,
      ),
    );
    setMessage("Ad placement updated.");
  }

  return (
    <div className="grid gap-6">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前仅展示默认广告位。所有广告位默认关闭。
        </section>
      ) : null}

      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-lg font-semibold">Create ad placement</h2>
        <p className="mt-2 text-sm text-slate-600">
          V1 只配置广告位，不启用真实
          AdSense。广告必须和内容、推荐链接明确区分。
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextInput
            disabled={!databaseConfigured}
            label="Slot key"
            value={form.slotKey}
            onChange={(value) =>
              setForm((current) => ({ ...current, slotKey: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Name"
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({ ...current, name: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Page type"
            value={form.pageType}
            onChange={(value) =>
              setForm((current) => ({ ...current, pageType: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Position"
            value={form.position}
            onChange={(value) =>
              setForm((current) => ({ ...current, position: value }))
            }
            required
          />
          <TextInput
            disabled={!databaseConfigured}
            label="Provider"
            value={form.provider}
            onChange={(value) =>
              setForm((current) => ({ ...current, provider: value }))
            }
            required
          />
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              checked={form.isEnabled}
              disabled={!databaseConfigured}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isEnabled: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>Enable placement</span>
          </label>
        </div>
        <label className="mt-4 grid gap-1 text-sm">
          <span className="font-medium">Ad code placeholder</span>
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
            disabled={!databaseConfigured}
            value={form.adCode}
            onChange={(event) =>
              setForm((current) => ({ ...current, adCode: event.target.value }))
            }
          />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!databaseConfigured}
            type="submit"
          >
            Save placement
          </button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </form>

      <div className="grid gap-4">
        {placements.map((placement) => (
          <section
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={placement.slotKey}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{placement.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {placement.isEnabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {placement.slotKey} · {placement.pageType} ·{" "}
                  {placement.position} · {placement.provider}
                </p>
              </div>
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={!databaseConfigured}
                onClick={() => togglePlacement(placement)}
                type="button"
              >
                {placement.isEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TextInput({
  disabled,
  label,
  onChange,
  required,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
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
        value={value}
      />
    </label>
  );
}

function toPayload(form: FormState) {
  return {
    ...form,
    adCode: form.adCode.trim() ? form.adCode : null,
  };
}

function toPlacement(placement: AdPlacementPublic): AdPlacementPublic {
  return {
    slotKey: placement.slotKey,
    name: placement.name,
    pageType: placement.pageType,
    position: placement.position,
    provider: placement.provider,
    adCode: placement.adCode,
    isEnabled: placement.isEnabled,
  };
}
