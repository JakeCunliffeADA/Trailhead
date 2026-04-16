"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/action-helpers";
import { parseGpx } from "@/lib/gpx/parse";
import { createRoute, deleteRoute } from "@/server/routes";

export type UploadResult = { error: string } | { success: true; id: string };

export async function uploadRouteAction(
  _prev: UploadResult | null,
  formData: FormData,
): Promise<UploadResult> {
  const userId = await requireUserId();

  const file = formData.get("gpx") as File | null;
  if (!file || file.size === 0) return { error: "Please select a GPX file." };
  if (!file.name.toLowerCase().endsWith(".gpx")) {
    return { error: "Only .gpx files are supported." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File is too large (max 5 MB)." };
  }

  const gpxText = await file.text();

  let parsed;
  try {
    parsed = parseGpx(gpxText);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not parse GPX file." };
  }

  const source = (formData.get("source") as string | null) ?? "other";
  const name = (formData.get("name") as string | null)?.trim() || parsed.name;

  const id = await createRoute(userId, {
    name,
    source: source as "komoot" | "strava" | "os_maps" | "alltrails" | "other",
    distanceM: parsed.stats.distanceM,
    ascentM: parsed.stats.ascentM,
    descentM: parsed.stats.descentM,
    minElevationM: parsed.stats.minElevationM,
    maxElevationM: parsed.stats.maxElevationM,
    naismith_minutes: parsed.stats.naismithMinutes,
    geojson: JSON.stringify(parsed.geojson),
    gpxRaw: gpxText,
  });

  revalidatePath("/routes");
  return { success: true, id };
}

export async function deleteRouteAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await deleteRoute(userId, id);
  revalidatePath("/routes");
}
