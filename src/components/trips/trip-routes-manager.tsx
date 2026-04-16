"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTripRouteAction, removeTripRouteAction } from "@/app/trips/actions";
import { useState } from "react";

type AttachedRoute = {
  routeId: string;
  route: {
    id: string;
    name: string;
    distanceM: number | null;
    ascentM: number | null;
  };
};

type AvailableRoute = { id: string; name: string };

type Props = {
  tripId: string;
  attachedRoutes: AttachedRoute[];
  availableRoutes: AvailableRoute[];
};

function formatDistance(m: number | null) {
  if (m == null) return "";
  return `${((m / 1000) * 0.621371).toFixed(1)} mi`;
}

export function TripRoutesManager({ tripId, attachedRoutes, availableRoutes }: Props) {
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [isPending, startTransition] = useTransition();

  const attachedIds = new Set(attachedRoutes.map((r) => r.routeId));
  const unattached = availableRoutes.filter((r) => !attachedIds.has(r.id));

  return (
    <div>
      {attachedRoutes.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">No routes attached.</p>
      ) : (
        <ul className="mb-3 divide-y rounded-lg border">
          {attachedRoutes.map(({ routeId, route }) => (
            <li key={routeId} className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 text-sm">{route.name}</span>
              {route.distanceM != null && (
                <span className="text-xs text-muted-foreground">
                  {formatDistance(route.distanceM)}
                  {route.ascentM != null && ` ↑ ${Math.round(route.ascentM)} m`}
                </span>
              )}
              <button
                onClick={() =>
                  startTransition(async () => {
                    await removeTripRouteAction(tripId, routeId);
                  })
                }
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                aria-label={`Remove ${route.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {unattached.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedRouteId} onValueChange={(v) => setSelectedRouteId(v ?? "")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Add a route…" />
            </SelectTrigger>
            <SelectContent>
              {unattached.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!selectedRouteId || isPending}
            onClick={() =>
              startTransition(async () => {
                await addTripRouteAction(tripId, selectedRouteId);
                setSelectedRouteId("");
              })
            }
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
