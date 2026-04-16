"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId, firstZodError } from "@/lib/action-helpers";
import {
  createGearItem,
  updateGearItem,
  retireGearItem,
  deleteGearItem,
} from "@/server/gear";

const gearSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  brand: z.string().max(80).optional(),
  category: z.string().max(60).optional(),
  description: z.string().max(1000).optional(),
  weightGrams: z.coerce.number().positive().optional(),
  tempRatingLowC: z.coerce.number().optional(),
  tempRatingHighC: z.coerce.number().optional(),
  tags: z.string().optional(),
});

function parseTags(raw?: string): string {
  if (!raw) return "[]";
  const tags = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return JSON.stringify(tags);
}

export type ActionResult = { error: string } | { success: true };

export async function addGearItemAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = gearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { tags, ...rest } = parsed.data;
  await createGearItem(userId, { ...rest, tags: parseTags(tags) });
  revalidatePath("/gear");
  return { success: true };
}

export async function editGearItemAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = gearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { tags, ...rest } = parsed.data;
  await updateGearItem(userId, id, { ...rest, tags: parseTags(tags) });
  revalidatePath("/gear");
  return { success: true };
}

export async function retireGearItemAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await retireGearItem(userId, id);
  revalidatePath("/gear");
}

export async function deleteGearItemAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await deleteGearItem(userId, id);
  revalidatePath("/gear");
}
