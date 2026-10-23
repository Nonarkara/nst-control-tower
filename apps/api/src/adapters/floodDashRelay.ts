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
import { finishBackgroundWork } from "../lib/cache.js";
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
  /** Retrieval clock survives shared-cache reads; reading the cache never renews it. */
  relayFetchedAt?: string;
  relayFromCache?: boolean;
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
 *  cache had expired, which is every time a 10-minute cache asks.
 *
 *  That cold compute has since grown. Measured 23 Oct 2026 against the live
 *  origin: 13.7 s and 14.8 s on cache misses, 0.005–1.3 s when it is warm.
 *  A 16 s budget left a 6 % margin on that, and the margin is what was spent:
 *  the 23 Oct outage logged "all six concurrent gauge requests returned zero
 *  features … around 16.2–16.4 s" — requests that aborted on this timeout,
 *  not requests the upstream was slow to answer.
 *
 *  The budget must outlast a cold rebuild with room to spare, because a
 *  timeout here is not a slow page: the cache is written only after a
 *  successful fetch, so every request that times out leaves the cache empty
 *  and the next one pays the same timeout and fails the same way. 25 s
 *  covers the measured worst case and still fits Cloudflare's ~30 s
 *  post-response window for a background refresh. */
export const RELAY_TIMEOUT_MS = 25_000;
/** Last-good retention in each data centre. Refresh cadence is separate. */
export const RELAY_EDGE_TTL_S = 2 * 60 * 60;
export const RELAY_FRESH_MS = 60_000;

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

/** Cache I/O is an optimization, not a reason to miss an emergency deadline. */
async function cacheDeadline<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Relay cache deadline")), 1000);
    })]);
  } finally { clearTimeout(timer!); }
}

/** A last-good snapshot is shared across cold isolates in the same data centre.
 * It remains useful evidence during a brief origin outage, with original source
 * and observation clocks. It never becomes a new live reading by being served. */
export function relaySnapshotMeta(relay: RelayResponse) {
  const candidate = relay.relayFetchedAt ?? relay.generated_at;
  const fetchedAt = Number.isFinite(Date.parse(candidate)) ? candidate : new Date().toISOString();
  return { fetchedAt, ageMinutes: Math.max(0, Math.floor((Date.now() - Date.parse(fetchedAt)) / 60_000)),
    fallbackTier: relay.relayFromCache ? "cache" as const : "live" as const };
}

/** A timeout is the failure that strands the shared cache: the read is
 *  abandoned, nothing is written, and the next request pays the same
 *  timeout. An empty or malformed reply is a *stable* condition — a retry
 *  will not change it, and doubling the origin's load while it is already
 *  struggling helps nobody. Only the first kind earns another attempt. */
function isTimeoutFailure(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /timed out|timeout|abort/i.test(message);
}

async function refreshRelay(cache: EdgeCache | null, key: Request): Promise<RelayResponse> {
  const body = await fetchJsonOrThrow<RelayResponse>(RELAY_URL, undefined, RELAY_TIMEOUT_MS);
  if (!validShape(body) || (!body.water.length && !body.rain.length)) throw new Error("FloodDash relay returned no station snapshot");
  const snapshot: RelayResponse = {...body, relayFetchedAt: new Date().toISOString(), relayFromCache: false};
  // The combined cache is transactional: a partial/invalid source reply may
  // serve its usable subset now, but cannot erase the other last-good feed.
  const recent = (row: {lat: number; lng: number; observedAt: string}) => {
    const age = Date.now() - Date.parse(row.observedAt);
    return Number.isFinite(row.lat) && Math.abs(row.lat) <= 90 && Number.isFinite(row.lng) && Math.abs(row.lng) <= 180
      && Number.isFinite(age) && age >= -5 * 60_000 && age <= 2 * 3600_000;
  };
  const usableWater = mapRelayWater(body.water).gauges.some(row => recent(row) && row.levelMsl != null && Number.isFinite(row.levelMsl));
  const usableRain = mapRelayRain(body.rain).stations.some(row => recent(row) && [row.rain1h, row.rain24h].some(value => value != null && Number.isFinite(value)));
  if (!usableWater && !usableRain) throw new Error("FloodDash relay returned no usable observations");
  if (cache && usableWater && usableRain) {
    await finishBackgroundWork(cacheDeadline(cache.put(key, new Response(JSON.stringify(snapshot), {
      headers: { "content-type": "application/json", "cache-control": `public, max-age=${RELAY_EDGE_TTL_S}` },
    }))).catch(err => { console.warn("floodDashRelay edge-cache write failed", (err as Error).message); }));
  }
  return snapshot;
}

/**
 * Fetch the relay now, bypassing the shared edge cache.
 *
 * The edge cache exists so a dashboard is fast and survives a brief origin
 * outage — it answers with the last-good snapshot. That is the right
 * behaviour for a read and the wrong behaviour for a probe: a probe has to
 * measure the origin, and an edge-served snapshot carries the clock of the
 * fetch that populated it, up to two hours old. Judged against the
 * availability rule, that is what made the readiness endpoint's verdict
 * depend on cache timing rather than on the origin.
 *
 * The cache is still written, so the probe leaves the cache warm.
 */
export async function fetchRelayDirect(): Promise<RelayResponse> {
  const cache = edgeCache();
  const key = new Request(RELAY_URL);
  return refreshRelay(cache, key);
}

export async function fetchRelay(): Promise<RelayResponse> {
  const cache = edgeCache();
  const key = new Request(RELAY_URL);
  if (cache) {
    try {
      const hit = await cacheDeadline(cache.match(key));
      if (hit) {
        const snapshot = await cacheDeadline(hit.json()) as RelayResponse;
        const age = Date.now() - Date.parse(snapshot.relayFetchedAt ?? snapshot.generated_at);
        if (validShape(snapshot) && (snapshot.water.length || snapshot.rain.length) && Number.isFinite(age) && age >= -5 * 60_000 && age <= RELAY_EDGE_TTL_S * 1000) {
          if (age <= RELAY_FRESH_MS) return snapshot;
          // Keep the old snapshot if refresh fails, including an empty HTTP200.
          await finishBackgroundWork(refreshRelay(cache, key).catch(err => {
            console.warn("floodDashRelay background refresh failed", (err as Error).message);
          }));
          return {...snapshot, relayFromCache: true};
        }
      }
    } catch (err) {
      console.warn("floodDashRelay edge-cache read failed", (err as Error).message);
    }
  }
  // Cold cache. The origin may need 13–15 s to regenerate a province
  // snapshot, and the read below has the budget for it. If it still fails,
  // the cache is still empty — and the cache is only written after a
  // successful fetch — so every later request would pay the same timeout and
  // fail the same way, and the cache could never fill. Leave one more
  // attempt running in the background: the next request finds a filled cache
  // instead of another timeout.
  try { return await refreshRelay(cache, key); }
  catch (err) {
    console.warn("floodDashRelay fetch failed", (err as Error).message);
    if (isTimeoutFailure(err)) {
      await finishBackgroundWork(refreshRelay(cache, key).catch(() => {}));
    }
    throw err;
  }
}

export const RELAY_SOURCE_NOTE = "ThaiWater unreachable from Cloudflare — HII readings relayed by FloodDash (flood.nonarkara.org)";
