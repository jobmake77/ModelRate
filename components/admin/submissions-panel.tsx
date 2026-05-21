"use client";

import { useState } from "react";
import { formatDate } from "@/lib/formatters/number";

export type AdminSubmissionRow = {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  submitterEmail: string | null;
  subject: string;
  message: string;
  sourceUrl: string | null;
  reviewNotes: string | null;
  createdAt: string;
};

type Props = {
  databaseConfigured: boolean;
  initialSubmissions: AdminSubmissionRow[];
};

export function SubmissionsPanel({
  databaseConfigured,
  initialSubmissions,
}: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function reviewSubmission(
    submission: AdminSubmissionRow,
    status: "approved" | "rejected",
  ) {
    setMessage("");

    const response = await fetch(
      `/api/admin/submissions/${submission.id}/review`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewNotes: notes[submission.id] ?? "",
        }),
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to review submission.");
      return;
    }

    setSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id
          ? { ...item, status, reviewNotes: notes[item.id] ?? "" }
          : item,
      ),
    );
    setMessage(`Submission ${status}.`);
  }

  return (
    <div className="grid gap-5">
      {!databaseConfigured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前只能验证提交格式，不能展示或审核真实队列。
        </section>
      ) : null}

      {message ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {message}
        </section>
      ) : null}

      {submissions.length ? (
        submissions.map((submission) => (
          <section
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={submission.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {submission.subject}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {submission.status}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    {submission.type}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {submission.message}
                </p>
                <dl className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                  <div>
                    <dt className="font-medium text-slate-900">Submitter</dt>
                    <dd>{submission.submitterEmail ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">Created</dt>
                    <dd>{formatDate(submission.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">Source</dt>
                    <dd>
                      {submission.sourceUrl ? (
                        <a
                          className="text-blue-700 hover:underline"
                          href={submission.sourceUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Open source
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid min-w-72 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Review notes</span>
                  <textarea
                    className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
                    disabled={
                      !databaseConfigured || submission.status !== "pending"
                    }
                    value={notes[submission.id] ?? submission.reviewNotes ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [submission.id]: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={
                      !databaseConfigured || submission.status !== "pending"
                    }
                    onClick={() => reviewSubmission(submission, "approved")}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={
                      !databaseConfigured || submission.status !== "pending"
                    }
                    onClick={() => reviewSubmission(submission, "rejected")}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </section>
        ))
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No submissions yet.
        </section>
      )}
    </div>
  );
}
