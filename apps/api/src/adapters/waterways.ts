/**
 * National Waterways Adapter — Nakhon Si Thammarat province via Overpass API.
 *
 * Fetches rivers, canals, and streams within the NST province bbox from
 * OpenStreetMap via the Overpass API (https://overpass-api.de). Previously
 * fetched all of Thailand via 5 nationwide sub-queries — nearly all of that
 * data was discarded downstream by an NST-only dashboard, and it risked
 * rate-limiting/timeouts against a shared free public instance. Results are
 * cached for 7 days (waterways change slowly).
 *
 * Waterway types extracted:
 *   river, canal, stream, ditch, drain, natural=river, natural=stream
 */

import type { NormalizedFeed, WaterwayFeature } from "@nst/shared";
import { NST_PROVINCE_BBOX } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

// 7-day cache — waterways change slowly
const TTL = 7 * 24 * 60 * 60;

// Nakhon Si Thammarat province bbox (W, S, E, N) — single region, no nationwide fan-out
const [[NST_W, NST_S], [NST_E, NST_N]] = NST_PROVINCE_BBOX;
const REGIONS = [
  { name: "nst", bbox: { w: NST_W, s: NST_S, e: NST_E, n: NST_N } },
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
          ? "Overpass API returned no waterways — request timed out"
          : `NST province waterways from OSM: ${unique.length} rivers/canals/streams`,
      },
    };
  });
}
