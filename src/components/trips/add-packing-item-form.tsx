"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTripPackingItemAction } from "@/app/trips/actions";

type Props = { tripId: string };

export function AddPackingItemForm({ tripId }: Props) {
  const boundAction = addTripPackingItemAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState<{ error: string } | null, FormData>(
    boundAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      {state?.error && (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      )}
      <div className="grid min-w-40 flex-1 gap-1">
        <Label htmlFor="add-item-name" className="text-xs">
          Item name *
        </Label>
        <Input id="add-item-name" name="name" placeholder="e.g. Rain jacket" required />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="add-item-weight" className="text-xs">
          Weight (g)
        </Label>
        <Input
          id="add-item-weight"
          name="weightGrams"
          type="number"
          min="0"
          placeholder="—"
          className="w-24"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="add-item-category" className="text-xs">
          Category
        </Label>
        <Input id="add-item-category" name="category" placeholder="e.g. Clothing" className="w-32" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adding…" : "Add item"}
      </Button>
    </form>
  );
}
