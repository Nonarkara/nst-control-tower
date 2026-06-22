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
import { fetchJsonOrThrow } from "./common.js";

const BASE = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public";
const PROVINCE = "80"; // Nakhon Si Thammarat
const TTL_GAUGES = 10 * 60;  // 10 min
const TTL_RAIN = 30 * 60;    // 30 min

// ---- ThaiWater response shapes ----

interface TWStation {
  tele_station_id: number;
  tele_station_name: { th: string; en: string } | string;
  tele_station_lat: number;
  tele_station_long: number;
  is_key_station?: boolean;
  warning_level_m?: number | null;
  critical_level_msl?: number | null;
  min_bank?: number | null;
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
  flow_rate?: number | null;
  discharge?: number | null;
  river_name?: string | null;
  station?: TWStation;
  geocode?: TWGeocode;
  basin?: TWBasin;
}

interface TWRainEntry {
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

function situation(raw: number | null | undefined): WaterGauge["situationLevel"] {
  const s = Math.round(raw ?? 3);
  if (s >= 5) return 5;
  if (s >= 4) return 4;
  if (s >= 2) return 2;
  if (s >= 1) return 1;
  return 3;
}

function trend(curr: number | null, prev: number | null): WaterGauge["trend"] {
  if (curr == null || prev == null) return "stable";
  const delta = curr - prev;
  if (delta > 0.01) return "rising";
  if (delta < -0.01) return "falling";
  return "stable";
}

// ---- fetchWaterGauges ----

export async function fetchWaterGauges(): Promise<NormalizedFeed<WaterGauge>> {
  return cached("thaiwater-gauges", TTL_GAUGES, async () => {
    const fetchedAt = new Date().toISOString();

    let raw: TWWaterLevelEntry[] = [];
    try {
      const resp = await fetchJsonOrThrow<TWResponse<TWWaterLevelEntry[]>>(
        `${BASE}/waterlevel?province_code=${PROVINCE}`
      );
      raw = resp?.data ?? [];
    } catch (err) {
      return {
        features: [],
        meta: {
          source: "thaiwater-waterlevel",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: `HII ThaiWater fetch failed: ${(err as Error).message}`,
        },
      };
    }

    const features: WaterGauge[] = raw.map((entry) => {
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
        observedAt: entry.waterlevel_datetime ?? fetchedAt,
        isKeyStation: s?.is_key_station ?? false,
      };
    }).filter((g) => g.lat !== 0 && g.lng !== 0);

    // Sort: highest situation_level first, then key stations, then by name
    features.sort((a, b) => {
      if (b.situationLevel !== a.situationLevel) return b.situationLevel - a.situationLevel;
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
        ...(features.length === 0 ? { note: "ThaiWater returned no stations for province 80" } : {}),
      },
    };
  });
}

// ---- fetchRainfall ----

export async function fetchRainfall(): Promise<NormalizedFeed<RainfallStation>> {
  return cached("thaiwater-rain", TTL_RAIN, async () => {
    const fetchedAt = new Date().toISOString();

    let raw: TWRainEntry[] = [];
    try {
      const resp = await fetchJsonOrThrow<TWResponse<TWRainEntry[]>>(
        `${BASE}/rain_24h?province_code=${PROVINCE}`
      );
      raw = resp?.data ?? [];
    } catch (err) {
      return {
        features: [],
        meta: {
          source: "thaiwater-rain",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: `HII ThaiWater rain fetch failed: ${(err as Error).message}`,
        },
      };
    }

    const features: RainfallStation[] = raw
      .map((entry) => ({
        id: String(entry.tele_station_id ?? Math.random()),
        name: typeof entry.tele_station_name === "string"
          ? entry.tele_station_name
          : (entry.tele_station_name?.th ?? entry.tele_station_name?.en ?? ""),
        lat: entry.tele_station_lat ?? 0,
        lng: entry.tele_station_long ?? 0,
        rain1h: num(entry.rain_1h),
        rain24h: num(entry.rain_24h),
        amphoe: amphoeName(entry.amphoe_name ?? entry.geocode?.amphoe_name),
        observedAt: entry.rainfall_datetime ?? fetchedAt,
      }))
      .filter((r) => r.lat !== 0 && r.lng !== 0);

    // Sort by highest 24h rain first
    features.sort((a, b) => (b.rain24h ?? 0) - (a.rain24h ?? 0));

    return {
      features,
      meta: {
        source: "thaiwater-rain",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "unavailable",
        ...(features.length === 0 ? { note: "ThaiWater returned no rain stations for province 80" } : {}),
      },
    };
  });
}
