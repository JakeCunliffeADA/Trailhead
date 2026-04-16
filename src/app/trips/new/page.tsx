import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getKitLists } from "@/server/kit-lists";
import { CreateTripForm } from "@/components/trips/create-trip-form";

export const metadata: Metadata = { title: "New Trip" };

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const kitLists = await getKitLists(session.user.id);

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <Link href="/trips" className="text-sm text-muted-foreground hover:text-foreground">
        ← Trips
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold tracking-tight">New trip</h1>
      <CreateTripForm kitLists={kitLists.map((kl) => ({ id: kl.id, name: kl.name }))} />
    </main>
  );
}
