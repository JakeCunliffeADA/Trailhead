"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GearForm } from "./gear-form";
import type { GearItem } from "@/db/schema";
import { editGearItemAction, retireGearItemAction } from "@/app/gear/actions";

function formatWeight(grams: number | null) {
  if (grams == null) return "—";
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

function formatTempRange(low: number | null, high: number | null) {
  if (low == null && high == null) return "—";
  if (low != null && high != null) return `${low}°C – ${high}°C`;
  if (low != null) return `≥ ${low}°C`;
  return `≤ ${high}°C`;
}

type Props = { items: GearItem[] };

export function GearTable({ items }: Props) {
  const [editItem, setEditItem] = useState<GearItem | null>(null);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No gear yet. Add your first item above.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Temp range</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const tags = JSON.parse(item.tags) as string[];
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.brand ?? "—"}
                </TableCell>
                <TableCell className="capitalize">{item.category ?? "—"}</TableCell>
                <TableCell>{formatWeight(item.weightGrams)}</TableCell>
                <TableCell>
                  {formatTempRange(item.tempRatingLowC, item.tempRatingHighC)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditItem(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => retireGearItemAction(item.id))
                      }
                    >
                      Retire
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editItem?.name}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <GearForm
              item={editItem}
              action={editGearItemAction.bind(null, editItem.id)}
              onSuccess={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
