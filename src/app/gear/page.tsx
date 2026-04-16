import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGearItems } from "@/server/gear";
import { GearTable } from "@/components/gear/gear-table";
import { AddGearDialog } from "@/components/gear/add-gear-dialog";

export const metadata: Metadata = { title: "Gear" };

export default async function GearPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const items = await getGearItems(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gear inventory</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <AddGearDialog />
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No gear yet. Add your first item to get started.
        </p>
      ) : (
        <GearTable items={items} />
      )}
    </main>
  );
}
