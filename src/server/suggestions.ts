import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { gearItems, tripPackingItems, trips } from "@/db/schema";
import { getTripWeather } from "@/server/weather";
import { deriveConditions, generateSuggestions, type GearSuggestion } from "@/lib/suggestions/match";

export type { GearSuggestion };

/**
 * Returns packing suggestions for a trip by cross-referencing the user's
 * gear inventory against the trip's weather forecast.
 * Returns an empty array if no forecast is available.
 */
export async function getTripSuggestions(
  userId: string,
  tripId: string,
): Promise<GearSuggestion[]> {
  // Verify ownership
  const [trip] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);
  if (!trip) return [];

  const [weatherMap, gear, packedRows] = await Promise.all([
    getTripWeather(userId, tripId),
    db.select().from(gearItems).where(eq(gearItems.userId, userId)),
    db
      .select({ gearItemId: tripPackingItems.gearItemId })
      .from(tripPackingItems)
      .where(eq(tripPackingItems.tripId, tripId)),
  ]);

  // Aggregate all forecast summaries across routes into a single set of conditions
  const allSummaries = Array.from(weatherMap.values()).flat();
  const conditions = deriveConditions(allSummaries);
  if (!conditions) return [];

  const packedGearIds = new Set(
    packedRows.map((r) => r.gearItemId).filter((id): id is string => id != null),
  );

  return generateSuggestions(gear, packedGearIds, conditions);
}
