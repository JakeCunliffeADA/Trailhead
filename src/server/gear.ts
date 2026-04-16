import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { gearItems, type NewGearItem } from "@/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Returns all active (non-retired) gear items for a user, ordered by name. */
export async function getGearItems(userId: string) {
  return db
    .select()
    .from(gearItems)
    .where(and(eq(gearItems.userId, userId), isNull(gearItems.retiredAt)))
    .orderBy(asc(gearItems.name));
}

/** Returns a single gear item, verifying ownership. */
export async function getGearItem(userId: string, id: string) {
  const [item] = await db
    .select()
    .from(gearItems)
    .where(and(eq(gearItems.id, id), eq(gearItems.userId, userId)))
    .limit(1);
  return item ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type GearItemInput = Pick<
  NewGearItem,
  | "name"
  | "brand"
  | "category"
  | "description"
  | "weightGrams"
  | "tempRatingLowC"
  | "tempRatingHighC"
  | "tags"
>;

export async function createGearItem(userId: string, input: GearItemInput) {
  const id = nanoid();
  await db.insert(gearItems).values({ ...input, id, userId });
  return id;
}

export async function updateGearItem(
  userId: string,
  id: string,
  input: Partial<GearItemInput>,
) {
  await db
    .update(gearItems)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(gearItems.id, id), eq(gearItems.userId, userId)));
}

export async function retireGearItem(userId: string, id: string) {
  await db
    .update(gearItems)
    .set({ retiredAt: new Date(), updatedAt: new Date() })
    .where(and(eq(gearItems.id, id), eq(gearItems.userId, userId)));
}

export async function deleteGearItem(userId: string, id: string) {
  await db
    .delete(gearItems)
    .where(and(eq(gearItems.id, id), eq(gearItems.userId, userId)));
}
