import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTrip, getTripRoutes, getTripPackingItems } from "@/server/trips";
import { getRoutes } from "@/server/routes";
import { getTripWeather } from "@/server/weather";
import { getTripSuggestions } from "@/server/suggestions";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { PackingChecklist } from "@/components/trips/packing-checklist";
import { AddPackingItemForm } from "@/components/trips/add-packing-item-form";
import { TripRoutesManager } from "@/components/trips/trip-routes-manager";
import { WeatherForecast } from "@/components/trips/weather-forecast";
import { PackingSuggestions } from "@/components/trips/packing-suggestions";
import type { DailyWeatherSummary } from "@/lib/weather/fetch";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Trip" };
  const trip = await getTrip(session.user.id, id);
  return { title: trip?.name ?? "Trip" };
}

function formatDateRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return start.toDateString() === end.toDateString()
    ? fmt(start)
    : `${fmt(start)} – ${fmt(end)}`;
}

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [trip, tripRoutes, packingItems, allRoutes] = await Promise.all([
    getTrip(session.user.id, id),
    getTripRoutes(session.user.id, id),
    getTripPackingItems(session.user.id, id),
    getRoutes(session.user.id),
  ]);

  if (!trip) notFound();

  const [weatherMap, suggestions] = await Promise.all([
    getTripWeather(session.user.id, id),
    getTripSuggestions(session.user.id, id),
  ]);
  const weatherByRoute = Object.fromEntries(
    Array.from(weatherMap.entries()).map(([k, v]) => [k, v as DailyWeatherSummary[]]),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/trips" className="text-sm text-muted-foreground hover:text-foreground">
            ← Trips
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{trip.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
          {trip.description && (
            <p className="mt-1 text-sm text-muted-foreground">{trip.description}</p>
          )}
        </div>
        <DeleteTripButton id={trip.id} />
      </div>

      {/* Routes */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Routes</h2>
        <TripRoutesManager
          tripId={trip.id}
          attachedRoutes={tripRoutes}
          availableRoutes={allRoutes.map((r) => ({ id: r.id, name: r.name }))}
        />
      </section>

      {/* Weather */}
      {tripRoutes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Weather forecast</h2>
          <WeatherForecast
            attachedRoutes={tripRoutes.map((tr) => ({
              routeId: tr.routeId,
              name: tr.route.name,
            }))}
            weatherByRoute={weatherByRoute}
          />
        </section>
      )}

      {/* Packing suggestions */}
      {suggestions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Gear suggestions</h2>
          <PackingSuggestions suggestions={suggestions} />
        </section>
      )}

      {/* Packing checklist */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Packing checklist</h2>
        <PackingChecklist tripId={trip.id} items={packingItems} />
        <div className="mt-4 rounded-lg border p-4">
          <p className="mb-3 text-sm font-medium">Add item</p>
          <AddPackingItemForm tripId={trip.id} />
        </div>
      </section>
    </main>
  );
}
