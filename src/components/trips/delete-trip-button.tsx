"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteTripAction } from "@/app/trips/actions";

export function DeleteTripButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteTripAction(id);
          router.push("/trips");
        })
      }
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
