export type HourlyForecast = {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  windspeed_10m: number[];
  weathercode: number[];
};

export type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  elevation: number;
  hourly: HourlyForecast;
};

export type DailyWeatherSummary = {
  date: string; // YYYY-MM-DD
  tempMinC: number;
  tempMaxC: number;
  precipMm: number;
  windMaxKph: number;
  weathercode: number; // dominant WMO code for the day
};

/** WMO weather code → human-readable label */
export function weatherLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
}

/**
 * Fetches an elevation-adjusted forecast from Open-Meteo.
 * No API key required. Returns raw hourly data for the date range.
 */
export async function fetchForecast(
  lat: number,
  lon: number,
  elevationM: number,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): Promise<OpenMeteoResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("elevation", Math.round(elevationM).toString());
  url.searchParams.set("hourly", "temperature_2m,precipitation,windspeed_10m,weathercode");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "UTC");

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 }, // never use Next.js cache — we manage staleness ourselves
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<OpenMeteoResponse>;
}

/** Aggregates hourly data into per-day summaries. */
export function summariseByDay(hourly: HourlyForecast): DailyWeatherSummary[] {
  const byDay = new Map<string, {
    temps: number[];
    precip: number[];
    wind: number[];
    codes: number[];
  }>();

  for (let i = 0; i < hourly.time.length; i++) {
    const day = hourly.time[i].slice(0, 10); // "YYYY-MM-DD"
    const entry = byDay.get(day) ?? { temps: [], precip: [], wind: [], codes: [] };
    entry.temps.push(hourly.temperature_2m[i]);
    entry.precip.push(hourly.precipitation[i]);
    entry.wind.push(hourly.windspeed_10m[i]);
    entry.codes.push(hourly.weathercode[i]);
    byDay.set(day, entry);
  }

  return Array.from(byDay.entries()).map(([date, d]) => ({
    date,
    tempMinC: Math.min(...d.temps),
    tempMaxC: Math.max(...d.temps),
    precipMm: d.precip.reduce((s, v) => s + v, 0),
    windMaxKph: Math.max(...d.wind),
    // dominant code: pick the highest-severity code for the day
    weathercode: Math.max(...d.codes),
  }));
}
