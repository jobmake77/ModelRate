import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ModelRate Admin",
  robots: {
    index: false,
    follow: false,
  },
};

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/model-prices", label: "Model Prices" },
  { href: "/relays", label: "Public Relays" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-slate-800 p-5 lg:border-b-0 lg:border-r">
          <Link href="/" className="text-lg font-semibold">
            ModelRate Admin
          </Link>
          <nav className="mt-8 grid gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="bg-slate-50 p-5 text-slate-950 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
