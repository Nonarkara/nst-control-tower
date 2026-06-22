/**
 * Geoapify Isoline adapter — reachability polygon.
 *
 * Returns the area reachable from a given point within `minutes` of travel
 * by the specified mode.  Uses Geoapify's Isoline API (3,000 free credits/day).
 *
 * API:
 *   GET https://api.geoapify.com/v1/routing/isoline
 *   ?waypoints={lat},{lng}
 *   &range={seconds}
 *   &range_type=time
 *   &mode={walk|bicycle|drive|approximated_transit}
 *   &apiKey={key}
 *
 * NOTE: Geoapify uses lat,lng order in the waypoints param (opposite of deck.gl).
 *
 * Typical use-cases for Yala municipal ops:
 *   - 15-min walk zone from the central circle (foot-traffic catchment)
 *   - Ambulance coverage from Yala Hospital
 *   - Flood isolation check — which areas are still reachable after flooding
 *
 * Cache: 30 min TTL (geography changes slowly; free-tier credits are precious).
 */

import { cached } from "../lib/cache.js";
import type { NormalizedFeed } from "@nst/shared";
import type { IsochroneMode, IsochroneResult } from "@nst/shared";

const GEOAPIFY_ENDPOINT = "https://api.geoapify.com/v1/routing/isoline";
const TTL_SECONDS = 1_800; // 30 min
const TIMEOUT_MS = 20_000;

/** Round to ~100 m precision — improves cache hit rate without visible error. */
function snap(v: number): number {
  return Math.round(v * 1_000) / 1_000;
}

/**
 * Rough polygon area estimate using the shoelace formula on the first ring.
 * Returns km².  Good enough for display; not geodetically exact.
 */
function estimateAreaKm2(
  geometry: IsochroneResult["geometry"],
): number | null {
  try {
    const ring =
      geometry.type === "Polygon"
        ? (geometry.coordinates as number[][][])[0]
        : (geometry.coordinates as number[][][][])[0][0];
    if (!ring || ring.length < 3) return null;
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
    }
    // Convert degrees² → km² (rough equatorial approximation)
    const deg2km = 111.32;
    return Math.abs(area / 2) * deg2km * deg2km;
  } catch {
    return null;
  }
}

export async function fetchIsochrone(
  lng: number,
  lat: number,
  minutes: number,
  mode: IsochroneMode,
  apiKey: string | undefined,
): Promise<NormalizedFeed<IsochroneResult>> {
  if (!apiKey) {
    return {
      features: [],
      meta: {
        source: "geoapify-isochrone",
        fetchedAt: new Date().toISOString(),
        ageMinutes: 0,
        fallbackTier: "unavailable",
      },
    };
  }

  const lngR = snap(lng);
  const latR = snap(lat);
  const cacheKey = `isochrone:${lngR}:${latR}:${minutes}:${mode}`;

  return cached(cacheKey, TTL_SECONDS, async () => {
    const seconds = minutes * 60;
    const url =
      `${GEOAPIFY_ENDPOINT}` +
      `?waypoints=${latR},${lngR}` +
      `&range=${seconds}` +
      `&range_type=time` +
      `&mode=${mode}` +
      `&apiKey=${apiKey}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!resp.ok) {
      const body = await resp.text().then((t) => t.slice(0, 200));
      throw new Error(`Geoapify ${resp.status}: ${body}`);
    }

    const fc = (await resp.json()) as {
      type: string;
      features: Array<{
        type: string;
        geometry: { type: string; coordinates: unknown };
        properties: Record<string, unknown>;
      }>;
    };

    const feature = fc.features?.[0];
    if (!feature?.geometry) {
      throw new Error("Geoapify returned no isoline feature");
    }

    const geometry = feature.geometry as IsochroneResult["geometry"];
    const result: IsochroneResult = {
      lng: lngR,
      lat: latR,
      minutes,
      mode,
      geometry,
      areaKm2: estimateAreaKm2(geometry),
    };

    const fetchedAt = new Date().toISOString();
    return {
      features: [result],
      meta: {
        source: "geoapify-isochrone",
        fetchedAt,
        ageMinutes: 0,
        fallbackTier: "live",
      },
    };
  });
}
