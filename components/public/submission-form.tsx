"use client";

import { FormEvent, useState } from "react";

type SubmissionType =
  | "relay_submission"
  | "price_correction"
  | "model_correction"
  | "general_feedback";

const submissionTypes: Array<{ label: string; value: SubmissionType }> = [
  { label: "价格纠错", value: "price_correction" },
  { label: "中转站投稿", value: "relay_submission" },
  { label: "模型信息纠错", value: "model_correction" },
  { label: "普通反馈", value: "general_feedback" },
];

export function SubmissionForm({
  defaultType = "price_correction",
  description = "投稿和纠错会先进入 pending 状态，人工审核后才会影响公开数据。",
  relayMode = false,
  title = "提交反馈",
}: {
  defaultType?: SubmissionType;
  description?: string;
  relayMode?: boolean;
  title?: string;
}) {
  const [type, setType] = useState<SubmissionType>(defaultType);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        submitterName: stringValue(formData.get("submitterName")),
        submitterEmail: stringValue(formData.get("submitterEmail")),
        companyWebsite: optionalStringValue(formData.get("companyWebsite")),
        payload: {
          subject: stringValue(formData.get("subject")),
          message: stringValue(formData.get("message")),
          sourceUrl: optionalStringValue(formData.get("sourceUrl")),
          modelName: optionalStringValue(formData.get("modelName")),
          relayName: optionalStringValue(formData.get("relayName")),
          channelType: optionalStringValue(formData.get("channelType")),
          paymentMethods: optionalStringValue(formData.get("paymentMethods")),
          minimumTopUp: optionalStringValue(formData.get("minimumTopUp")),
          supportedProviders: optionalStringValue(
            formData.get("supportedProviders"),
          ),
          pricingNotes: optionalStringValue(formData.get("pricingNotes")),
          displayedPrice: optionalStringValue(formData.get("displayedPrice")),
          correctedPrice: optionalStringValue(formData.get("correctedPrice")),
        },
      }),
    });

    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Submission failed.");
      return;
    }

    event.currentTarget.reset();
    setMessage(
      payload.persisted === false
        ? "反馈已通过校验。配置数据库后会写入待审核队列。"
        : "反馈已提交，会进入后台待审核队列。",
    );
  }

  return (
    <form
      className="mt-8 rounded-xl border bg-card p-5 shadow-soft"
      onSubmit={handleSubmit}
    >
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input
          aria-hidden="true"
          autoComplete="off"
          className="hidden"
          name="companyWebsite"
          tabIndex={-1}
          type="text"
        />
        {relayMode ? (
          <input name="type" type="hidden" value="relay_submission" />
        ) : (
          <label className="grid gap-1 text-sm">
            <span className="font-medium">类型</span>
            <select
              className="rounded-md border border-input bg-card px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
              value={type}
              onChange={(event) =>
                setType(event.target.value as SubmissionType)
              }
            >
              {submissionTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <TextInput label="主题" name="subject" required />
        <TextInput label="你的称呼" name="submitterName" />
        <TextInput label="邮箱" name="submitterEmail" type="email" />
        {relayMode ? null : <TextInput label="模型名称" name="modelName" />}
        <TextInput
          label={relayMode ? "中转站名称" : "中转站名称"}
          name="relayName"
        />
        {relayMode ? (
          <>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">入口类型</span>
              <select
                className="rounded-md border border-input bg-card px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
                defaultValue="third_party_relay"
                name="channelType"
              >
                <option value="third_party_relay">二次中转</option>
                <option value="official_direct">官方直连</option>
              </select>
            </label>
            <TextInput label="支付方式" name="paymentMethods" />
            <TextInput label="起充金额" name="minimumTopUp" />
            <TextInput label="支持模型厂商" name="supportedProviders" />
            <TextInput label="价格说明" name="pricingNotes" />
          </>
        ) : (
          <>
            <TextInput label="当前展示价格" name="displayedPrice" />
            <TextInput label="正确价格" name="correctedPrice" />
          </>
        )}
        <TextInput label="来源链接" name="sourceUrl" type="url" />
      </div>

      <label className="mt-4 grid gap-1 text-sm">
        <span className="font-medium">说明</span>
        <textarea
          className="min-h-32 rounded-md border border-input bg-card px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
          maxLength={4000}
          name="message"
          required
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "提交中..." : "提交"}
        </button>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </div>
    </form>
  );
}

function TextInput({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-md border border-input bg-card px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function optionalStringValue(value: FormDataEntryValue | null) {
  const output = stringValue(value).trim();
  return output ? output : undefined;
}
