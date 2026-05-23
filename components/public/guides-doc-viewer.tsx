"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MarkdownText } from "@/components/public/markdown-text";
import type { GuidePublic } from "@/lib/data-access/guides";
import { formatDate } from "@/lib/formatters/number";

type Props = {
  guides: GuidePublic[];
  initialSlug?: string;
};

export function GuidesDocViewer({ guides, initialSlug }: Props) {
  const initialGuide =
    guides.find((guide) => guide.slug === initialSlug) ?? guides[0] ?? null;
  const [selectedSlug, setSelectedSlug] = useState(initialGuide?.slug ?? "");
  const selectedGuide = useMemo(
    () =>
      guides.find((guide) => guide.slug === selectedSlug) ?? guides[0] ?? null,
    [guides, selectedSlug],
  );

  function selectGuide(slug: string) {
    setSelectedSlug(slug);
    const params = new URLSearchParams(window.location.search);
    params.set("guide", slug);
    window.history.replaceState(null, "", `/guides?${params.toString()}`);
  }

  if (!selectedGuide) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        暂无已发布指南。
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
        <label className="grid gap-2 text-sm font-medium text-slate-700 lg:hidden">
          选择指南
          <select
            className="rounded-md border border-slate-300 px-3 py-2"
            value={selectedGuide.slug}
            onChange={(event) => selectGuide(event.target.value)}
          >
            {guides.map((guide) => (
              <option key={guide.slug} value={guide.slug}>
                {guide.title}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden lg:block">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            文档目录
          </p>
          <nav className="grid gap-1">
            {guides.map((guide) => (
              <button
                className={`rounded-md px-3 py-2 text-left text-sm ${
                  selectedGuide.slug === guide.slug
                    ? "bg-blue-50 text-blue-800"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                key={guide.slug}
                onClick={() => selectGuide(guide.slug)}
                type="button"
              >
                <span className="block font-medium">{guide.title}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {guide.category} · {formatDate(guide.updatedAt)}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="blue">{selectedGuide.category}</Badge>
            <span className="text-sm text-slate-500">
              Updated {formatDate(selectedGuide.updatedAt)}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            {selectedGuide.title}
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            {selectedGuide.description}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:underline"
            href={`/guides/${selectedGuide.slug}`}
          >
            打开独立页面
          </Link>
        </div>
        <MarkdownText content={selectedGuide.contentMd} />
      </article>
    </div>
  );
}
