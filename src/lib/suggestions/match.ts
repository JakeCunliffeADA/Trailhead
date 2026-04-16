import type { DailyWeatherSummary } from "@/lib/weather/fetch";

export type SuggestionSeverity = "good" | "warn" | "info";

export type GearSuggestion = {
  gearItemId: string;
  name: string;
  brand: string | null;
  reason: string;
  severity: SuggestionSeverity;
  alreadyPacked: boolean;
};

type GearItem = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  tags: string; // JSON string
  tempRatingLowC: number | null;
  tempRatingHighC: number | null;
  retiredAt: Date | number | null;
};

type TripConditions = {
  forecastMinC: number;
  forecastMaxC: number;
  totalPrecipMm: number;
  maxWindKph: number;
};

function parseTags(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function hasTag(item: GearItem, tag: string): boolean {
  return parseTags(item.tags).some((t) => t.toLowerCase() === tag.toLowerCase());
}

export function deriveConditions(summaries: DailyWeatherSummary[]): TripConditions | null {
  if (summaries.length === 0) return null;
  return {
    forecastMinC: Math.min(...summaries.map((d) => d.tempMinC)),
    forecastMaxC: Math.max(...summaries.map((d) => d.tempMaxC)),
    totalPrecipMm: summaries.reduce((s, d) => s + d.precipMm, 0),
    maxWindKph: Math.max(...summaries.map((d) => d.windMaxKph)),
  };
}

/**
 * Generates packing suggestions by matching gear against forecast conditions.
 *
 * Rules:
 * 1. Temperature-rated gear (sleeping bags, insulation):
 *    - Packed + adequate → good
 *    - Packed + inadequate (rating > forecast min) → warn
 *    - Not packed + adequate → info (consider adding)
 * 2. Waterproofing: if significant rain forecast (> 5 mm total)
 *    - Packed "waterproof" gear → good
 *    - Unpacked "waterproof" gear → info
 * 3. Wind protection: if high wind (> 50 kph)
 *    - Packed "windproof" gear → good
 *    - Unpacked "windproof" gear → info
 */
export function generateSuggestions(
  gear: GearItem[],
  packedItemIds: Set<string>,
  conditions: TripConditions,
): GearSuggestion[] {
  const suggestions: GearSuggestion[] = [];
  const activeGear = gear.filter((g) => g.retiredAt == null);

  for (const item of activeGear) {
    const packed = packedItemIds.has(item.id);

    // --- Temperature adequacy ---
    if (item.tempRatingLowC != null) {
      const rating = item.tempRatingLowC;
      const forecastMin = conditions.forecastMinC;

      if (packed) {
        if (rating > forecastMin) {
          suggestions.push({
            gearItemId: item.id,
            name: item.name,
            brand: item.brand,
            reason: `Rated to ${rating}°C but forecast low is ${Math.round(forecastMin)}°C — may be too cold`,
            severity: "warn",
            alreadyPacked: true,
          });
        } else if (rating <= forecastMin && rating >= forecastMin - 10) {
          suggestions.push({
            gearItemId: item.id,
            name: item.name,
            brand: item.brand,
            reason: `Temperature rating (${rating}°C) suits forecast low of ${Math.round(forecastMin)}°C`,
            severity: "good",
            alreadyPacked: true,
          });
        }
      } else if (rating <= forecastMin && rating >= forecastMin - 15) {
        // A good unpacked option — suggest it
        suggestions.push({
          gearItemId: item.id,
          name: item.name,
          brand: item.brand,
          reason: `Suitable for ${Math.round(forecastMin)}°C forecast low (rated ${rating}°C) — not yet packed`,
          severity: "info",
          alreadyPacked: false,
        });
      }
    }

    // --- Waterproofing ---
    if (conditions.totalPrecipMm > 5 && hasTag(item, "waterproof")) {
      suggestions.push({
        gearItemId: item.id,
        name: item.name,
        brand: item.brand,
        reason: packed
          ? `Waterproof — ${conditions.totalPrecipMm.toFixed(0)} mm rain forecast`
          : `Waterproof — ${conditions.totalPrecipMm.toFixed(0)} mm rain forecast, not yet packed`,
        severity: packed ? "good" : "info",
        alreadyPacked: packed,
      });
    }

    // --- Wind protection ---
    if (conditions.maxWindKph > 50 && hasTag(item, "windproof")) {
      suggestions.push({
        gearItemId: item.id,
        name: item.name,
        brand: item.brand,
        reason: packed
          ? `Windproof — gusts up to ${Math.round(conditions.maxWindKph)} km/h forecast`
          : `Windproof — gusts up to ${Math.round(conditions.maxWindKph)} km/h forecast, not yet packed`,
        severity: packed ? "good" : "info",
        alreadyPacked: packed,
      });
    }
  }

  // Deduplicate by gearItemId (keep the highest severity entry)
  const severityRank: Record<SuggestionSeverity, number> = { warn: 2, good: 1, info: 0 };
  const best = new Map<string, GearSuggestion>();
  for (const s of suggestions) {
    const existing = best.get(s.gearItemId);
    if (!existing || severityRank[s.severity] > severityRank[existing.severity]) {
      best.set(s.gearItemId, s);
    }
  }

  return Array.from(best.values()).sort(
    (a, b) => severityRank[b.severity] - severityRank[a.severity],
  );
}
