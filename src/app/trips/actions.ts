"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId, firstZodError } from "@/lib/action-helpers";
import {
  createTrip,
  deleteTrip,
  addTripRoute,
  removeTripRoute,
  togglePackedItem,
  addTripPackingItem,
  removeTripPackingItem,
} from "@/server/trips";

const createTripSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    kitListId: z.string().optional(),
  })
  .refine((d) => new Date(d.startDate) <= new Date(d.endDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export async function createTripAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const userId = await requireUserId();

  const parsed = createTripSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    kitListId: formData.get("kitListId") || undefined,
  });

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { name, description, startDate, endDate, kitListId } = parsed.data;
  const id = await createTrip(
    userId,
    {
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    kitListId,
  );

  redirect(`/trips/${id}`);
}

export async function deleteTripAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await deleteTrip(userId, id);
  revalidatePath("/trips");
}

export async function addTripRouteAction(tripId: string, routeId: string): Promise<void> {
  const userId = await requireUserId();
  await addTripRoute(userId, tripId, routeId);
  revalidatePath(`/trips/${tripId}`);
}

export async function removeTripRouteAction(tripId: string, routeId: string): Promise<void> {
  const userId = await requireUserId();
  await removeTripRoute(userId, tripId, routeId);
  revalidatePath(`/trips/${tripId}`);
}

export async function togglePackedItemAction(
  itemId: string,
  packed: boolean,
  tripId: string,
): Promise<void> {
  const userId = await requireUserId();
  await togglePackedItem(userId, itemId, packed);
  revalidatePath(`/trips/${tripId}`);
}

const addItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  weightGrams: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
});

export async function addTripPackingItemAction(
  tripId: string,
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const userId = await requireUserId();

  const parsed = addItemSchema.safeParse({
    name: formData.get("name"),
    weightGrams: formData.get("weightGrams") || undefined,
    category: formData.get("category") || undefined,
  });

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await addTripPackingItem(userId, tripId, parsed.data);
  revalidatePath(`/trips/${tripId}`);
  return null;
}

export async function removeTripPackingItemAction(
  itemId: string,
  tripId: string,
): Promise<void> {
  const userId = await requireUserId();
  await removeTripPackingItem(userId, itemId);
  revalidatePath(`/trips/${tripId}`);
}
