"use client";

import type { FeatureCollection, LineString, Position } from "geojson";

type Props = { geojson: FeatureCollection };

/** Renders an SVG elevation profile from GeoJSON coordinates. */
export function ElevationProfile({ geojson }: Props) {
  // Collect all coordinates with elevation
  const allCoords: Position[] = [];
  for (const feature of geojson.features) {
    if (feature.geometry.type === "LineString") {
      allCoords.push(...(feature.geometry as LineString).coordinates);
    } else if (feature.geometry.type === "MultiLineString") {
      for (const seg of (feature.geometry as { coordinates: Position[][] }).coordinates) {
        allCoords.push(...seg);
      }
    }
  }

  const elevations = allCoords
    .map((c) => c[2])
    .filter((e): e is number => e != null && isFinite(e));

  if (elevations.length < 2) return null;

  const minE = Math.min(...elevations);
  const maxE = Math.max(...elevations);
  const rangeE = maxE - minE || 1;

  const W = 600;
  const H = 80;
  const pts = elevations.map((e, i) => {
    const x = (i / (elevations.length - 1)) * W;
    const y = H - ((e - minE) / rangeE) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="mb-1 text-xs text-muted-foreground">Elevation profile</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        aria-label="Elevation profile"
      >
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{Math.round(minE)} m</span>
        <span>{Math.round(maxE)} m</span>
      </div>
    </div>
  );
}
