/**
 * Precipitation nowcast — 2-hour 15-min-interval rain forecast at the Nakhon
 * Si Thammarat city centroid AND the 3 upstream watershed zones (Thung Song,
 * Khiri Wong, Lan Saka). Monsoon downpours on the Khao Luang massif are the
 * #1 trigger of the Tha Dee / Pak Phanang flash-flood cascade; this surfaces
 * the next rain pulse — not just where it's observed, but where it's about
 * to fall upstream — so municipal leadership can re-time outdoor events,
 * pre-position pumps, or escalate the FloodPosture alert ladder before the
 * water arrives, not after.
 *
 * Source: Open-Meteo `minutely_15=precipitation,precipitation_probability`,
 * one multi-location call (comma-joined lat/lng) covering all 4 points.
 * Free, no key, 15-min interval, ~24 h horizon (we only need 2 h).
 */

import type { NormalizedFeed, PrecipNowcast, ZonePrecipNowcast } from "@nst/shared";
import { WATERSHED_FORECAST_POINTS } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const TTL_SECONDS = 1800; // 30min // 10 min — nowcasts update fast
const CACHE_KEY = "precip-nowcast-multi";
const SOURCE = "open-meteo-minutely";

// Open-Meteo returns a single object for one point, or an ARRAY of objects
// (one per point, same order as the request) for a multi-location request.
interface OpenMeteoMinutelySeries {
  time?: string[];
  precipitation?: number[];
  precipitation_probability?: number[];
}
type OpenMeteoMinutelyResponse =
  | { minutely_15?: OpenMeteoMinutelySeries }
  | { minutely_15?: OpenMeteoMinutelySeries }[];

const POINTS_IN_2H = 8; // 8 × 15 min

function computeSnapshot(series: OpenMeteoMinutelySeries | undefined): PrecipNowcast | null {
  if (!series?.time || !series.precipitation) return null;

  const nowMs = Date.now();
  const upcoming: { at: string; mm: number; prob: number }[] = [];
  for (let i = 0; i < series.time.length && upcoming.length < POINTS_IN_2H; i++) {
    const at = series.time[i];
    const ts = new Date(at + "+07:00").getTime();
    if (Number.isNaN(ts) || ts < nowMs - 15 * 60_000) continue;
    upcoming.push({
      at,
      mm: series.precipitation[i] ?? 0,
      prob: series.precipitation_probability?.[i] ?? 0,
    });
  }

  let totalMm = 0;
  let peakMm = 0;
  let peakAt: string | null = null;
  let firstSignificantAt: string | null = null;
  let minutesToSignificant: number | null = null;
  const SIGNIFICANT_MM = 0.5;

  for (let i = 0; i < upcoming.length; i++) {
    const p = upcoming[i];
    totalMm += p.mm;
    if (p.mm > peakMm) {
      peakMm = p.mm;
      peakAt = p.at;
    }
    if (firstSignificantAt == null && p.mm >= SIGNIFICANT_MM) {
      firstSignificantAt = p.at;
      minutesToSignificant = (i + 1) * 15 - 15;
    }
  }

  const intensity: PrecipNowcast["intensity"] =
    peakMm >= 5 ? "heavy" : peakMm >= 1 ? "moderate" : peakMm >= 0.1 ? "light" : "dry";

  return {
    nowMm: upcoming[0]?.mm ?? 0,
    total2hMm: Math.round(totalMm * 10) / 10,
    peakMm: Math.round(peakMm * 10) / 10,
    peakAt,
    firstSignificantAt,
    minutesToSignificant,
    intensity,
    points: upcoming,
  };
}

interface AllZoneSnapshots {
  fetchedAt: string;
  /** zoneKey -> snapshot, or null if that point's series was missing/malformed. */
  byZone: Map<string, PrecipNowcast | null>;
}

// Single multi-point Open-Meteo call shared by both fetchPrecipNowcast (city)
// and fetchZonePrecipNowcast (the 3 upstream zones) — one HTTP call serves
// both public functions regardless of which routes are polled.
async function fetchAllZoneSnapshots(): Promise<AllZoneSnapshots> {
  return cached(CACHE_KEY, TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    const lats = WATERSHED_FORECAST_POINTS.map((p) => p.lat).join(",");
    const lngs = WATERSHED_FORECAST_POINTS.map((p) => p.lng).join(",");
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
      `&minutely_15=precipitation,precipitation_probability` +
      `&timezone=Asia%2FBangkok&forecast_minutely_15=24`;
    const payload = await fetchJsonOrThrow<OpenMeteoMinutelyResponse>(url);
    const perPoint = Array.isArray(payload) ? payload : [payload];

    const byZone = new Map<string, PrecipNowcast | null>();
    WATERSHED_FORECAST_POINTS.forEach((point, i) => {
      byZone.set(point.key, computeSnapshot(perPoint[i]?.minutely_15));
    });

    return { fetchedAt, byZone };
  });
}

export async function fetchPrecipNowcast(): Promise<NormalizedFeed<PrecipNowcast>> {
  const { fetchedAt, byZone } = await fetchAllZoneSnapshots();
  const city = byZone.get("city");
  if (!city) {
    return {
      features: [],
      meta: { source: SOURCE, fetchedAt, ageMinutes: 0, fallbackTier: "unavailable" as const },
    };
  }
  return {
    features: [city],
    meta: { source: SOURCE, fetchedAt, ageMinutes: cacheAgeMinutes(fetchedAt), fallbackTier: "live" as const },
  };
}

/** Rain forecast at the 3 upstream watershed zones (city excluded — already
 *  covered by fetchPrecipNowcast). Feeds UpstreamWatershed's per-zone rows. */
export async function fetchZonePrecipNowcast(): Promise<NormalizedFeed<ZonePrecipNowcast>> {
  const { fetchedAt, byZone } = await fetchAllZoneSnapshots();
  const features: ZonePrecipNowcast[] = [];
  for (const point of WATERSHED_FORECAST_POINTS) {
    if (point.key === "city") continue;
    const snapshot = byZone.get(point.key);
    if (snapshot) features.push({ ...snapshot, zoneKey: point.key });
  }
  return {
    features,
    meta: {
      source: SOURCE,
      fetchedAt,
      ageMinutes: cacheAgeMinutes(fetchedAt),
      fallbackTier: features.length ? ("live" as const) : ("unavailable" as const),
    },
  };
}
