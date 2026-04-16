"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GearItem } from "@/db/schema";
import type { ActionResult } from "@/app/gear/actions";

const CATEGORIES = [
  { value: "sleep", label: "Sleep" },
  { value: "shelter", label: "Shelter" },
  { value: "insulation", label: "Insulation" },
  { value: "clothing", label: "Clothing" },
  { value: "footwear", label: "Footwear" },
  { value: "cooking", label: "Cooking" },
  { value: "lighting", label: "Lighting" },
  { value: "navigation", label: "Navigation" },
  { value: "safety", label: "Safety" },
  { value: "other", label: "Other" },
];

type Props = {
  item?: GearItem;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  onSuccess?: () => void;
};

export function GearForm({ item, action, onSuccess }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state && "success" in state) onSuccess?.();
  }, [state, onSuccess]);

  const existingTags =
    item?.tags ? (JSON.parse(item.tags) as string[]).join(", ") : "";

  return (
    <form action={formAction} className="grid gap-4">
      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" defaultValue={item?.name} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={item?.brand ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={item?.category ?? ""}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={item?.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="weightGrams">Weight (g)</Label>
          <Input
            id="weightGrams"
            name="weightGrams"
            type="number"
            min={0}
            step={1}
            defaultValue={item?.weightGrams ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tempRatingLowC">Temp low (°C)</Label>
          <Input
            id="tempRatingLowC"
            name="tempRatingLowC"
            type="number"
            step={0.5}
            defaultValue={item?.tempRatingLowC ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tempRatingHighC">Temp high (°C)</Label>
          <Input
            id="tempRatingHighC"
            name="tempRatingHighC"
            type="number"
            step={0.5}
            defaultValue={item?.tempRatingHighC ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="e.g. waterproof, down, 3-season"
          defaultValue={existingTags}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : item ? "Save changes" : "Add item"}
      </Button>
    </form>
  );
}
