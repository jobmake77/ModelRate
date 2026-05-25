import { getAdPlacementBySlot } from "@/lib/data-access/ad-placements";

export async function AdSlot({ slotKey }: { slotKey: string }) {
  const placement = await getAdPlacementBySlot(slotKey);

  if (!placement?.isEnabled || !placement.adCode) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft"
      data-ad-slot={placement.slotKey}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        Advertisement
      </div>
      <div>{placement.adCode}</div>
    </aside>
  );
}
