import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "ModelRate Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/model-prices", label: "Model Prices" },
  { href: "/admin/relays", label: "Relays" },
  { href: "/admin/relay-prices", label: "Relay Prices" },
  { href: "/admin/guides", label: "Guides" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/ad-placements", label: "Ad Placements" },
  { href: "/admin/users", label: "Admin Users" },
  { href: "/relays", label: "Public Relays" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-slate-800 p-5 lg:border-b-0 lg:border-r">
          <Link href="/" className="text-lg font-semibold">
            ModelRate Admin
          </Link>
          <div className="mt-4 rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
            <div className="truncate text-slate-200">{admin.email}</div>
            <div className="mt-1 uppercase tracking-wide">{admin.role}</div>
          </div>
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
          <form action="/admin/logout" className="mt-8" method="post">
            <button
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
              type="submit"
            >
              Logout
            </button>
          </form>
        </aside>
        <main className="bg-slate-50 p-5 text-slate-950 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
