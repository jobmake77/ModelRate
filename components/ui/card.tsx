import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="border-b border-slate-200 px-5 py-4">{children}</div>;
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}
