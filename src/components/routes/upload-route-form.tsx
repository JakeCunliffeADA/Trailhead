"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadRouteAction, type UploadResult } from "@/app/routes/actions";

const SOURCES = [
  { value: "komoot", label: "Komoot" },
  { value: "strava", label: "Strava" },
  { value: "os_maps", label: "OS Maps" },
  { value: "alltrails", label: "AllTrails" },
  { value: "other", label: "Other" },
];

export function UploadRouteForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<UploadResult | null, FormData>(
    uploadRouteAction,
    null,
  );

  useEffect(() => {
    if (state && "success" in state) {
      router.push(`/routes/${state.id}`);
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="gpx">GPX file *</Label>
        <Input id="gpx" name="gpx" type="file" accept=".gpx" required />
        <p className="text-xs text-muted-foreground">Max 5 MB. Exported from Komoot, Strava, OS Maps, or AllTrails.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Route name</Label>
          <Input id="name" name="name" placeholder="Leave blank to use GPX name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="source">Source</Label>
          <Select name="source" defaultValue="other">
            <SelectTrigger id="source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Parsing…" : "Upload route"}
      </Button>
    </form>
  );
}
