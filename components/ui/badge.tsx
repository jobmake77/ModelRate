import type { ReactNode } from "react";

type BadgeTone = "blue" | "green" | "amber" | "slate";

const tones: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
