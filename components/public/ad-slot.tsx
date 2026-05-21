import { getAdPlacementBySlot } from "@/lib/data-access/ad-placements";

export async function AdSlot({ slotKey }: { slotKey: string }) {
  const placement = await getAdPlacementBySlot(slotKey);

  if (!placement?.isEnabled || !placement.adCode) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm"
      data-ad-slot={placement.slotKey}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Advertisement
      </div>
      <div>{placement.adCode}</div>
    </aside>
  );
}
