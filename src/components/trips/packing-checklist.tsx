"use client";

import { useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatWeight } from "@/lib/format";
import { togglePackedItemAction, removeTripPackingItemAction } from "@/app/trips/actions";

type PackingItem = {
  id: string;
  name: string;
  weightGrams: number | null;
  category: string | null;
  optional: boolean;
  packed: boolean;
  notes: string | null;
};

type Props = {
  tripId: string;
  items: PackingItem[];
};

function PackingItemRow({
  item,
  tripId,
}: {
  item: PackingItem;
  tripId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={item.packed}
        disabled={isPending}
        onChange={(e) =>
          startTransition(async () => {
            await togglePackedItemAction(item.id, e.target.checked, tripId);
          })
        }
        className="size-4 cursor-pointer rounded accent-primary"
        aria-label={`Mark ${item.name} as ${item.packed ? "unpacked" : "packed"}`}
      />
      <span
        className={`flex-1 text-sm ${item.packed ? "text-muted-foreground line-through" : ""}`}
      >
        {item.name}
        {item.optional && (
          <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>
        )}
        {item.notes && (
          <span className="ml-1.5 text-xs text-muted-foreground">— {item.notes}</span>
        )}
      </span>
      {item.weightGrams != null && (
        <span className="text-xs text-muted-foreground">{formatWeight(item.weightGrams)}</span>
      )}
      <button
        onClick={() =>
          startTransition(async () => {
            await removeTripPackingItemAction(item.id, tripId);
          })
        }
        disabled={isPending}
        className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
        aria-label={`Remove ${item.name}`}
      >
        ✕
      </button>
    </li>
  );
}

export function PackingChecklist({ tripId, items }: Props) {
  const byCategory = useMemo(() => {
    const map = new Map<string, PackingItem[]>();
    for (const item of items) {
      const cat = item.category ?? "Other";
      const list = map.get(cat) ?? [];
      list.push(item);
      map.set(cat, list);
    }
    return map;
  }, [items]);

  const totalWeight = useMemo(
    () => items.reduce((acc, i) => acc + (i.weightGrams ?? 0), 0),
    [items],
  );
  const packedWeight = useMemo(
    () => items.filter((i) => i.packed).reduce((acc, i) => acc + (i.weightGrams ?? 0), 0),
    [items],
  );

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No items yet. Add gear below or attach a kit list when creating a trip.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {items.filter((i) => i.packed).length}/{items.length} packed
        </span>
        {totalWeight > 0 && (
          <span>
            {formatWeight(packedWeight)} / {formatWeight(totalWeight)}
          </span>
        )}
      </div>

      {Array.from(byCategory.entries()).map(([category, catItems]) => (
        <div key={category} className="mb-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {category}
          </p>
          <ul className="divide-y rounded-lg border">
            {catItems.map((item) => (
              <PackingItemRow key={item.id} item={item} tripId={tripId} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
