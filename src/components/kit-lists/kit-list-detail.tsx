"use client";

import { useTransition, useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KitList } from "@/db/schema";
import type { getKitListItems, getActiveGearForPicker } from "@/server/kit-lists";
import {
  addKitListItemAction,
  removeKitListItemAction,
  toggleOptionalAction,
} from "@/app/kits/actions";
import { formatWeight } from "@/lib/format";

type Items = Awaited<ReturnType<typeof getKitListItems>>;
type GearOptions = Awaited<ReturnType<typeof getActiveGearForPicker>>;

type Props = {
  list: KitList;
  items: Items;
  gearOptions: GearOptions;
};

function totalWeight(items: Items) {
  const total = items.reduce((sum, i) => sum + (i.gear.weightGrams ?? 0), 0);
  if (total === 0) return null;
  return formatWeight(total);
}

const navLinkClass = "text-sm text-muted-foreground hover:text-foreground";

export function KitListDetail({ list, items, gearOptions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedGearId, setSelectedGearId] = useState<string>("");

  const addedGearIds = useMemo(
    () => new Set(items.map((i) => i.gearItemId)),
    [items],
  );
  const availableGear = useMemo(
    () => gearOptions.filter((g) => !addedGearIds.has(g.id)),
    [gearOptions, addedGearIds],
  );

  const weight = totalWeight(items);

  function handleAdd() {
    if (!selectedGearId) return;
    const formData = new FormData();
    formData.set("kitListId", list.id);
    formData.set("gearItemId", selectedGearId);
    startTransition(async () => {
      await addKitListItemAction(null, formData);
      setSelectedGearId("");
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/kits" className={navLinkClass}>
            ← Kit lists
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{list.name}</h1>
          {list.description && (
            <p className="text-sm text-muted-foreground">{list.description}</p>
          )}
        </div>
        {weight && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total weight</p>
            <p className="font-semibold">{weight}</p>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items yet. Add gear from your inventory below.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {item.gear.name}
                  {item.gear.retiredAt && (
                    <span className="ml-2 text-xs text-muted-foreground">(retired)</span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {item.gear.brand && <span>{item.gear.brand}</span>}
                  {item.gear.weightGrams != null && (
                    <span>{formatWeight(item.gear.weightGrams)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.optional && (
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() =>
                      toggleOptionalAction(list.id, item.id, !item.optional),
                    )
                  }
                >
                  {item.optional ? "Mark required" : "Mark optional"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => removeKitListItemAction(list.id, item.id))
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {availableGear.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
          <Select value={selectedGearId} onValueChange={(v) => setSelectedGearId(v ?? "")}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add gear from your inventory…" />
            </SelectTrigger>
            <SelectContent>
              {availableGear.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                  {g.brand ? ` — ${g.brand}` : ""}
                  {g.weightGrams != null ? ` (${formatWeight(g.weightGrams)})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selectedGearId || isPending} onClick={handleAdd}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
