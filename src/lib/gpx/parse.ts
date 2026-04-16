import { gpx } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import length from "@turf/length";
import { lineString } from "@turf/helpers";
import type { FeatureCollection, LineString, Position } from "geojson";

export type RouteStats = {
  distanceM: number;
  ascentM: number;
  descentM: number;
  minElevationM: number | null;
  maxElevationM: number | null;
  /** Naismith's rule: 1 hr per 5 km + 1 hr per 600 m ascent, in minutes */
  naismithMinutes: number;
};

export type ParsedRoute = {
  geojson: FeatureCollection;
  stats: RouteStats;
  name: string;
};

/**
 * Parse a GPX string into a GeoJSON FeatureCollection and compute
 * route statistics. Throws if the GPX is invalid or contains no tracks.
 */
export function parseGpx(gpxText: string): ParsedRoute {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxText, "application/xml");
  const geojson = gpx(doc) as FeatureCollection;

  // Find the first track or route feature with coordinates
  const trackFeature = geojson.features.find(
    (f) =>
      f.geometry?.type === "LineString" ||
      f.geometry?.type === "MultiLineString",
  );

  if (!trackFeature) {
    throw new Error("No tracks found in GPX file.");
  }

  // Normalise to a single LineString of [lon, lat, ele?] positions
  let coords: Position[];
  if (trackFeature.geometry.type === "LineString") {
    coords = (trackFeature.geometry as LineString).coordinates;
  } else {
    // MultiLineString — flatten all segments
    coords = (trackFeature.geometry as { coordinates: Position[][] }).coordinates.flat();
  }

  if (coords.length < 2) {
    throw new Error("GPX track has fewer than 2 points.");
  }

  // Distance via Turf (handles spherical geometry)
  const line = lineString(coords);
  const distanceKm = length(line, { units: "kilometers" });
  const distanceM = distanceKm * 1000;

  // Elevation stats from the third coordinate component
  const elevations = coords
    .map((c) => c[2])
    .filter((e): e is number => e != null && isFinite(e));

  let ascentM = 0;
  let descentM = 0;

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1][2];
    const curr = coords[i][2];
    if (prev != null && curr != null && isFinite(prev) && isFinite(curr)) {
      const diff = curr - prev;
      if (diff > 0) ascentM += diff;
      else descentM += Math.abs(diff);
    }
  }

  const minElevationM = elevations.length > 0 ? Math.min(...elevations) : null;
  const maxElevationM = elevations.length > 0 ? Math.max(...elevations) : null;

  // Naismith's rule: 1 hr per 5 km + 1 hr per 600 m ascent
  const naismithMinutes = Math.round((distanceKm / 5 + ascentM / 600) * 60);

  const name =
    (trackFeature.properties?.name as string | undefined) ??
    (geojson.features[0]?.properties?.name as string | undefined) ??
    "Unnamed route";

  return {
    geojson,
    stats: {
      distanceM: Math.round(distanceM),
      ascentM: Math.round(ascentM),
      descentM: Math.round(descentM),
      minElevationM: minElevationM != null ? Math.round(minElevationM) : null,
      maxElevationM: maxElevationM != null ? Math.round(maxElevationM) : null,
      naismithMinutes,
    },
    name,
  };
}
