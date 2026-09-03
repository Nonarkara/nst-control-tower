/**
 * watershed — upstream→city flow tracking for the NST flood section.
 *
 * NST city floods are fed from upstream: the คลองท่าดี (Tha Dee canal) rises in
 * the Khao Luang massif at คีรีวง (Khiri Wong) / ลานสกา (Lan Saka) and runs down
 * into the city; ทุ่งสง (Thung Song) sits on the SW watershed divide. Rain and
 * river rises register at these upstream gauges hours before the water reaches
 * downtown — so mapping the cascade gives urban managers genuine lead time
 * (the "upland weighting" lesson from the Japan-ASEAN flood roundtable).
 *
 * This module groups the live ThaiWater gauges + rainfall + DWR EWS soil
 * readings into ordered zones along that flow path and summarises each.
 */

import type { WaterGauge, RainfallStation, EwsStation, FloodGauge } from "@nst/shared";
import { WATERSHED_FORECAST_POINTS } from "@nst/shared";

/** Looks up the canonical lat/lng for a zone key from the shared forecast-point
 *  registry, so this file's coordinates never drift from what apps/api's
 *  precipNowcast adapter queries. Throws at module load if a key is missing —
 *  a build-time guarantee the two stay in sync, not a runtime possibility. */
function forecastPoint(key: string): { lat: number; lng: number } {
  const p = WATERSHED_FORECAST_POINTS.find((p) => p.key === key);
  if (!p) throw new Error(`watershed.ts: no WATERSHED_FORECAST_POINTS entry for zone "${key}"`);
  return { lat: p.lat, lng: p.lng };
}

export type ZoneStatus = "flood" | "high" | "watch" | "normal" | "nodata";

export interface WatershedZone {
  key: string;
  th: string;
  en: string;
  /** Short role in the flow path. */
  role: string;
  /** Main waterway. */
  river: string;
  /** Canonical map position (a representative gauge in the zone). */
  lat: number;
  lng: number;
  /** amphoe-name substrings that place a station in this zone. */
  amphoe: string[];
  /** Station-name keywords that MUST appear (refines a shared amphoe). */
  nameInclude?: string[];
  /** Station-name keywords that must NOT appear. */
  nameExclude?: string[];
  /** The downstream target (the city itself). */
  isCity?: boolean;
}

/**
 * Ordered upstream → downstream. คีรีวง and ลานสกา share amphoe ลานสกา, so they
 * are split by station name; the city row is the Tha Dee arriving downtown.
 *
 * amphoe matchers carry BOTH languages: HII gauges/rainfall report English
 * amphoe names ("Lan Saka District"), while DWR EWS reports Thai ("ลานสกา").
 */
export const WATERSHED_ZONES: WatershedZone[] = [
  {
    key: "thung-song",
    th: "ทุ่งสง",
    en: "Thung Song",
    role: "SW divide · feeds south",
    river: "คลองท่าเลา / ท่าโลน",
    ...forecastPoint("thung-song"),
    amphoe: ["ทุ่งสง", "Thung Song"],
  },
  {
    key: "khiri-wong",
    th: "คีรีวง",
    en: "Khiri Wong",
    role: "Tha Dee source · Khao Luang",
    river: "คลองท่าดี",
    ...forecastPoint("khiri-wong"),
    amphoe: ["ลานสกา", "Lan Saka"],
    nameInclude: ["คีรีวง"],
  },
  {
    key: "lan-saka",
    th: "ลานสกา",
    en: "Lan Saka",
    role: "Tha Dee upper reach",
    river: "คลองท่าดี",
    ...forecastPoint("lan-saka"),
    amphoe: ["ลานสกา", "Lan Saka"],
    nameExclude: ["คีรีวง"],
  },
  {
    key: "city",
    th: "เมือง",
    en: "City (Tha Dee)",
    role: "Reaches the city",
    river: "คลองท่าดี",
    // Old Town axis (matches NST.center in campus.ts) so the flow line terminates
    // downtown, not ~5 km SW of it.
    ...forecastPoint("city"),
    amphoe: ["เมืองนครศรีธรรมราช", "Mueang Nakhon Si Thammarat"],
    nameInclude: ["ท่าดี", "นาป่า"],
    isCity: true,
  },
];

// ── Lead-time estimate ─────────────────────────────────────────────────────
// How many hours an upstream rise leads the city, as an AUDITABLE estimate:
// great-circle distance × channel sinuosity ÷ a labelled flood-wave celerity band.
// This is a first-order travel-time estimate for situational framing, NOT a
// hydraulic routing result — the assumptions are surfaced in the UI caption.
export const CHANNEL_SINUOSITY = 1.4;
export const CELERITY_MIN_MS = 1.5;
export const CELERITY_MAX_MS = 3.0;

export interface LeadTime {
  minH: number;
  maxH: number;
  channelKm: number;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Estimated flood-wave lead time from an upstream zone to the city, in hours. */
export function leadTimeToCity(fromKey: string): LeadTime | null {
  const from = WATERSHED_ZONES.find((z) => z.key === fromKey);
  const city = WATERSHED_ZONES.find((z) => z.isCity);
  if (!from || !city || from.isCity) return null;
  const channelKm = haversineKm(from.lat, from.lng, city.lat, city.lng) * CHANNEL_SINUOSITY;
  // Faster celerity → shorter time (min), slower → longer (max).
  const minH = channelKm / (CELERITY_MAX_MS * 3.6);
  const maxH = channelKm / (CELERITY_MIN_MS * 3.6);
  return { minH, maxH, channelKm };
}

export interface ZoneSummary {
  zone: WatershedZone;
  status: ZoneStatus;
  /** Worst river situation level in the zone (0 = none). */
  situation: number;
  /** Representative water level (m MSL) of the worst gauge. */
  levelMsl: number | null;
  /** Metres above (+) / below (−) bank at the worst gauge. */
  diffFromBank: number | null;
  /** Max 24h rainfall (mm) across the zone. */
  rain24h: number | null;
  /** Max soil moisture (%) from DWR EWS (flash-flood precursor). */
  soil: number | null;
  /** Worst DWR EWS official status in the zone (0-3). */
  ewsStatus: 0 | 1 | 2 | 3;
  /** Any gauge in the zone rising. */
  rising: boolean;
  gaugeCount: number;
  /** Name of the worst (representative) gauge. */
  topStation: string;
  /** Status came from a GloFAS proxy (no live HII gauge/EWS in the zone). */
  modelled: boolean;
  /** Live rated discharge (m³/s) if any zone gauge reports it. */
  dischargeCms: number | null;
  /** Channel fullness % at the representative gauge. */
  fullnessPct: number | null;
  /** Rated max channel discharge (m³/s) at the representative gauge. */
  qmaxCms: number | null;
}

export const SEVERITY: Record<ZoneStatus, number> = { nodata: -1, normal: 0, watch: 1, high: 2, flood: 3 };

/** Zones on the Tha Dee cascade proper (excludes ทุ่งสง/Thung Song — a separate
 *  SW divide feeding a different river). The one place this filter lives —
 *  both the map's flow-path/line and the flow-dot animation's color derive
 *  from it, so they can never silently diverge on "which zones are the
 *  cascade". */
export function isThaDeeZone(s: ZoneSummary): boolean {
  return s.zone.river.includes("ท่าดี");
}

/** Worst (most severe) status among a list of zone summaries, or "nodata" for
 *  an empty list. Generic — used for both UI text and map dot color. */
export function worstStatus(summaries: ZoneSummary[]): ZoneStatus {
  return summaries.reduce<ZoneStatus>(
    (worst, s) => (SEVERITY[s.status] > SEVERITY[worst] ? s.status : worst),
    "nodata",
  );
}

function gaugeStatus(situation: number): ZoneStatus {
  if (situation >= 5) return "flood";
  if (situation === 4) return "high";
  if (situation >= 1) return "normal"; // 1 drought · 2 low · 3 normal
  return "nodata";
}

function ewsToStatus(s: 0 | 1 | 2 | 3): ZoneStatus {
  return s === 3 ? "flood" : s === 2 ? "high" : s === 1 ? "watch" : "normal";
}

function worse(a: ZoneStatus, b: ZoneStatus): ZoneStatus {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

function matchesName(name: string, zone: WatershedZone): boolean {
  if (zone.nameInclude && !zone.nameInclude.some((k) => name.includes(k))) return false;
  if (zone.nameExclude && zone.nameExclude.some((k) => name.includes(k))) return false;
  return true;
}

function inAmphoe(amphoe: string, zone: WatershedZone): boolean {
  return zone.amphoe.some((a) => amphoe.includes(a));
}

function floodGaugeToStatus(s: FloodGauge["status"]): ZoneStatus {
  switch (s) {
    case "flood": return "flood";
    case "warning": return "high";
    case "watch": return "watch";
    case "normal": return "normal";
    default: return "nodata";
  }
}

// Nearest GloFAS flood gauge to a zone, within ~22 km — used as a MODELLED proxy
// when a zone has no live HII gauge/EWS (e.g. HII publishes no Tha Dee gauge in the
// city, which would otherwise leave the cascade's payoff node permanently NO DATA).
const PROXY_MAX_DEG2 = 0.2 * 0.2;
function nearestFloodGauge(zone: WatershedZone, gauges: FloodGauge[]): FloodGauge | null {
  let best: FloodGauge | null = null;
  let bestD = PROXY_MAX_DEG2;
  for (const g of gauges) {
    const dlat = g.lat - zone.lat;
    const dlng = g.lng - zone.lng;
    const d = dlat * dlat + dlng * dlng;
    if (d < bestD) { bestD = d; best = g; }
  }
  return best;
}

export function summarizeZone(
  zone: WatershedZone,
  gauges: WaterGauge[],
  rainfall: RainfallStation[],
  ews: EwsStation[],
  floodGauges: FloodGauge[] = [],
): ZoneSummary {
  // Gauges in this zone (amphoe + name refinement).
  const zoneGauges = gauges.filter((g) => inAmphoe(g.amphoe, zone) && matchesName(g.name, zone));
  // Worst gauge by situation level.
  const worstGauge = [...zoneGauges].sort((a, b) => b.situationLevel - a.situationLevel)[0] ?? null;
  const situation = worstGauge?.situationLevel ?? 0;

  // Rainfall is matched by amphoe only (rain stations lack the canal naming).
  const zoneRain = rainfall.filter((r) => inAmphoe(r.amphoe, zone));
  const rain24h = zoneRain.reduce<number | null>(
    (m, r) => (r.rain24h != null ? Math.max(m ?? 0, r.rain24h) : m),
    null,
  );

  // DWR EWS soil + official status, matched by amphoe.
  const zoneEws = ews.filter((s) => inAmphoe(s.amphoe, zone));
  const soil = zoneEws.reduce<number | null>(
    (m, s) => (s.soilMoisture != null ? Math.max(m ?? 0, s.soilMoisture) : m),
    null,
  );
  const ewsStatus = zoneEws.reduce<0 | 1 | 2 | 3>((m, s) => (s.status > m ? s.status : m), 0);

  // Only derive status from feeds that actually have stations in this zone —
  // a zone with no gauge AND no EWS is "nodata", not falsely "normal".
  const candidates: ZoneStatus[] = [];
  if (zoneGauges.length) candidates.push(gaugeStatus(situation));
  if (zoneEws.length) candidates.push(ewsToStatus(ewsStatus));

  let status: ZoneStatus;
  let modelled = false;
  if (candidates.length) {
    status = candidates.reduce(worse);
  } else {
    // No live HII gauge or EWS in this zone — fall back to the nearest GloFAS
    // flood gauge as a MODELLED proxy so the cascade payoff node (the city) isn't
    // a permanent NO DATA. The flag lets the UI mark it as derived, not measured.
    const proxy = nearestFloodGauge(zone, floodGauges);
    const proxyStatus = proxy ? floodGaugeToStatus(proxy.status) : "nodata";
    status = proxyStatus;
    modelled = proxyStatus !== "nodata";
  }

  const rated = zoneGauges.find((g) => g.dischargeCms != null) ?? worstGauge;
  return {
    zone,
    status,
    situation,
    levelMsl: worstGauge?.levelMsl ?? null,
    diffFromBank: worstGauge?.diffFromBank ?? null,
    rain24h,
    soil,
    ewsStatus,
    rising: zoneGauges.some((g) => g.trend === "rising"),
    gaugeCount: zoneGauges.length,
    topStation: worstGauge?.name?.replace(/^สถานี\S*\s*/u, "") ?? "",
    modelled,
    dischargeCms: rated?.dischargeCms ?? null,
    fullnessPct: (rated ?? worstGauge)?.fullnessPct ?? null,
    qmaxCms: (rated ?? worstGauge)?.qmaxCms ?? null,
  };
}

/** How much water is arriving at Nakhon Si Thammarat city via คลองท่าดี. */
export interface CityInflow {
  /** Live rated discharge (m³/s), or null when the city gauge does not rate flow. */
  dischargeCms: number | null;
  /** fullness × qmax when live discharge is missing — labelled estimate, not LIVE. */
  estimatedCms: number | null;
  fullnessPct: number | null;
  qmaxCms: number | null;
  stationName: string;
  /** True only when dischargeCms came from a telemetry rating. */
  live: boolean;
  volumeM3PerHour: number | null;
  volumeM3PerDay: number | null;
  channelPct: number | null;
}

const THA_DEE_NAME = /ท่าดี|tha\s*d[ie]|นาป่า/i;

function pickInflowGauge(gauges: WaterGauge[]): WaterGauge | null {
  const city = WATERSHED_ZONES.find((z) => z.isCity);
  if (!city) return null;
  const inCity = gauges.filter((g) => inAmphoe(g.amphoe, city) && matchesName(g.name, city));
  const thaDee = gauges.filter((g) => THA_DEE_NAME.test(`${g.name} ${g.riverName}`));
  const pool = inCity.length ? inCity : thaDee;
  if (!pool.length) return null;
  return (
    pool.find((g) => g.dischargeCms != null) ??
    pool.find((g) => g.qmaxCms != null && g.fullnessPct != null) ??
    [...pool].sort((a, b) => b.situationLevel - a.situationLevel)[0] ??
    null
  );
}

function cmsFromFullness(g: WaterGauge): number | null {
  if (g.qmaxCms == null || g.fullnessPct == null || g.qmaxCms <= 0) return null;
  return g.qmaxCms * Math.max(0, g.fullnessPct) / 100;
}

/** City-node inflow from live HII gauges. Ungauged → modelled-null, never invented. */
export function summarizeCityInflow(gauges: WaterGauge[]): CityInflow {
  const empty: CityInflow = {
    dischargeCms: null,
    estimatedCms: null,
    fullnessPct: null,
    qmaxCms: null,
    stationName: "",
    live: false,
    volumeM3PerHour: null,
    volumeM3PerDay: null,
    channelPct: null,
  };
  const g = pickInflowGauge(gauges);
  if (!g) return empty;
  const liveCms = g.dischargeCms;
  const estimatedCms = liveCms == null ? cmsFromFullness(g) : null;
  const cms = liveCms ?? estimatedCms;
  const channelPct =
    liveCms != null && g.qmaxCms != null && g.qmaxCms > 0
      ? (liveCms / g.qmaxCms) * 100
      : g.fullnessPct;
  return {
    dischargeCms: liveCms,
    estimatedCms,
    fullnessPct: g.fullnessPct,
    qmaxCms: g.qmaxCms,
    stationName: g.name.replace(/^สถานี\S*\s*/u, ""),
    live: liveCms != null,
    volumeM3PerHour: cms != null ? cms * 3600 : null,
    volumeM3PerDay: cms != null ? cms * 86_400 : null,
    channelPct,
  };
}

export function effectiveCms(inflow: CityInflow): number | null {
  return inflow.dischargeCms ?? inflow.estimatedCms;
}

export function fmtCms(n: number): string {
  const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** One-line map / panel caption — always honest about LIVE vs estimated vs none. */
export function fmtCityInflowShort(inflow: CityInflow): string {
  const q = effectiveCms(inflow);
  if (q == null) return "No live discharge · MODELLED direction";
  return `${fmtCms(q)} m³/s → city · ${inflow.live ? "LIVE" : "est."}`;
}

export function fmtCityInflowVolume(inflow: CityInflow): string | null {
  if (inflow.volumeM3PerHour == null) return null;
  const h = inflow.volumeM3PerHour;
  if (h >= 100_000) return `${(h / 1_000_000).toFixed(2)} million m³/h`;
  return `${Math.round(h).toLocaleString("en")} m³/h`;
}

export function summarizeWatershed(
  gauges: WaterGauge[],
  rainfall: RainfallStation[],
  ews: EwsStation[] = [],
  floodGauges: FloodGauge[] = [],
): ZoneSummary[] {
  return WATERSHED_ZONES.map((z) => summarizeZone(z, gauges, rainfall, ews, floodGauges));
}

export const ZONE_STATUS_COLOR: Record<ZoneStatus, string> = {
  flood: "var(--bad)",
  high: "var(--warn)",
  watch: "var(--data)",
  normal: "var(--good)",
  nodata: "var(--ink-low)",
};

export const ZONE_STATUS_LABEL: Record<ZoneStatus, string> = {
  flood: "ล้นตลิ่ง OVERBANK",
  high: "น้ำมาก HIGH",
  watch: "เฝ้าระวัง WATCH",
  normal: "ปกติ NORMAL",
  nodata: "— NO DATA",
};

/** RGB for deck.gl map markers — mirrors ZONE_STATUS_COLOR. */
export const ZONE_STATUS_RGB: Record<ZoneStatus, [number, number, number]> = {
  flood: [239, 68, 68],
  high: [251, 146, 60],
  watch: [250, 204, 21],
  normal: [52, 211, 153],
  nodata: [148, 163, 184],
};
