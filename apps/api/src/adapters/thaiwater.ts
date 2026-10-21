/**
 * HII ThaiWater adapter — api-v3.thaiwater.net
 *
 * National Hydroinformatics Data Center (HII), no auth required on /public/ endpoints.
 * Province code 80 = Nakhon Si Thammarat.
 *
 * fetchWaterGauges: 26 telemetry stations, ~10-min updates, includes situation_level
 *   (1=drought, 5=overbank/flood) and warning/critical thresholds per station.
 * fetchRainfall: 130 rainfall telemetry stations, 1h and 24h accumulations.
 */

import type { NormalizedFeed, WaterGauge, RainfallStation } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { recordGaugeSample } from "../lib/gaugeHistory.js";
import { fetchJsonOrThrow } from "./common.js";
import { RELAY_SOURCE_NOTE, SILENT_AFTER_H, bangkokIso, fetchRelay, mapRelayRain, mapRelayWater } from "./floodDashRelay.js";

const BASE = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public";
const PROVINCE = "80"; // Nakhon Si Thammarat
const TTL_GAUGES = 10 * 60;  // 10 min
const TTL_RAIN = 30 * 60;    // 30 min
// Serve an expired snapshot (honestly aged by trueAge) while refreshing in the
// background: the first visitor after expiry used to wait ~14 s for a live
// fetch through the relay. Beyond an hour the data is too old to show as-is.
const STALE_SERVE_S = 60 * 60;

// ---- ThaiWater response shapes ----

interface TWStation {
  tele_station_id: number;
  tele_station_name: { th: string; en: string } | string;
  tele_station_lat: number;
  tele_station_long: number;
  tele_station_oldcode?: string | null;
  is_key_station?: boolean;
  warning_level_m?: number | null;
  critical_level_msl?: number | null;
  min_bank?: number | null;
  /** Rated max channel discharge (m³/s) — the reach's conveyance capacity. */
  qmax?: number | null;
}

interface TWGeocode {
  province_code?: string;
  amphoe_name?: { th: string; en: string } | string;
}

interface TWBasin {
  basin_code?: number;
}

interface TWWaterLevelEntry {
  id?: number;
  waterlevel_datetime?: string;
  waterlevel_msl?: number | string | null;
  waterlevel_msl_previous?: number | string | null;
  waterlevel_m?: number | string | null;
  diff_wl_bank?: number | string | null;
  diff_wl_bank_text?: string | null;
  situation_level?: number | null;
  flow_rate?: number | string | null;
  discharge?: number | string | null;
  /** Channel fullness % relative to bank datum (can exceed 100 when overbank). */
  storage_percent?: number | string | null;
  river_name?: string | null;
  station?: TWStation;
  geocode?: TWGeocode;
  basin?: TWBasin;
}

interface TWRainEntry {
  id?: number;
  // Station identity nests under `station` (same shape as the waterlevel
  // feed); the flat tele_station_* fields exist only in some legacy payloads.
  station?: TWStation;
  tele_station_id?: number;
  tele_station_name?: { th: string; en: string } | string;
  tele_station_lat?: number;
  tele_station_long?: number;
  rainfall_datetime?: string;
  rain_1h?: number | string | null;
  rain_24h?: number | string | null;
  amphoe_name?: { th: string; en: string } | string;
  geocode?: TWGeocode;
}

interface TWResponse<T> {
  result?: string;
  data?: T;
}

// ---- helpers ----

function stationName(raw: TWStation["tele_station_name"]): string {
  if (!raw) return "—";
  if (typeof raw === "string") return raw;
  return raw.th || raw.en || "—";
}

function amphoeName(raw: TWGeocode["amphoe_name"]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.en || raw.th || "";
}

function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

/**
 * HII reports `diff_wl_bank` as a positive magnitude with the direction in
 * `diff_wl_bank_text` ("ต่ำกว่าตลิ่ง" = below bank, "สูงกว่าตลิ่ง"/"ล้นตลิ่ง" =
 * above/over bank). Normalise to a signed value matching WaterGauge.diffFromBank:
 * POSITIVE = above bank (overbank/flooding), NEGATIVE = below bank (freeboard).
 */
export function signedDiffFromBank(
  mag: number | string | null | undefined,
  text: string | null | undefined,
): number | null {
  const m = num(mag);
  if (m == null) return null;
  if (text) {
    if (text.includes("สูงกว่า") || text.includes("ล้น")) return Math.abs(m);
    if (text.includes("ต่ำกว่า")) return -Math.abs(m);
  }
  // Direction unknown: do NOT assume above-bank — a bare positive magnitude would
  // render a false "X m OVERBANK" flood alarm on a dry canal. situationLevel (1-5)
  // independently drives the real flood path, so return null (freeboard unknown).
  return null;
}

/**
 * HII situation level, verbatim.
 *
 * NULL when HII reports no level. This used to default to 3 — HII's own word
 * for "this channel is normal" — so a station with no official reading was
 * rendered as an officially calm river. That is not a rounding detail: this is
 * HII's warning of record, and 1 of 23 NST stations
 * (โรงเรียนวัดโคกโพธิ์สถิตย์, Lan Saka) omits it. A missing official reading is not
 * a reading.
 *
 * Out-of-range numbers are null too. HII's scale is 1-5; a 0 is not a level
 * it defines, so clamping it to 1 ("critical drought") or to 3 ("normal") both
 * invent a reading. The two adapters used to disagree here — this one sent 0
 * to 3, floodDashRelay sent it to 1 — so the same transmission could read calm
 * on the direct path and drought on the relay.
 */
function situation(raw: number | null | undefined): WaterGauge["situationLevel"] {
  if (raw == null || !Number.isFinite(raw)) return null;
  const s = Math.round(raw);
  return s >= 1 && s <= 5 ? (s as 1 | 2 | 3 | 4 | 5) : null;
}

function trend(curr: number | null, prev: number | null): WaterGauge["trend"] {
  if (curr == null || prev == null) return "stable";
  const delta = curr - prev;
  if (delta > 0.01) return "rising";
  if (delta < -0.01) return "falling";
  return "stable";
}

// ---- direct ThaiWater circuit breaker ----
// ThaiWater answers in ~0.3 s when reachable and not at all from Cloudflare's
// egress on bad days. Waiting 8 s for it before trying the relay put every cold
// gauge request past the browser's deadline ("Data server unreachable" on a
// healthy API). Fail fast, then skip the direct call for a few minutes.
const DIRECT_TIMEOUT_MS = 3_000;
const DIRECT_COOLDOWN_MS = 5 * 60_000;
let directDownUntil = 0;
const directThaiWaterAllowed = (): boolean => Date.now() >= directDownUntil;
const directThaiWaterFailed = (): void => { directDownUntil = Date.now() + DIRECT_COOLDOWN_MS; };
const directThaiWaterWorked = (): void => { directDownUntil = 0; };
/** Test-only. */
export function __resetDirectBreaker(): void { directDownUntil = 0; }

// ---- fetchWaterGauges ----

const computeWaterGauges = async (): Promise<NormalizedFeed<WaterGauge>> => {
    const fetchedAt = new Date().toISOString();

    // fetchJsonOrThrow throws on non-OK / network / DNS failure. On a cold start
    // (no stale cache), cachedWithStale re-throws, so catch here to return a calm
    // unavailable feed instead of a 500 through safeFeed.
    let resp: TWResponse<TWWaterLevelEntry[]> | null = null;
    if (!directThaiWaterAllowed()) return gaugesViaRelay(fetchedAt);
    try {
      resp = await fetchJsonOrThrow<TWResponse<TWWaterLevelEntry[]>>(
        `${BASE}/waterlevel?province_code=${PROVINCE}`, undefined, DIRECT_TIMEOUT_MS
      );
      directThaiWaterWorked();
    } catch {
      directThaiWaterFailed();
      return gaugesViaRelay(fetchedAt);
    }
    const raw: TWWaterLevelEntry[] = resp?.data ?? [];

    const placed: WaterGauge[] = raw.map((entry) => {
      const s = entry.station;
      const levelNow = num(entry.waterlevel_msl);
      const levelOld = num(entry.waterlevel_msl_previous);
      return {
        id: String(entry.id ?? s?.tele_station_id ?? Math.random()),
        name: s ? stationName(s.tele_station_name) : "Unknown",
        lat: s?.tele_station_lat ?? 0,
        lng: s?.tele_station_long ?? 0,
        levelMsl: levelNow,
        levelPrev: levelOld,
        warningMsl: num(s?.warning_level_m),
        criticalMsl: num(s?.critical_level_msl),
        diffFromBank: signedDiffFromBank(entry.diff_wl_bank, entry.diff_wl_bank_text),
        situationLevel: situation(entry.situation_level),
        trend: trend(levelNow, levelOld),
        riverName: entry.river_name ?? "",
        amphoe: amphoeName(entry.geocode?.amphoe_name),
        observedAt: bangkokIso(entry.waterlevel_datetime ?? null) ?? "",
        isKeyStation: s?.is_key_station ?? false,
        stationCode: s?.tele_station_oldcode ?? null,
        bankMsl: num(s?.min_bank),
        fullnessPct: num(entry.storage_percent),
        // flow_rate is the same quantity at stations that report it under that name
        dischargeCms: num(entry.discharge) ?? num(entry.flow_rate),
        qmaxCms: num(s?.qmax),
      };
    }).filter((g) => g.lat !== 0 && g.lng !== 0);
    const { live: features, silent } = dropSilent(placed, Date.parse(fetchedAt));

    // Feed the rise-rate ring (keyed by station code when present — stable
    // across feed reloads, unlike the reading id).
    for (const g of features) {
      recordGaugeSample(g.stationCode ?? g.id, g.observedAt, g.levelMsl);
    }

    // Sort: highest situation_level first, then key stations, then by name
    features.sort((a, b) => {
      // `?? 0` keeps an unclassified station below every classified one, so it
      // can never top the list by default.
      if (b.situationLevel !== a.situationLevel) return (b.situationLevel ?? 0) - (a.situationLevel ?? 0);
      if (a.isKeyStation !== b.isKeyStation) return a.isKeyStation ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return {
      features,
      meta: {
        source: "thaiwater-waterlevel",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "unavailable",
        ...(features.length === 0
          ? { note: `ThaiWater returned no reporting stations for province 80${silent ? ` (${silent} silent >${SILENT_AFTER_H} h)` : ""}` }
          : silent ? { note: `${silent} station(s) silent >${SILENT_AFTER_H} h not shown — a dead gauge is not a calm river` } : {}),
      },
    };
};

/**
 * `meta.ageMinutes` is stamped when a feed is FETCHED. When the cache serves a
 * stale snapshot through an outage it returns that snapshot verbatim, so the age
 * would freeze — a three-hour-old river reading rendered as a green "0m" in the
 * exact colour that means "trust this". Recompute at read time, always: the one
 * number that must never lie is how old the number is.
 */
function trueAge<T>(feed: NormalizedFeed<T>): NormalizedFeed<T> {
  const age = cacheAgeMinutes(feed.meta.fetchedAt);
  if (age === feed.meta.ageMinutes) return feed;
  return { ...feed, meta: { ...feed.meta, ageMinutes: age } };
}

/**
 * River gauges — the dashboard's primary flood evidence.
 *
 * A relay outage THROWS (see gaugesViaRelay) rather than resolving an empty
 * feed, because `cachedWithStale` only falls back to the previous snapshot when
 * compute REJECTS. A resolved `{features: []}` is cached as a fresh success and
 * overwrites the last good snapshot — so a routine restart of the relay, or
 * ten minutes of a laptop being asleep, would blank the river picture in the
 * one week it matters most. Same rule as wrfRain and gistdaWater.
 *
 * This catch therefore only runs on a cold start with nothing to serve, where
 * an explicit "unavailable" is the honest answer.
 */
export async function fetchWaterGauges(): Promise<NormalizedFeed<WaterGauge>> {
  try {
    // staleTtl = TTL_GAUGES, not the 24 h default: `cachedWithStale` re-stamps a
    // stale entry with exactly this value, so the default would pin a single
    // snapshot for a whole day and never notice the relay coming back. Ten
    // minutes is how often this feed would have refreshed anyway.
    const feed = await cached("thaiwater-gauges", TTL_GAUGES, computeWaterGauges, STALE_SERVE_S, true);
    return trueAge(feed);
  } catch {
    return relayDown<WaterGauge>("River gauges", "thaiwater-waterlevel");
  }
}

// ---- fetchRainfall ----

const computeRainfall = async (): Promise<NormalizedFeed<RainfallStation>> => {
    const fetchedAt = new Date().toISOString();

    // fetchJsonOrThrow throws on non-OK / network / DNS failure. On a cold start
    // (no stale cache), cachedWithStale re-throws, so catch here to return a calm
    // unavailable feed instead of a 500 through safeFeed.
    let resp: TWResponse<TWRainEntry[]> | null = null;
    if (!directThaiWaterAllowed()) return rainViaRelay(fetchedAt);
    try {
      resp = await fetchJsonOrThrow<TWResponse<TWRainEntry[]>>(
        `${BASE}/rain_24h?province_code=${PROVINCE}`, undefined, DIRECT_TIMEOUT_MS
      );
      directThaiWaterWorked();
    } catch {
      directThaiWaterFailed();
      return rainViaRelay(fetchedAt);
    }
    const raw: TWRainEntry[] = resp?.data ?? [];

    const placedRain: RainfallStation[] = raw
      .map((entry) => {
        const s = entry.station;
        return {
          id: String(entry.id ?? s?.tele_station_id ?? entry.tele_station_id ?? Math.random()),
          name: s
            ? stationName(s.tele_station_name)
            : typeof entry.tele_station_name === "string"
              ? entry.tele_station_name
              : (entry.tele_station_name?.th ?? entry.tele_station_name?.en ?? ""),
          lat: s?.tele_station_lat ?? entry.tele_station_lat ?? 0,
          lng: s?.tele_station_long ?? entry.tele_station_long ?? 0,
          rain1h: num(entry.rain_1h),
          rain24h: num(entry.rain_24h),
          amphoe: amphoeName(entry.amphoe_name ?? entry.geocode?.amphoe_name),
          observedAt: bangkokIso(entry.rainfall_datetime ?? null) ?? "",
        };
      })
      .filter((r) => r.lat !== 0 && r.lng !== 0);
    const { live: features, silent } = dropSilent(placedRain, Date.parse(fetchedAt));

    // Sort by highest 24h rain first
    features.sort((a, b) => (b.rain24h ?? 0) - (a.rain24h ?? 0));

    return {
      features,
      meta: {
        source: "thaiwater-rain",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "unavailable",
        ...(features.length === 0
          ? { note: `ThaiWater returned no reporting rain stations for province 80${silent ? ` (${silent} silent >${SILENT_AFTER_H} h)` : ""}` }
          : silent ? { note: `${silent} rain station(s) silent >${SILENT_AFTER_H} h not shown` } : {}),
      },
    };
};

/** Rain gauges. Same outage rule as the river gauges, for the same reason. */
export async function fetchRainfall(): Promise<NormalizedFeed<RainfallStation>> {
  try {
    const feed = await cached("thaiwater-rain", TTL_RAIN, computeRainfall, STALE_SERVE_S, true);
    return trueAge(feed);
  } catch {
    return relayDown<RainfallStation>("Rain gauges", "thaiwater-rain");
  }
}

// ---- sensor honesty + FloodDash relay ----

/** Drop readings older than SILENT_AFTER_H. A gauge that stopped reporting
 *  keeps publishing its last value; shown as current, a dead gauge reads as a
 *  calm river and suppresses "move now" in the evacuation ranking. */
export function dropSilent<T extends { observedAt: string }>(rows: T[], nowMs: number): { live: T[]; silent: number } {
  const cutoff = nowMs - SILENT_AFTER_H * 3_600_000;
  const live = rows.filter((r) => {
    const t = Date.parse(r.observedAt);
    return Number.isFinite(t) && t >= cutoff && t <= nowMs + 5 * 60_000;
  });
  return { live, silent: rows.length - live.length };
}

/**
 * Cold start with no snapshot to fall back on. Name the failure precisely —
 * never an empty list that reads as "nothing is happening".
 */
function relayDown<T>(kind: string, source: string): NormalizedFeed<T> {
  return {
    features: [],
    meta: {
      source,
      fetchedAt: new Date().toISOString(),
      ageMinutes: 0,
      fallbackTier: "unavailable",
      note: `${kind} unavailable: HII ThaiWater is unreachable from Cloudflare and the FloodDash relay also failed. Retries automatically.`,
    },
  };
}

async function gaugesViaRelay(fetchedAt: string): Promise<NormalizedFeed<WaterGauge>> {
  try {
    const relay = await fetchRelay();
    const { gauges, silent } = mapRelayWater(relay.water);
    for (const g of gauges) recordGaugeSample(g.stationCode ?? g.id, g.observedAt, g.levelMsl);
    gauges.sort((a, b) => (b.situationLevel ?? 0) - (a.situationLevel ?? 0) || a.name.localeCompare(b.name));
    return {
      features: gauges,
      meta: {
        source: "thaiwater-waterlevel via flooddash",
        fetchedAt,
        ageMinutes: 0,
        fallbackTier: gauges.length > 0 ? "live" : "unavailable",
        note: `${RELAY_SOURCE_NOTE} · ${gauges.length} reporting · ${silent} silent >${SILENT_AFTER_H} h not shown`,
      },
    };
  } catch (err) {
    // Reject, never resolve `{features: []}` — see fetchWaterGauges. This is
    // the whole flood picture; do not blank it because a laptop rebooted.
    throw new Error(`FloodDash relay unreachable: ${String(err)}`);
  }
}

async function rainViaRelay(fetchedAt: string): Promise<NormalizedFeed<RainfallStation>> {
  try {
    const relay = await fetchRelay();
    const { stations, silent } = mapRelayRain(relay.rain);
    stations.sort((a, b) => (b.rain24h ?? 0) - (a.rain24h ?? 0));
    return {
      features: stations,
      meta: {
        source: "thaiwater-rain via flooddash",
        fetchedAt,
        ageMinutes: 0,
        fallbackTier: stations.length > 0 ? "live" : "unavailable",
        note: `${RELAY_SOURCE_NOTE} · ${stations.length} reporting · ${silent} silent >${SILENT_AFTER_H} h not shown`,
      },
    };
  } catch (err) {
    // Reject, never resolve `{features: []}` — see fetchWaterGauges.
    throw new Error(`FloodDash relay unreachable: ${String(err)}`);
  }
}
