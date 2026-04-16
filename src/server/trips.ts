import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  gearItems,
  kitListItems,
  kitLists,
  routes,
  tripPackingItems,
  tripRoutes,
  trips,
  type NewTrip,
  type NewTripPackingItem,
} from "@/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getTrips(userId: string) {
  const rows = await db
    .select({
      id: trips.id,
      name: trips.name,
      description: trips.description,
      startDate: trips.startDate,
      endDate: trips.endDate,
      createdAt: trips.createdAt,
      totalItems: sql<number>`COUNT(DISTINCT ${tripPackingItems.id})`,
      packedItems: sql<number>`COUNT(DISTINCT CASE WHEN ${tripPackingItems.packed} = 1 THEN ${tripPackingItems.id} END)`,
    })
    .from(trips)
    .leftJoin(tripPackingItems, eq(tripPackingItems.tripId, trips.id))
    .where(eq(trips.userId, userId))
    .groupBy(trips.id)
    .orderBy(desc(trips.startDate));
  return rows;
}

export async function getTrip(userId: string, id: string) {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, userId)))
    .limit(1);
  return trip ?? null;
}

export async function getTripRoutes(userId: string, tripId: string) {
  return db
    .select({
      tripId: tripRoutes.tripId,
      routeId: tripRoutes.routeId,
      dayNumber: tripRoutes.dayNumber,
      sortOrder: tripRoutes.sortOrder,
      route: {
        id: routes.id,
        name: routes.name,
        distanceM: routes.distanceM,
        ascentM: routes.ascentM,
        descentM: routes.descentM,
        naismith_minutes: routes.naismith_minutes,
        geojson: routes.geojson,
      },
    })
    .from(tripRoutes)
    .innerJoin(routes, eq(tripRoutes.routeId, routes.id))
    .innerJoin(trips, eq(tripRoutes.tripId, trips.id))
    .where(and(eq(tripRoutes.tripId, tripId), eq(trips.userId, userId)))
    .orderBy(asc(tripRoutes.sortOrder));
}

export async function getTripPackingItems(userId: string, tripId: string) {
  return db
    .select()
    .from(tripPackingItems)
    .innerJoin(trips, eq(tripPackingItems.tripId, trips.id))
    .where(and(eq(tripPackingItems.tripId, tripId), eq(trips.userId, userId)))
    .orderBy(asc(tripPackingItems.sortOrder))
    .then((rows) => rows.map((r) => r.trip_packing_items));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createTrip(
  userId: string,
  input: Pick<NewTrip, "name" | "description" | "startDate" | "endDate">,
  kitListId?: string,
) {
  const id = nanoid();
  await db.insert(trips).values({ ...input, id, userId });

  if (kitListId) {
    await snapshotKitList(userId, id, kitListId);
  }

  return id;
}

/** Copies all items from a kit list template into tripPackingItems. */
async function snapshotKitList(userId: string, tripId: string, kitListId: string) {
  const items = await db
    .select({
      gearItemId: kitListItems.gearItemId,
      optional: kitListItems.optional,
      notes: kitListItems.notes,
      sortOrder: kitListItems.sortOrder,
      name: gearItems.name,
      weightGrams: gearItems.weightGrams,
      category: gearItems.category,
    })
    .from(kitListItems)
    .innerJoin(kitLists, eq(kitListItems.kitListId, kitLists.id))
    .innerJoin(gearItems, eq(kitListItems.gearItemId, gearItems.id))
    .where(and(eq(kitListItems.kitListId, kitListId), eq(kitLists.userId, userId)))
    .orderBy(asc(kitListItems.sortOrder));

  if (items.length === 0) return;

  await db.insert(tripPackingItems).values(
    items.map((item) => ({
      id: nanoid(),
      tripId,
      gearItemId: item.gearItemId,
      name: item.name,
      weightGrams: item.weightGrams,
      category: item.category,
      optional: item.optional,
      notes: item.notes,
      sortOrder: item.sortOrder,
    })),
  );
}

export async function deleteTrip(userId: string, id: string) {
  await db
    .delete(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, userId)));
}

export async function addTripRoute(userId: string, tripId: string, routeId: string) {
  // Verify trip ownership
  const [trip] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);
  if (!trip) throw new Error("Trip not found");

  // Verify route ownership
  const [route] = await db
    .select({ id: routes.id })
    .from(routes)
    .where(and(eq(routes.id, routeId), eq(routes.userId, userId)))
    .limit(1);
  if (!route) throw new Error("Route not found");

  const [existing] = await db
    .select()
    .from(tripRoutes)
    .where(and(eq(tripRoutes.tripId, tripId), eq(tripRoutes.routeId, routeId)))
    .limit(1);
  if (existing) return;

  const [maxRow] = await db
    .select({ max: sql<number | null>`MAX(${tripRoutes.sortOrder})` })
    .from(tripRoutes)
    .where(eq(tripRoutes.tripId, tripId));

  await db.insert(tripRoutes).values({
    tripId,
    routeId,
    sortOrder: (maxRow?.max ?? -1) + 1,
  });
}

export async function removeTripRoute(userId: string, tripId: string, routeId: string) {
  await db
    .delete(tripRoutes)
    .where(
      and(
        eq(tripRoutes.tripId, tripId),
        eq(tripRoutes.routeId, routeId),
        inArray(
          tripRoutes.tripId,
          db.select({ id: trips.id }).from(trips).where(eq(trips.userId, userId)),
        ),
      ),
    );
}

export async function togglePackedItem(userId: string, itemId: string, packed: boolean) {
  await db
    .update(tripPackingItems)
    .set({ packed })
    .where(
      and(
        eq(tripPackingItems.id, itemId),
        inArray(
          tripPackingItems.tripId,
          db.select({ id: trips.id }).from(trips).where(eq(trips.userId, userId)),
        ),
      ),
    );
}

export async function addTripPackingItem(
  userId: string,
  tripId: string,
  input: Pick<NewTripPackingItem, "name" | "weightGrams" | "category" | "optional" | "notes" | "gearItemId">,
) {
  const [trip] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);
  if (!trip) throw new Error("Trip not found");

  const [maxRow] = await db
    .select({ max: sql<number | null>`MAX(${tripPackingItems.sortOrder})` })
    .from(tripPackingItems)
    .where(eq(tripPackingItems.tripId, tripId));

  const id = nanoid();
  await db.insert(tripPackingItems).values({
    ...input,
    id,
    tripId,
    sortOrder: (maxRow?.max ?? -1) + 1,
  });
  return id;
}

export async function removeTripPackingItem(userId: string, itemId: string) {
  await db
    .delete(tripPackingItems)
    .where(
      and(
        eq(tripPackingItems.id, itemId),
        inArray(
          tripPackingItems.tripId,
          db.select({ id: trips.id }).from(trips).where(eq(trips.userId, userId)),
        ),
      ),
    );
}
