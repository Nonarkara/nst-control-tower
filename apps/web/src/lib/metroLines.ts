/**
 * metroLines.ts — subway-style line definitions for the watershed system.
 *
 * Visual metaphor (per user request): turn the cascade into a transit
 * system a passenger can read. The trick is to keep metro styling
 * (consistent stroke width, rounded caps, station markers, line colour)
 * WHILE routing the path along real lng/lat — so the diagram and the
 * actual map agree on the shape.
 *
 * For the MVP we model one line, the Tha Dee cascade (Khao Luang
 * headwaters → Khiri Wong → Lan Saka → NST City → Pak Phanang Bay), with
 * a planned addition of the Klong Pak Phanang floodplain secondary
 * line once its surface telemetry is wired.
 *
 * Each station on the line carries a "status" — the same vocabulary as
 * the on-map watershed markers, computed once and used as the line's
 * stroke colour.
 */

import {
  WATERSHED_FORECAST_POINTS,
  PAK_PHANANG_BAY_CENTROID,
  type WatershedForecastPoint,
} from "@nst/shared";
import { leadTimeToCity, isThaDeeZone, type ZoneSummary } from "../lib/watershed";

/** Status vocabulary reused by the line stroke + station fills. Mirrors
 *  the rest of the dashboard — never an invented RGB. */
export type MetroStatus = "normal" | "watch" | "prepare" | "critical" | "unknown";

export interface MetroStation {
  /** Stable id ("khiri-wong", "lan-saka", "city", "bay-outlet"). */
  id: string;
  /** Anchor lng/lat on the actual map. The infographic path bends
   *  between anchors — never moves them. */
  lng: number;
  lat: number;
  /** EN + TH name shown on the station card. */
  labelEn: string;
  labelTh: string;
  /** Stop category — drives the icon shape (terminus / transfer / local). */
  kind: "terminus" | "transfer" | "local";
  /** Live status from `summaries`. Falls back to `unknown` for the
   *  source / bay rows that aren't in `ZoneSummary`. */
  status: MetroStatus;
  /** Live level in metres (from `summary.levelMsl`). */
  levelM: number | null;
  /** Trend glyph (▲ ▼ → ·). */
  trend: "▲" | "▼" | "→" | "·";
  /** Distance downstream of the upstream terminus (km, Haversine). */
  kmFromSource: number;
  /** Lead-time ETA to the city stop (hours). null for the city itself. */
  etaH: number | null;
  /** Short role string — drives the station's caption on the card. */
  role: string;
}

export interface MetroLine {
  id: string;
  /** Branch EN + TH name. */
  nameEn: string;
  nameTh: string;
  /** Branch colour — drives the line stroke. */
  colour: [number, number, number];
  /** Reserved for a future Pak Phanang branch colour. */
  accent: [number, number, number];
  stations: MetroStation[];
  /** Worst status across the line — the line's overall "service status",
   *  shown in the diagram's header strip. */
  overallStatus: MetroStatus;
}

// ─── Status mapping (mirrors the rest of the codebase) ────────────────────

function summaryToStatus(s: ZoneSummary | undefined): MetroStatus {
  if (!s) return "unknown";
  if (s.status === "flood") return "critical";
  if (s.status === "high") return "prepare";
  if (s.status === "watch") return "watch";
  if (s.status === "normal") return "normal";
  return "unknown";
}

function trendGlyph(s: ZoneSummary | undefined): "▲" | "▼" | "→" | "·" {
  if (!s) return "·";
  if (s.rising) return "▲";
  // ZoneSummary doesn't carry falling/stable explicitly — only `rising`.
  // Use the gauge-side signal when the basin is past bank.
  if (s.diffFromBank != null && s.diffFromBank >= 0) return "→";
  return "·";
}

// ─── Geometry helpers ──────────────────────────────────────────────────────

const KM_PER_DEG_LAT = 111.32;

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Cumulative channel km from the upstream terminus to each station.
 *  Used to label the distance-from-source tag on each station card. */
function distanceFromSource(stations: MetroStation[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < stations.length; i++) {
    const a = stations[i - 1]!;
    const b = stations[i]!;
    out.push(out[i - 1]! + haversineKm(a.lat, a.lng, b.lat, b.lng) * 1.4);
  }
  return out;
}

// ─── Line assembly ─────────────────────────────────────────────────────────

const KW = WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "khiri-wong")!;
const LS = WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "lan-saka")!;
const CITY = WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "city")!;
/** Source end (above the cascade) — sits at the watershed's Khao Luang
 *  peak rather than at Khiri Wong's gauge. Drives a tiny literal offset
 *  so the source terminus doesn't sit on top of KW's marker. */
const SOURCE: { lng: number; lat: number } = {
  lng: KW.lng - 0.012,
  lat: KW.lat + 0.020,
};

/** Build the cascade line using `summaries` as the live data source.
 *  Stations: source (terminus) → KW (local) → LS (transfer) → City
 *  (transfer) → Bay (terminus). */
export function buildCascadeLine(summaries: ZoneSummary[]): MetroLine {
  const sKW = summaries.find((s) => s.zone.key === "khiri-wong");
  const sLS = summaries.find((s) => s.zone.key === "lan-saka");
  const sCity = summaries.find((s) => s.zone.isCity);

  // All cascades in upstream→downstream order. Tha Dee zones only —
  // the Thung Song SW divide gets its own (future) line.
  const cascade = summaries.filter(isThaDeeZone);
  const sourceStatus = sourceStatusFor(cascade);

  // 1. Khao Luang source — sits at the watershed peak, derived status
  //    from the cascade's worst situation level.
  const stations: MetroStation[] = [
    {
      id: "khao-luang",
      lng: SOURCE.lng,
      lat: SOURCE.lat,
      labelEn: "Khao Luang",
      labelTh: "เขาหลวง",
      kind: "terminus",
      status: sourceStatus,
      levelM: null,
      trend: "·",
      kmFromSource: 0,
      etaH: null,
      role: "Mountain source",
    },
    {
      id: "khiri-wong",
      lng: KW.lng,
      lat: KW.lat,
      labelEn: "Khiri Wong",
      labelTh: "คีรีวง",
      kind: "local",
      status: summaryToStatus(sKW),
      levelM: sKW?.levelMsl ?? null,
      trend: trendGlyph(sKW),
      kmFromSource: 0, // filled by distanceFromSource below
      etaH: leadTimeToCity("khiri-wong")
        ? Math.round(((leadTimeToCity("khiri-wong")!.minH + leadTimeToCity("khiri-wong")!.maxH) / 2) * 10) / 10
        : null,
      role: "Tha Dee source",
    },
    {
      id: "lan-saka",
      lng: LS.lng,
      lat: LS.lat,
      labelEn: "Lan Saka",
      labelTh: "ลานสกา",
      kind: "local",
      status: summaryToStatus(sLS),
      levelM: sLS?.levelMsl ?? null,
      trend: trendGlyph(sLS),
      kmFromSource: 0,
      etaH: leadTimeToCity("lan-saka")
        ? Math.round(((leadTimeToCity("lan-saka")!.minH + leadTimeToCity("lan-saka")!.maxH) / 2) * 10) / 10
        : null,
      role: "Tha Dee upper reach",
    },
    {
      id: "city",
      lng: CITY.lng,
      lat: CITY.lat,
      labelEn: "NST City",
      labelTh: "เมืองนครศรีธรรมราช",
      kind: "transfer",
      status: summaryToStatus(sCity),
      levelM: sCity?.levelMsl ?? null,
      trend: trendGlyph(sCity),
      kmFromSource: 0,
      etaH: null, // city is the destination — no ETA required
      role: "City terminus",
    },
    {
      id: "pak-phanang-bay",
      lng: PAK_PHANANG_BAY_CENTROID.lng,
      lat: PAK_PHANANG_BAY_CENTROID.lat,
      labelEn: "Pak Phanang Bay",
      labelTh: "อ่าวปากพนัง",
      kind: "terminus",
      status: "normal",
      levelM: null,
      trend: "·",
      kmFromSource: 0,
      etaH: null,
      role: "Outlet · Gulf of Thailand",
    },
  ];

  // Backfill kmFromSource for each station.
  const kms = distanceFromSource(stations);
  for (let i = 0; i < stations.length; i++) stations[i]!.kmFromSource = kms[i] ?? 0;

  const overallStatus = stations
    .map((s) => s.status)
    .reduce<MetroStatus>(worstOf, "unknown");

  return {
    id: "tha-dee-cascade",
    nameEn: "Tha Dee Line",
    nameTh: "สายคลองท่าดี",
    // Cyan-blue accent chosen to read on a dark background — also matches
    // the existing on-map river bands so the diagram and map agree.
    colour: [110, 156, 200],
    accent: [76, 152, 196],
    stations,
    overallStatus,
  };
}

function sourceStatusFor(summaries: ZoneSummary[]): MetroStatus {
  const worst = summaries.reduce<number>(
    (n, s) => Math.max(n, s.situation ?? 0),
    0,
  );
  if (worst >= 5) return "critical";
  if (worst >= 4) return "prepare";
  if (worst >= 3) return "watch";
  return "normal";
}

function worstOf(a: MetroStatus, b: MetroStatus): MetroStatus {
  const rank: Record<MetroStatus, number> = {
    normal: 0, watch: 1, prepare: 2, critical: 3, unknown: 0,
  };
  return rank[a] >= rank[b] ? a : b;
}

// ─── Geometry: stylised between-station path ───────────────────────────────

/** Build the metro line's curved path. Smooth Bezier between anchors
 *  with control points biased perpendicular to the segment, so the line
 *  bows slightly between stops (the look of a real waterway vs a
 *  straight schematic) but still hits each anchor exactly.
 *
 *  Returns an array of [lng, lat] tuples — easy to feed straight into
 *  deck.gl PathLayer. */
export function buildLineGeometry(line: MetroLine, samples = 32): [number, number][] {
  const stops = line.stations;
  if (stops.length < 2) return stops.map((s) => [s.lng, s.lat] as [number, number]);
  const out: [number, number][] = [[stops[0]!.lng, stops[0]!.lat]];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    const segCount = i === stops.length - 2 ? samples : Math.max(8, Math.round(samples / (stops.length - 1)));
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;
    // Perpendicular offset (in degrees lat-lng) for the control points.
    // We bow ~15% of the segment length sideways so the line is curvy
    // but the geometry doesn't drift off course.
    const perpLen = Math.hypot(dx, dy) * 0.18;
    const px = -dy / Math.max(1e-9, Math.hypot(dx, dy)) * perpLen;
    const py = dx / Math.max(1e-9, Math.hypot(dx, dy)) * perpLen;
    // One control point on each side, biased so the bow alternates
    // between segments — keeps the curve from looking like a wave.
    const bias = i % 2 === 0 ? 1 : -1;
    const c1: [number, number] = [
      a.lng + dx * 0.33 + px * bias,
      a.lat + dy * 0.33 + py * bias,
    ];
    const c2: [number, number] = [
      a.lng + dx * 0.66 + px * bias,
      a.lat + dy * 0.66 + py * bias,
    ];
    for (let k = 1; k <= segCount; k++) {
      const t = k / segCount;
      // Cubic Bezier — De Casteljau, two control points.
      const p = bezier3(
        [a.lng, a.lat],
        c1,
        c2,
        [b.lng, b.lat],
        t,
      );
      out.push([p[0], p[1]]);
    }
  }
  return out;
}

function bezier3(
  p0: [number, number],
  c1: [number, number],
  c2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return [
    uuu * p0[0] + 3 * uu * t * c1[0] + 3 * u * tt * c2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * c1[1] + 3 * u * tt * c2[1] + ttt * p3[1],
  ];
}

// ─── Re-exports used by the UI layer ───────────────────────────────────────

export const METRO = {
  // Single source of truth for status → colour. Mirrors STATUS in lib/status
  // but stays locally scoped so the infographic never depends on deck.gl
  // for colour choices — only the data does.
  STATUS_COLOR: {
    normal:  "#4cc27a",
    watch:   "#f0b429",
    prepare: "#ff9a3d",
    critical: "#ff6b5e",
    unknown: "#a6a6a6",
  } satisfies Record<MetroStatus, string>,
} as const;

void KM_PER_DEG_LAT; // silence unused — kept as a constant for future distance helpers
