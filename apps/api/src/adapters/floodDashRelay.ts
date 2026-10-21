/**
 * FloodDash relay — ThaiWater water level + rain for NST, fetched through
 * FloodDash (flood.nonarkara.org) when api-v3.thaiwater.net is unreachable.
 *
 * Why: ThaiWater answers a Thai residential IP but not Cloudflare's egress.
 * On 2026-09-28 the Worker showed zero river gauges and zero rain while five
 * NST stations sat at situation level 4. FloodDash polls the same HII
 * stations from a Mac in Thailand and serves one province at
 * /api/province/stations (added for this — FloodDash 9dece755). Credit: the
 * readings are HII's; FloodDash only relays them.
 *
 * Honesty rules carried over from FloodDash's sensor-health work:
 *  - A station silent for more than SILENT_AFTER_H is dropped, not shown as
 *    its last value — a dead gauge must never read as a calm river.
 *  - The note says how many were dropped, so "no data" is visible.
 */
import type { RainfallStation, WaterGauge } from "@nst/shared";
import { fetchJsonOrThrow } from "./common.js";
import { AMPHOE_NAMES, AMPHOE_POINTS } from "../data/amphoePoints.js";

export const RELAY_URL = "https://flood.nonarkara.org/api/province/stations?code=80";
/** Same horizon as the DWR EWS stale rule. */
export const SILENT_AFTER_H = 6;
const AMPHOE_MAX_KM = 15;

interface RelayMeta {
  oldcode?: string | null;
  min_bank?: number | null;
  river?: string | null;
}

export interface RelayWater {
  key: string;
  name_th: string | null;
  lat: number | null;
  lng: number | null;
  meta?: RelayMeta | null;
  obs_time: string | null;
  age_min: number | null;
  situation_level?: number | null;
  wl_msl?: number | null;
  storage_pct?: number | null;
  indicator?: { rise_m_h?: number | null } | null;
}

export interface RelayRain {
  key: string;
  name_th: string | null;
  lat: number | null;
  lng: number | null;
  obs_time: string | null;
  age_min: number | null;
  rain_1h?: number | null;
  rain_24h?: number | null;
}

export interface RelayResponse {
  generated_at: string;
  water: RelayWater[];
  rain: RelayRain[];
}

/** FloodDash obs_time is Asia/Bangkok wall time without an offset ("2026-09-28T16:40"). */
export function bangkokIso(obs: string | null): string | null {
  if (!obs) return null;
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(obs)) {
    const explicit = new Date(obs);
    return Number.isFinite(explicit.getTime()) ? explicit.toISOString() : null;
  }
  const withSeconds = /T\d\d:\d\d$/.test(obs) ? `${obs}:00` : obs;
  const d = new Date(`${withSeconds.replace(" ", "T")}+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function nearestAmphoe(lat: number, lng: number): string {
  let best = "";
  let bestKm = AMPHOE_MAX_KM;
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
  for (const [plat, plng, i] of AMPHOE_POINTS) {
    const km = Math.hypot((plat - lat) * 110.57, (plng - lng) * kx);
    if (km < bestKm) {
      bestKm = km;
      best = AMPHOE_NAMES[i] ?? "";
    }
  }
  return best;
}

function isSilent(ageMin: number | null, observedAt: string | null): boolean {
  const actualAge = observedAt ? (Date.now() - Date.parse(observedAt)) / 60_000 : NaN;
  // A cached relay envelope can carry an old age_min forever. The actual
  // observation timestamp remains authoritative, with five minutes of clock skew.
  return ageMin == null || !Number.isFinite(ageMin) || ageMin < -5
    || ageMin > SILENT_AFTER_H * 60 || !Number.isFinite(actualAge)
    || actualAge < -5 || actualAge > SILENT_AFTER_H * 60;
}

/**
 * HII situation level, verbatim. NULL when HII reports none — this used to
 * default to 3 ("normal"), inventing an official calm reading. The twin helper
 * in thaiwater.ts had the same defect on the direct path — and the two disagreed
 * on an out-of-range 0: 3 ("normal") here became 1 ("critical drought") there.
 * Out of HII's 1-5 scale is not a level, so it is null.
 */
function situation(raw: number | null | undefined): WaterGauge["situationLevel"] {
  if (raw == null || !Number.isFinite(raw)) return null;
  const s = Math.round(raw);
  return s >= 1 && s <= 5 ? (s as 1 | 2 | 3 | 4 | 5) : null;
}

function trendFrom(riseMh: number | null | undefined): WaterGauge["trend"] {
  if (riseMh == null) return "stable";
  if (riseMh > 0.01) return "rising";
  if (riseMh < -0.01) return "falling";
  return "stable";
}

export function mapRelayWater(rows: RelayWater[]): { gauges: WaterGauge[]; silent: number } {
  let silent = 0;
  const gauges: WaterGauge[] = [];
  for (const r of rows) {
    if (r.lat == null || r.lng == null) continue;
    const observedAt = bangkokIso(r.obs_time);
    if (isSilent(r.age_min, observedAt) || !observedAt) {
      silent++;
      continue;
    }
    const bank = r.meta?.min_bank ?? null;
    const level = r.wl_msl ?? null;
    gauges.push({
      id: String(r.key),
      name: r.name_th ?? "—",
      lat: r.lat,
      lng: r.lng,
      levelMsl: level,
      levelPrev: null,
      warningMsl: null,
      criticalMsl: null,
      // positive = over the bank, negative = freeboard (WaterGauge contract)
      diffFromBank: level != null && bank != null ? Math.round((level - bank) * 100) / 100 : null,
      situationLevel: situation(r.situation_level),
      trend: trendFrom(r.indicator?.rise_m_h),
      riverName: r.meta?.river ?? "",
      amphoe: nearestAmphoe(r.lat, r.lng),
      observedAt,
      isKeyStation: false,
      stationCode: r.meta?.oldcode ?? null,
      bankMsl: bank,
      fullnessPct: r.storage_pct ?? null,
      dischargeCms: null,
      qmaxCms: null,
    });
  }
  return { gauges, silent };
}

export function mapRelayRain(rows: RelayRain[]): { stations: RainfallStation[]; silent: number } {
  let silent = 0;
  const stations: RainfallStation[] = [];
  for (const r of rows) {
    if (r.lat == null || r.lng == null) continue;
    const observedAt = bangkokIso(r.obs_time);
    if (isSilent(r.age_min, observedAt) || !observedAt) {
      silent++;
      continue;
    }
    stations.push({
      id: String(r.key),
      name: r.name_th ?? "—",
      lat: r.lat,
      lng: r.lng,
      rain1h: r.rain_1h ?? null,
      rain24h: r.rain_24h ?? null,
      amphoe: nearestAmphoe(r.lat, r.lng),
      observedAt,
    });
  }
  return { stations, silent };
}

/** FloodDash computes this route from a 6.8 GB database on a busy Mac: measured
 *  10 s cold (its own log: "slow request … ms:10129"), and the Worker used to
 *  give up at exactly 10 s — so the relay failed every time the 60 s server
 *  cache had expired, which is every time a 10-minute cache asks. */
export const RELAY_TIMEOUT_MS = 25_000;
/** Shared across every Worker instance in a data centre, so FloodDash is asked
 *  about once per window, not once per cold instance. */
export const RELAY_EDGE_TTL_S = 300;

interface EdgeCache {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
}

function edgeCache(): EdgeCache | null {
  const c = (globalThis as { caches?: { default?: EdgeCache } }).caches?.default;
  return c ?? null;
}

function validShape(body: RelayResponse | null | undefined): body is RelayResponse {
  return Array.isArray(body?.water) && Array.isArray(body?.rain);
}

export async function fetchRelay(): Promise<RelayResponse> {
  const cache = edgeCache();
  const key = new Request(RELAY_URL);
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) {
        const cached = (await hit.json()) as RelayResponse;
        if (validShape(cached)) return cached;
      }
    } catch (err) {
      console.warn("floodDashRelay edge-cache read failed", (err as Error).message);
    }
  }

  let body: RelayResponse;
  try {
    body = await fetchJsonOrThrow<RelayResponse>(RELAY_URL, undefined, RELAY_TIMEOUT_MS);
  } catch (err) {
    console.warn("floodDashRelay fetch failed", (err as Error).message);
    throw err;
  }
  if (!validShape(body)) throw new Error("FloodDash relay returned an unexpected shape");

  if (cache) {
    try {
      await cache.put(key, new Response(JSON.stringify(body), {
        headers: { "content-type": "application/json", "cache-control": `public, max-age=${RELAY_EDGE_TTL_S}` },
      }));
    } catch (err) {
      console.warn("floodDashRelay edge-cache write failed", (err as Error).message);
    }
  }
  return body;
}

export const RELAY_SOURCE_NOTE = "ThaiWater unreachable from Cloudflare — HII readings relayed by FloodDash (flood.nonarkara.org)";
