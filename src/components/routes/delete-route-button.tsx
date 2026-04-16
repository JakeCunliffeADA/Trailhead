"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteRouteAction } from "@/app/routes/actions";

export function DeleteRouteButton({ id }: { id: string }) {
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
          await deleteRouteAction(id);
          router.push("/routes");
        })
      }
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
