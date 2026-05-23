"use client";

import Link from "next/link";
import { useState } from "react";

type Locale = "zh" | "en";

const navItems = [
  { href: "/", labels: { zh: "首页", en: "Home" } },
  { href: "/models", labels: { zh: "模型价格", en: "Models" } },
  { href: "/relays", labels: { zh: "中转站", en: "Relays" } },
  { href: "/guides", labels: { zh: "指南", en: "Guides" } },
  { href: "/about", labels: { zh: "关于", en: "About" } },
];

const copy = {
  zh: {
    subtitle: "AI API 成本透明化",
    toggleLabel: "Language",
  },
  en: {
    subtitle: "AI API cost transparency",
    toggleLabel: "Language",
  },
};

export function SiteHeader() {
  const [locale, setLocale] = useState<Locale>("zh");

  function updateLocale(nextLocale: Locale) {
    setLocale(nextLocale);
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              MR
            </span>
            <div>
              <div className="text-base font-semibold">ModelRate</div>
              <div className="text-xs text-slate-500">
                {copy[locale].subtitle}
              </div>
            </div>
          </Link>

          <div
            aria-label={copy[locale].toggleLabel}
            className="inline-flex overflow-hidden rounded-md border border-slate-300 text-sm"
            role="group"
          >
            {(["zh", "en"] as const).map((item) => (
              <button
                className={`px-3 py-2 font-medium ${
                  locale === item
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
                key={item}
                onClick={() => updateLocale(item)}
                type="button"
              >
                {item === "zh" ? "中文" : "English"}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 text-sm text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950"
            >
              {item.labels[locale]}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
