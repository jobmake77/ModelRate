import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/tools/token-cost-calculator", label: "成本计算" },
  { href: "/tools/model-rate-calculator", label: "倍率计算" },
  { href: "/models", label: "模型价格" },
  { href: "/relays", label: "中转站" },
  { href: "/guides", label: "指南" },
  { href: "/admin", label: "管理后台" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              MR
            </span>
            <div>
              <div className="text-base font-semibold">ModelRate</div>
              <div className="text-xs text-slate-500">
                AI API cost transparency
              </div>
            </div>
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm text-slate-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>价格仅供估算，调用前请以官方或服务商实际价格为准。</p>
          <div className="flex gap-4">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
