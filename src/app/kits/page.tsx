import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getKitLists } from "@/server/kit-lists";
import { KitListCard } from "@/components/kit-lists/kit-list-card";
import { CreateKitListDialog } from "@/components/kit-lists/create-kit-list-dialog";

export const metadata: Metadata = { title: "Kit lists" };

export default async function KitsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const lists = await getKitLists(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kit lists</h1>
          <p className="text-sm text-muted-foreground">
            Reusable templates for different kinds of trips.
          </p>
        </div>
        <CreateKitListDialog />
      </div>

      {lists.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No kit lists yet. Create one to get started.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <KitListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </main>
  );
}
