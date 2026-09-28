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
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(obs)) return new Date(obs).toISOString();
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

function isSilent(ageMin: number | null): boolean {
  return ageMin == null || ageMin > SILENT_AFTER_H * 60;
}

function situation(raw: number | null | undefined): WaterGauge["situationLevel"] {
  const s = Math.round(raw ?? 3);
  if (s >= 5) return 5;
  if (s >= 4) return 4;
  if (s <= 1) return 1;
  if (s === 2) return 2;
  return 3;
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
    if (isSilent(r.age_min) || !observedAt) {
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
    if (isSilent(r.age_min) || !observedAt) {
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

export async function fetchRelay(): Promise<RelayResponse> {
  const body = await fetchJsonOrThrow<RelayResponse>(RELAY_URL);
  if (!Array.isArray(body?.water) || !Array.isArray(body?.rain)) {
    throw new Error("FloodDash relay returned an unexpected shape");
  }
  return body;
}

export const RELAY_SOURCE_NOTE = "ThaiWater unreachable from Cloudflare — HII readings relayed by FloodDash (flood.nonarkara.org)";
