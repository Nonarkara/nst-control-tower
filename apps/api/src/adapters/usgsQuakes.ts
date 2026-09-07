/**
 * USGS earthquake adapter — recent seismic events around southern Thailand / Andaman.
 *
 * Source: USGS Earthquake Hazards FDSN event web service
 *   https://earthquake.usgs.gov/fdsnws/event/1/
 *   Real-time GeoJSON, no API key. Publication latency: minutes.
 *
 * Bounding box covers the Andaman Sea + Sunda arc segment whose megathrust events
 * are the region's tsunami source (2004 Indian Ocean), plus mainland Thailand's
 * modest crustal seismicity: lat 0–22°N, lng 88–108°E, M ≥ 2.5, past 30 days.
 */

import type { EarthquakeEvent, NormalizedFeed } from "@nst/shared";
import { CHONBURI } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const TTL_SECONDS = 600; // 10 min — real-time feed, but quakes are rare; be polite

const BBOX = { minLat: 0, maxLat: 22, minLng: 88, maxLng: 108 };
const MIN_MAGNITUDE = 2.5;
const LOOKBACK_DAYS = 30;
const MAX_EVENTS = 100;

interface UsgsFeature {
  id?: string;
  properties?: {
    mag?: number | null;
    place?: string | null;
    time?: number | null; // epoch ms
    tsunami?: number | null;
    url?: string | null;
  };
  geometry?: { coordinates?: [number, number, number] }; // [lng, lat, depthKm]
}

interface UsgsResponse {
  features?: UsgsFeature[];
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance (haversine), rounded to whole km. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a)));
}

function toEvent(f: UsgsFeature, centerLat: number, centerLng: number): EarthquakeEvent | null {
  const coords = f.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat, depth] = coords;
  const p = f.properties ?? {};
  return {
    id: f.id ?? `${lng},${lat},${p.time ?? ""}`,
    magnitude: p.mag ?? null,
    place: p.place ?? "unknown",
    time: p.time != null ? new Date(p.time).toISOString() : "unknown",
    depthKm: depth != null ? Math.round(depth * 10) / 10 : null,
    lat,
    lng,
    distanceKm: haversineKm(centerLat, centerLng, lat, lng),
    tsunamiFlag: p.tsunami === 1,
    url: p.url ?? "https://earthquake.usgs.gov/",
    source: "usgs-fdsn",
  };
}

async function fetchQuakesInner(): Promise<NormalizedFeed<EarthquakeEvent>> {
  return cached("usgs-quakes", TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    const [centerLng, centerLat] = CHONBURI.center;

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - LOOKBACK_DAYS);

    const url =
      `https://earthquake.usgs.gov/fdsnws/event/1/query` +
      `?format=geojson` +
      `&starttime=${start.toISOString().slice(0, 10)}` +
      `&minlatitude=${BBOX.minLat}&maxlatitude=${BBOX.maxLat}` +
      `&minlongitude=${BBOX.minLng}&maxlongitude=${BBOX.maxLng}` +
      `&minmagnitude=${MIN_MAGNITUDE}` +
      `&orderby=time` +
      `&limit=${MAX_EVENTS}`;

    const payload = await fetchJsonOrThrow<UsgsResponse>(url);
    const raw = payload?.features ?? [];

    const events = raw
      .map((f) => toEvent(f, centerLat, centerLng))
      .filter((e): e is EarthquakeEvent => e !== null);

    return {
      features: events,
      meta: {
        source: "usgs-fdsn",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: payload?.features ? ("live" as const) : ("unavailable" as const),
        ...(payload?.features
          ? {}
          : { note: "USGS FDSN returned no feature collection — service may be degraded" }),
      },
    };
  });
}

// First-boot outage (throw + no stale to fall back on) → a calm unavailable
// feed, not a 500 through safeFeed.
export async function fetchQuakes(): Promise<NormalizedFeed<EarthquakeEvent>> {
  try {
    return await fetchQuakesInner();
  } catch {
    const fetchedAt = new Date().toISOString();
    return {
      features: [],
      meta: {
        source: "usgs-fdsn",
        fetchedAt,
        ageMinutes: 0,
        fallbackTier: "unavailable",
        note: "USGS FDSN request failed",
      },
    };
  }
}
