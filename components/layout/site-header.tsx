"use client";

import Link from "next/link";
import { GitFork } from "lucide-react";
import { useState } from "react";

type Locale = "zh" | "en";

const navItems = [
  { href: "/", labels: { zh: "首页", en: "Home" } },
  { href: "/models", labels: { zh: "模型价格", en: "Models" } },
  { href: "/relays", labels: { zh: "中转站", en: "Relays" } },
  { href: "/guides", labels: { zh: "指南", en: "Guides" } },
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
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:gap-6 md:px-8">
        <Link
          href="/"
          className="font-display text-[15px] font-semibold tracking-tight"
        >
          ModelRate
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              {item.labels[locale]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            href="https://github.com/jobmake77/ModelRate"
            rel="noreferrer"
            target="_blank"
          >
            <GitFork className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">GitHub</span>
          </a>

          <div
            aria-label={copy[locale].toggleLabel}
            className="inline-flex overflow-hidden rounded-md border border-input bg-card text-sm"
            role="group"
          >
            {(["zh", "en"] as const).map((item) => (
              <button
                className={`px-3 py-1.5 font-medium transition ${
                  locale === item
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-secondary"
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
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-1.5 md:hidden"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {item.labels[locale]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
