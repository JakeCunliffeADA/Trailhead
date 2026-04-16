/** Format a weight in grams to a human-readable string. Returns "—" for null/undefined. */
export function formatWeight(grams: number | null | undefined): string {
  if (grams == null) return "—";
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

/** Format a temperature range in °C. Returns "—" when both values are absent. */
export function formatTempRange(
  low: number | null | undefined,
  high: number | null | undefined,
): string {
  if (low == null && high == null) return "—";
  if (low != null && high != null) return `${low}°C – ${high}°C`;
  if (low != null) return `≥ ${low}°C`;
  return `≤ ${high}°C`;
}
