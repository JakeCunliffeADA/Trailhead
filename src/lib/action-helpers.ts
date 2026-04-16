import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { auth } from "@/auth";

/**
 * Resolves the current session and returns the user ID.
 * Redirects to /sign-in if the user is not authenticated.
 * Use at the top of every server action.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session.user.id;
}

/** Extracts the first Zod validation error message. */
export function firstZodError(err: ZodError): string {
  return err.issues[0]?.message ?? "Invalid input";
}
