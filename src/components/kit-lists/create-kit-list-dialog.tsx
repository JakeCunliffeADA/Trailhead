"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createKitListAction, type ActionResult } from "@/app/kits/actions";

export function CreateKitListDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    createKitListAction,
    null,
  );

  useEffect(() => {
    if (state && "success" in state && state.id) {
      setOpen(false);
      router.push(`/kits/${state.id}`);
    }
  }, [state, router]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New kit list</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create kit list</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="grid gap-4">
            {state && "error" in state && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. 3-season backpacking" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
