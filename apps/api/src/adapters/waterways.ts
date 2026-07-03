/**
 * National Waterways Adapter — Thailand via Overpass API.
 *
 * Fetches rivers, canals, and streams across the full Thailand bbox from
 * OpenStreetMap via the Overpass API (https://overpass-api.de).
 *
 * Thailand bbox: [97.3°E, 5.6°N, 105.7°E, 20.5°N]
 * Split into 4 regional sub-queries to avoid Overpass timeouts on a
 * single large request. Results are cached for 7 days (waterways
 * change slowly).
 *
 * Waterway types extracted:
 *   river, canal, stream, ditch, drain, natural=river, natural=stream
 */

import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

// 7-day cache — waterways change slowly
const TTL = 7 * 24 * 60 * 60;

// Thailand bounding box (W, S, E, N)
const TH_BBOX = { w: 97.3, s: 5.6, e: 105.7, n: 20.5 };

// Regional sub-queries for parallel fetch (smaller bboxes = faster)
const REGIONS = [
  { name: "south",   bbox: { w: 98.4, s: 5.6,  e: 101.2, n: 11.5 } },
  { name: "central", bbox: { w: 98.0, s: 11.0, e: 101.5, n: 18.0 } },
  { name: "north",   bbox: { w: 97.3, s: 16.0, e: 100.8, n: 20.5 } },
  { name: "east",    bbox: { w: 100.8,s: 10.5, e: 105.7, n: 18.0 } },
  { name: "northeast", bbox: { w: 100.5, s: 13.5, e: 105.5, n: 18.0 } },
];

// Overpass API response shapes
interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  nodes?: number[];
  geometry?: Array<{ lat: number; lon: number }>;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  version: number;
  generator: string;
  osm3s: { timestamp_osm_base: string; copyright: string };
  elements: OverpassElement[];
}

export interface WaterwayFeature {
  id: string;
  osmId: number;
  name: string;
  nameTh: string | null;
  waterwayType: string;
  lat: number;
  lng: number;
  coordinates: Array<[number, number]>; // [lng, lat] pairs for PathLayer
}

function buildQuery(b: { w: number; s: number; e: number; n: number }): string {
  const [w, s, e, n] = [b.w, b.s, b.e, b.n];
  return `[out:json][timeout:25];
(
  way["waterway"~"river|canal|stream|ditch|drain"](${s},${w},${n},${e});
  way["natural"="river"](${s},${w},${n},${e});
  way["natural"="stream"](${s},${w},${n},${e});
);
out body center;`;
}

function elementToFeature(el: OverpassElement): WaterwayFeature | null {
  const tags = el.tags ?? {};
  const type = tags["waterway"] ?? tags["natural"] ?? "unknown";
  const name = tags["name:en"] ?? tags["name"] ?? tags["name:th"] ?? "";
  const nameTh = tags["name:th"] ?? (tags["name"] && !tags["name:en"] ? tags["name"] : null);

  // Use center point if available (way), else first geometry node
  const center = el.center ?? el.geometry?.[0];
  if (!center) return null;

  // Extract ordered coordinates for PathLayer
  let coords: Array<[number, number]> = [];
  if (el.geometry && el.geometry.length > 0) {
    coords = el.geometry.map((g) => [g.lon, g.lat] as [number, number]);
  }

  return {
    id: `osm-${el.id}`,
    osmId: el.id,
    name: String(name),
    nameTh: nameTh ? String(nameTh) : null,
    waterwayType: type,
    lat: center.lat,
    lng: center.lon,
    coordinates: coords,
  };
}

export async function fetchNationalWaterways(): Promise<NormalizedFeed<WaterwayFeature>> {
  return cached("national-waterways", TTL, async () => {
    const fetchedAt = new Date().toISOString();

    // Fetch all regions in parallel
    const results = await Promise.allSettled(
      REGIONS.map((region) =>
        fetchJsonOrThrow<OverpassResponse>(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(buildQuery(region.bbox))}`
        )
      )
    );

    const allFeatures: WaterwayFeature[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        for (const el of result.value.elements) {
          const feat = elementToFeature(el);
          if (feat && feat.coordinates.length >= 2) {
            allFeatures.push(feat);
          }
        }
      }
    }

    // Deduplicate by OSM ID
    const seen = new Set<number>();
    const unique = allFeatures.filter((f) => {
      if (seen.has(f.osmId)) return false;
      seen.add(f.osmId);
      return true;
    });

    return {
      features: unique,
      meta: {
        source: "openstreetmap-overpass",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: unique.length > 0 ? "live" : "unavailable",
        note: unique.length === 0
          ? "Overpass API returned no waterways — all regions timed out"
          : `Thailand waterways from OSM: ${unique.length} rivers/canals/streams across ${REGIONS.length} regions`,
      },
    };
  });
}
