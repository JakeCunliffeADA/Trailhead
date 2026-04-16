import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRoute } from "@/server/routes";
import { RouteMap } from "@/components/routes/route-map";
import { ElevationProfile } from "@/components/routes/elevation-profile";
import { DeleteRouteButton } from "@/components/routes/delete-route-button";
import type { FeatureCollection } from "geojson";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Route" };
  const route = await getRoute(session.user.id, id);
  return { title: route?.name ?? "Route" };
}

function stat(label: string, value: string) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function fmtDistance(m: number | null) {
  if (m == null) return "—";
  return `${(m / 1000).toFixed(1)} km (${((m / 1000) * 0.621371).toFixed(1)} mi)`;
}

function fmtDuration(mins: number | null) {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function RouteDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const route = await getRoute(session.user.id, id);
  if (!route) notFound();

  const geojson = JSON.parse(route.geojson) as FeatureCollection;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Link href="/routes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Routes
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{route.name}</h1>
          {route.source && (
            <p className="text-sm capitalize text-muted-foreground">{route.source}</p>
          )}
        </div>
        <DeleteRouteButton id={route.id} />
      </div>

      <RouteMap geojson={geojson} className="mb-4 h-80 w-full rounded-lg" />

      <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        {stat("Distance", fmtDistance(route.distanceM))}
        {stat("Ascent", route.ascentM != null ? `${route.ascentM} m` : "—")}
        {stat("Descent", route.descentM != null ? `${route.descentM} m` : "—")}
        {stat("Est. time (Naismith)", fmtDuration(route.naismith_minutes))}
      </div>

      <ElevationProfile geojson={geojson} />
    </main>
  );
}
