import type { DailyWeatherSummary } from "@/lib/weather/fetch";
import { weatherLabel } from "@/lib/weather/fetch";
import { formatTempRange } from "@/lib/format";

type AttachedRoute = { routeId: string; name: string };

type Props = {
  attachedRoutes: AttachedRoute[];
  weatherByRoute: Record<string, DailyWeatherSummary[]>;
};

function DayCard({ day }: { day: DailyWeatherSummary }) {
  const dateLabel = new Date(day.date + "T12:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{dateLabel}</p>
      <p className="text-sm font-semibold">{weatherLabel(day.weathercode)}</p>
      <p className="text-sm">{formatTempRange(day.tempMinC, day.tempMaxC)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {day.precipMm.toFixed(1)} mm · {Math.round(day.windMaxKph)} km/h
      </p>
    </div>
  );
}

export function WeatherForecast({ attachedRoutes, weatherByRoute }: Props) {
  if (attachedRoutes.length === 0) return null;

  const hasAnyForecast = attachedRoutes.some((r) => (weatherByRoute[r.routeId]?.length ?? 0) > 0);

  if (!hasAnyForecast) {
    return (
      <p className="text-sm text-muted-foreground">
        Weather forecast unavailable. The trip may be too far in the future or the route has no
        coordinates.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {attachedRoutes.map((r) => {
        const days = weatherByRoute[r.routeId];
        if (!days?.length) return null;

        return (
          <div key={r.routeId}>
            {attachedRoutes.length > 1 && (
              <p className="mb-2 text-sm font-medium">{r.name}</p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {days.map((day) => (
                <DayCard key={day.date} day={day} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
