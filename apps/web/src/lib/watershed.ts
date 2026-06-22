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

import type { WaterGauge, RainfallStation, EwsStation } from "@nst/shared";

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
    lat: 8.175,
    lng: 99.679,
    amphoe: ["ทุ่งสง", "Thung Song"],
  },
  {
    key: "khiri-wong",
    th: "คีรีวง",
    en: "Khiri Wong",
    role: "Tha Dee source · Khao Luang",
    river: "คลองท่าดี",
    lat: 8.4338,
    lng: 99.7833,
    amphoe: ["ลานสกา", "Lan Saka"],
    nameInclude: ["คีรีวง"],
  },
  {
    key: "lan-saka",
    th: "ลานสกา",
    en: "Lan Saka",
    role: "Tha Dee upper reach",
    river: "คลองท่าดี",
    lat: 8.4012,
    lng: 99.802,
    amphoe: ["ลานสกา", "Lan Saka"],
    nameExclude: ["คีรีวง"],
  },
  {
    key: "city",
    th: "เมือง",
    en: "City (Tha Dee)",
    role: "Reaches the city",
    river: "คลองท่าดี",
    lat: 8.3963,
    lng: 99.9201,
    amphoe: ["เมืองนครศรีธรรมราช", "Mueang Nakhon Si Thammarat"],
    nameInclude: ["ท่าดี", "นาป่า"],
    isCity: true,
  },
];

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
}

const SEVERITY: Record<ZoneStatus, number> = { nodata: -1, normal: 0, watch: 1, high: 2, flood: 3 };

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

export function summarizeZone(
  zone: WatershedZone,
  gauges: WaterGauge[],
  rainfall: RainfallStation[],
  ews: EwsStation[],
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
  const status = candidates.length ? candidates.reduce(worse) : "nodata";

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
  };
}

export function summarizeWatershed(
  gauges: WaterGauge[],
  rainfall: RainfallStation[],
  ews: EwsStation[] = [],
): ZoneSummary[] {
  return WATERSHED_ZONES.map((z) => summarizeZone(z, gauges, rainfall, ews));
}

export const ZONE_STATUS_COLOR: Record<ZoneStatus, string> = {
  flood: "var(--bad)",
  high: "var(--warn)",
  watch: "var(--data)",
  normal: "var(--good)",
  nodata: "var(--text-3)",
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
