import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTrips } from "@/server/trips";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Trips" };

function formatDateRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return start.toDateString() === end.toDateString()
    ? fmt(start)
    : `${fmt(start)} – ${fmt(end)}`;
}

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const trips = await getTrips(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
          <p className="text-sm text-muted-foreground">
            {trips.length} {trips.length === 1 ? "trip" : "trips"}
          </p>
        </div>
        <Button render={<Link href="/trips/new" />}>New trip</Button>
      </div>

      {trips.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No trips yet. Create one to start planning.
        </p>
      ) : (
        <div className="grid gap-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{trip.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {trip.totalItems > 0 ? (
                  <span>
                    {trip.packedItems}/{trip.totalItems} packed
                  </span>
                ) : (
                  <span>No items</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
