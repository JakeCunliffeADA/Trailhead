"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId, firstZodError } from "@/lib/action-helpers";
import {
  createKitList,
  updateKitList,
  deleteKitList,
  addKitListItem,
  removeKitListItem,
  updateKitListItem,
} from "@/server/kit-lists";

export type ActionResult = { error: string } | { success: true; id?: string };

const kitListSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
});

export async function createKitListAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = kitListSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const id = await createKitList(userId, parsed.data);
  revalidatePath("/kits");
  return { success: true, id };
}

export async function updateKitListAction(
  kitListId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = kitListSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await updateKitList(userId, kitListId, parsed.data);
  revalidatePath("/kits");
  revalidatePath(`/kits/${kitListId}`);
  return { success: true };
}

export async function deleteKitListAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await deleteKitList(userId, id);
  revalidatePath("/kits");
}

const addItemSchema = z.object({
  kitListId: z.string().min(1),
  gearItemId: z.string().min(1, "Please select a gear item"),
  optional: z.coerce.boolean().optional(),
  notes: z.string().max(300).optional(),
});

export async function addKitListItemAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await addKitListItem(userId, { ...parsed.data, optional: parsed.data.optional ?? false });
  revalidatePath(`/kits/${parsed.data.kitListId}`);
  return { success: true };
}

export async function removeKitListItemAction(
  kitListId: string,
  itemId: string,
): Promise<void> {
  const userId = await requireUserId();
  await removeKitListItem(userId, itemId);
  revalidatePath(`/kits/${kitListId}`);
}

export async function toggleOptionalAction(
  kitListId: string,
  itemId: string,
  optional: boolean,
): Promise<void> {
  const userId = await requireUserId();
  await updateKitListItem(userId, itemId, { optional });
  revalidatePath(`/kits/${kitListId}`);
}
