"use client";

import { useEffect, useRef } from "react";
import type { FeatureCollection } from "geojson";

type Props = {
  geojson: FeatureCollection;
  className?: string;
};

/**
 * Renders a MapLibre GL JS map with the route's GeoJSON track.
 * Loaded client-only (maplibre-gl is browser-only).
 */
export function RouteMap({ geojson, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: import("maplibre-gl").Map | null = null;

    async function init() {
      const ml = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");

      const stadiaKey = process.env.NEXT_PUBLIC_STADIA_API_KEY;
      const tileUrl = stadiaKey
        ? `https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}@2x.png?api_key=${stadiaKey}`
        : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

      map = new ml.Map({
        container: containerRef.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [tileUrl],
              tileSize: 256,
              attribution: stadiaKey
                ? "© Stadia Maps © OpenMapTiles © OpenStreetMap"
                : "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [0, 0],
        zoom: 2,
      });

      map.on("load", () => {
        if (!map) return;

        map.addSource("route", { type: "geojson", data: geojson });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#f97316", "line-width": 3 },
        });

        // Fit map to the route bounds
        const bounds = new ml.LngLatBounds();
        geojson.features.forEach((feature) => {
          if (feature.geometry.type === "LineString") {
            feature.geometry.coordinates.forEach((c) =>
              bounds.extend(c as [number, number]),
            );
          } else if (feature.geometry.type === "MultiLineString") {
            feature.geometry.coordinates.flat().forEach((c) =>
              bounds.extend(c as [number, number]),
            );
          }
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
        }
      });
    }

    init().catch(console.error);

    return () => {
      map?.remove();
    };
  }, [geojson]);

  return <div ref={containerRef} className={className ?? "h-80 w-full rounded-lg"} />;
}
