"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import {
  createKitList,
  updateKitList,
  deleteKitList,
  addKitListItem,
  removeKitListItem,
  updateKitListItem,
} from "@/server/kit-lists";

export type ActionResult = { error: string } | { success: true; id?: string };

// ---------------------------------------------------------------------------
// Kit list actions
// ---------------------------------------------------------------------------

const kitListSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
});

export async function createKitListAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = kitListSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const id = await createKitList(session.user.id, parsed.data);
  revalidatePath("/kits");
  return { success: true, id };
}

export async function updateKitListAction(
  kitListId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = kitListSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await updateKitList(session.user.id, kitListId, parsed.data);
  revalidatePath("/kits");
  revalidatePath(`/kits/${kitListId}`);
  return { success: true };
}

export async function deleteKitListAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  await deleteKitList(session.user.id, id);
  revalidatePath("/kits");
}

// ---------------------------------------------------------------------------
// Kit list item actions
// ---------------------------------------------------------------------------

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
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await addKitListItem(session.user.id, {
    ...parsed.data,
    optional: parsed.data.optional ?? false,
  });

  revalidatePath(`/kits/${parsed.data.kitListId}`);
  return { success: true };
}

export async function removeKitListItemAction(
  kitListId: string,
  itemId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  await removeKitListItem(session.user.id, itemId);
  revalidatePath(`/kits/${kitListId}`);
}

export async function toggleOptionalAction(
  kitListId: string,
  itemId: string,
  optional: boolean,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  await updateKitListItem(session.user.id, itemId, { optional });
  revalidatePath(`/kits/${kitListId}`);
}
