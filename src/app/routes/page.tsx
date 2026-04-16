import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRoutes } from "@/server/routes";
import { formatWeight } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Routes" };

function formatDistance(metres: number | null) {
  if (metres == null) return "—";
  const km = metres / 1000;
  const miles = km * 0.621371;
  return `${miles.toFixed(1)} mi (${km.toFixed(1)} km)`;
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function RoutesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const routes = await getRoutes(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
          <p className="text-sm text-muted-foreground">
            {routes.length} {routes.length === 1 ? "route" : "routes"}
          </p>
        </div>
        <Button render={<Link href="/routes/upload" />}>
          Import GPX
        </Button>
      </div>

      {routes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No routes yet. Import a GPX file to get started.
        </p>
      ) : (
        <div className="grid gap-3">
          {routes.map((route) => (
            <Link
              key={route.id}
              href={`/routes/${route.id}`}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{route.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{route.source ?? "—"}</p>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>{formatDistance(route.distanceM)}</span>
                <span>↑ {route.ascentM != null ? `${route.ascentM} m` : "—"}</span>
                <span>{formatDuration(route.naismith_minutes)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
