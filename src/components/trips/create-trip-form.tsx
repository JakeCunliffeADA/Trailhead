"use client";

import { useActionState } from "react";
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
import { createTripAction } from "@/app/trips/actions";

type KitListOption = { id: string; name: string };

type Props = { kitLists: KitListOption[] };

export function CreateTripForm({ kitLists }: Props) {
  const [state, formAction, isPending] = useActionState<{ error: string } | null, FormData>(
    createTripAction,
    null,
  );

  return (
    <form action={formAction} className="grid gap-5">
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" required placeholder="e.g. Loch Lomond weekend" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="startDate">Start date *</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="endDate">End date *</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>

      {kitLists.length > 0 && (
        <div className="grid gap-1.5">
          <Label>Kit list (optional)</Label>
          <p className="text-xs text-muted-foreground">
            Selecting a kit list will snapshot its items into this trip&apos;s packing checklist.
          </p>
          <Select name="kitListId">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No kit list" />
            </SelectTrigger>
            <SelectContent>
              {kitLists.map((kl) => (
                <SelectItem key={kl.id} value={kl.id}>
                  {kl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create trip"}
      </Button>
    </form>
  );
}
