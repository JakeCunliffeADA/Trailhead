import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { routes, trips, tripRoutes, weatherCache } from "@/db/schema";
import { fetchForecast, summariseByDay, type DailyWeatherSummary } from "@/lib/weather/fetch";
import type { FeatureCollection, LineString, Position } from "geojson";

const STALE_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Extracts a representative [lon, lat, elevation] from a GeoJSON FeatureCollection. */
function routeCentrePoint(geojson: FeatureCollection): [number, number, number] | null {
  const coords: Position[] = [];

  for (const feature of geojson.features) {
    if (feature.geometry.type === "LineString") {
      coords.push(...(feature.geometry as LineString).coordinates);
    } else if (feature.geometry.type === "MultiLineString") {
      for (const seg of (feature.geometry as { coordinates: Position[][] }).coordinates) {
        coords.push(...seg);
      }
    }
  }

  if (coords.length === 0) return null;

  const mid = coords[Math.floor(coords.length / 2)];
  const elevations = coords.map((c) => c[2]).filter((e): e is number => e != null && isFinite(e));
  const elevation = elevations.length > 0
    ? elevations.reduce((s, e) => s + e, 0) / elevations.length
    : 0;

  return [mid[0], mid[1], elevation]; // [lon, lat, elev]
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Returns weather summaries for all trip routes, fetching from Open-Meteo
 * and caching the result. Stale entries (> 6 h old) are refreshed.
 */
export async function getTripWeather(
  userId: string,
  tripId: string,
): Promise<Map<string, DailyWeatherSummary[]>> {
  // Verify ownership and load trip + route data
  const [tripRow] = await db
    .select({ startDate: trips.startDate, endDate: trips.endDate })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);

  if (!tripRow) return new Map();

  const attachedRoutes = await db
    .select({
      routeId: routes.id,
      name: routes.name,
      geojson: routes.geojson,
      maxElevationM: routes.maxElevationM,
    })
    .from(tripRoutes)
    .innerJoin(routes, eq(tripRoutes.routeId, routes.id))
    .where(eq(tripRoutes.tripId, tripId));

  if (attachedRoutes.length === 0) return new Map();

  const startDate = toDateString(tripRow.startDate);
  const endDate = toDateString(tripRow.endDate);
  const now = Date.now();
  const staleAfter = new Date(now + STALE_MS);

  const result = new Map<string, DailyWeatherSummary[]>();

  await Promise.all(
    attachedRoutes.map(async (r) => {
      // Check cache — find all non-stale entries for this route/trip
      const cached = await db
        .select()
        .from(weatherCache)
        .where(
          and(
            eq(weatherCache.tripId, tripId),
            eq(weatherCache.routeId, r.routeId),
            gte(weatherCache.staleAfter, new Date(now)),
          ),
        );

      if (cached.length > 0) {
        const summaries = cached
          .map((c) => JSON.parse(c.forecastJson) as DailyWeatherSummary)
          .sort((a, b) => a.date.localeCompare(b.date));
        result.set(r.routeId, summaries);
        return;
      }

      // Fetch fresh data
      try {
        const geojson = JSON.parse(r.geojson) as FeatureCollection;
        const point = routeCentrePoint(geojson);
        if (!point) return;

        const [lon, lat, elevation] = point;
        const forecast = await fetchForecast(lat, lon, elevation, startDate, endDate);
        const summaries = summariseByDay(forecast.hourly);

        // Upsert cache rows
        if (summaries.length > 0) {
          await db
            .delete(weatherCache)
            .where(
              and(
                eq(weatherCache.tripId, tripId),
                eq(weatherCache.routeId, r.routeId),
              ),
            );

          await db.insert(weatherCache).values(
            summaries.map((s) => ({
              id: nanoid(),
              tripId,
              routeId: r.routeId,
              forecastDate: new Date(s.date),
              elevationM: elevation,
              forecastJson: JSON.stringify(s),
              staleAfter,
            })),
          );
        }

        result.set(r.routeId, summaries);
      } catch (err) {
        console.error(
          `[weather] fetch failed trip=${tripId} route=${r.routeId}:`,
          err,
        );
      }
    }),
  );

  return result;
}
