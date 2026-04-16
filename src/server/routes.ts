import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { routes, type NewRoute } from "@/db/schema";

export async function getRoutes(userId: string) {
  return db
    .select()
    .from(routes)
    .where(eq(routes.userId, userId))
    .orderBy(asc(routes.name));
}

export async function getRoute(userId: string, id: string) {
  const [route] = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, id), eq(routes.userId, userId)))
    .limit(1);
  return route ?? null;
}

export async function createRoute(
  userId: string,
  input: Omit<NewRoute, "id" | "userId" | "createdAt">,
) {
  const id = nanoid();
  await db.insert(routes).values({ ...input, id, userId });
  return id;
}

export async function deleteRoute(userId: string, id: string) {
  await db
    .delete(routes)
    .where(and(eq(routes.id, id), eq(routes.userId, userId)));
}
