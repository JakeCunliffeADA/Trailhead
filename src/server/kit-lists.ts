import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  gearItems,
  kitListItems,
  kitLists,
  type NewKitList,
  type NewKitListItem,
} from "@/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getKitLists(userId: string) {
  return db
    .select()
    .from(kitLists)
    .where(eq(kitLists.userId, userId))
    .orderBy(asc(kitLists.name));
}

export async function getKitList(userId: string, id: string) {
  const [list] = await db
    .select()
    .from(kitLists)
    .where(and(eq(kitLists.id, id), eq(kitLists.userId, userId)))
    .limit(1);
  return list ?? null;
}

/**
 * Returns kit list items joined with their gear item details,
 * ordered by sort_order. Includes retired gear items so the list
 * stays complete even if gear is later retired.
 */
export async function getKitListItems(userId: string, kitListId: string) {
  return db
    .select({
      id: kitListItems.id,
      kitListId: kitListItems.kitListId,
      gearItemId: kitListItems.gearItemId,
      optional: kitListItems.optional,
      notes: kitListItems.notes,
      sortOrder: kitListItems.sortOrder,
      gear: {
        id: gearItems.id,
        name: gearItems.name,
        brand: gearItems.brand,
        category: gearItems.category,
        weightGrams: gearItems.weightGrams,
        tags: gearItems.tags,
        retiredAt: gearItems.retiredAt,
      },
    })
    .from(kitListItems)
    .innerJoin(kitLists, eq(kitListItems.kitListId, kitLists.id))
    .innerJoin(gearItems, eq(kitListItems.gearItemId, gearItems.id))
    .where(
      and(
        eq(kitListItems.kitListId, kitListId),
        eq(kitLists.userId, userId),
      ),
    )
    .orderBy(asc(kitListItems.sortOrder));
}

/** Active (non-retired) gear items for the item-picker dropdown. */
export async function getActiveGearForPicker(userId: string) {
  return db
    .select({
      id: gearItems.id,
      name: gearItems.name,
      brand: gearItems.brand,
      category: gearItems.category,
      weightGrams: gearItems.weightGrams,
    })
    .from(gearItems)
    .where(and(eq(gearItems.userId, userId), isNull(gearItems.retiredAt)))
    .orderBy(asc(gearItems.name));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createKitList(
  userId: string,
  input: Pick<NewKitList, "name" | "description">,
) {
  const id = nanoid();
  await db.insert(kitLists).values({ ...input, id, userId });
  return id;
}

export async function updateKitList(
  userId: string,
  id: string,
  input: Partial<Pick<NewKitList, "name" | "description">>,
) {
  await db
    .update(kitLists)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(kitLists.id, id), eq(kitLists.userId, userId)));
}

export async function deleteKitList(userId: string, id: string) {
  await db
    .delete(kitLists)
    .where(and(eq(kitLists.id, id), eq(kitLists.userId, userId)));
}

export async function addKitListItem(
  userId: string,
  input: Pick<NewKitListItem, "kitListId" | "gearItemId" | "optional" | "notes">,
) {
  // Verify the kit list belongs to the user
  const list = await getKitList(userId, input.kitListId);
  if (!list) throw new Error("Kit list not found");

  // Get the current max sort order
  const existing = await db
    .select({ sortOrder: kitListItems.sortOrder })
    .from(kitListItems)
    .where(eq(kitListItems.kitListId, input.kitListId))
    .orderBy(asc(kitListItems.sortOrder));

  const maxOrder = existing.length > 0
    ? Math.max(...existing.map((i) => i.sortOrder))
    : -1;

  const id = nanoid();
  await db.insert(kitListItems).values({
    ...input,
    id,
    sortOrder: maxOrder + 1,
  });
  return id;
}

export async function updateKitListItem(
  userId: string,
  itemId: string,
  input: Partial<Pick<NewKitListItem, "optional" | "notes">>,
) {
  // Verify ownership via join
  const [item] = await db
    .select({ id: kitListItems.id })
    .from(kitListItems)
    .innerJoin(kitLists, eq(kitListItems.kitListId, kitLists.id))
    .where(
      and(eq(kitListItems.id, itemId), eq(kitLists.userId, userId)),
    )
    .limit(1);

  if (!item) throw new Error("Item not found");
  await db.update(kitListItems).set(input).where(eq(kitListItems.id, itemId));
}

export async function removeKitListItem(userId: string, itemId: string) {
  const [item] = await db
    .select({ id: kitListItems.id })
    .from(kitListItems)
    .innerJoin(kitLists, eq(kitListItems.kitListId, kitLists.id))
    .where(
      and(eq(kitListItems.id, itemId), eq(kitLists.userId, userId)),
    )
    .limit(1);

  if (!item) throw new Error("Item not found");
  await db.delete(kitListItems).where(eq(kitListItems.id, itemId));
}
