"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import {
  createGearItem,
  updateGearItem,
  retireGearItem,
  deleteGearItem,
} from "@/server/gear";

// ---------------------------------------------------------------------------
// Shared validation schema
// ---------------------------------------------------------------------------

const gearSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  brand: z.string().max(80).optional(),
  category: z.string().max(60).optional(),
  description: z.string().max(1000).optional(),
  weightGrams: z.coerce.number().positive().optional(),
  tempRatingLowC: z.coerce.number().optional(),
  tempRatingHighC: z.coerce.number().optional(),
  tags: z.string().optional(), // comma-separated, converted to JSON array
});

function parseTags(raw?: string): string {
  if (!raw) return "[]";
  const tags = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return JSON.stringify(tags);
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type ActionResult = { error: string } | { success: true };

export async function addGearItemAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = gearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { tags, ...rest } = parsed.data;
  await createGearItem(session.user.id, { ...rest, tags: parseTags(tags) });
  revalidatePath("/gear");
  return { success: true };
}

export async function editGearItemAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = gearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { tags, ...rest } = parsed.data;
  await updateGearItem(session.user.id, id, { ...rest, tags: parseTags(tags) });
  revalidatePath("/gear");
  return { success: true };
}

export async function retireGearItemAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  await retireGearItem(session.user.id, id);
  revalidatePath("/gear");
}

export async function deleteGearItemAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  await deleteGearItem(session.user.id, id);
  revalidatePath("/gear");
}
