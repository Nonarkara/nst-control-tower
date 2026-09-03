/**
 * Blinking downhill arrows on every waterway.
 *
 * Direction = DEM-oriented node order (high → low). Thickness = live discharge
 * when a gauge is near the reach; otherwise MODELLED from flowClass. Blink
 * rate tracks the same amount. Typography names reaches, marks HIGH/LOW, and
 * shows m³/s arriving at Nakhon Si Thammarat (the LOW end of คลองท่าดี).
 */

import { PathLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { Feature, LineString } from "geojson";
import type { WaterGauge } from "@nst/shared";
import {
  WATERSHED_ZONES,
  fmtCityInflowShort,
  type CityInflow,
} from "../lib/watershed";

export type WaterwayFlowClass = "slow" | "medium" | "fast";

export interface WaterwayArrowProps {
  waterway?: string;
  name?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
  flowClass?: WaterwayFlowClass;
  slopePct?: number;
  downhillConfident?: boolean;
  elevStart?: number | null;
  elevEnd?: number | null;
  lengthM?: number | null;
}

export interface PreparedRiver {
  coords: [number, number][];
  color: [number, number, number];
  amount: number;
  sizePx: number;
  widthPx: number;
  blinkMs: number;
  gauged: boolean;
  name: string;
  elevStart: number | null;
  elevEnd: number | null;
  downhillConfident: boolean;
  thaDee: boolean;
  seeds: RiverArrowSeed[];
}

export interface RiverArrowSeed {
  position: [number, number];
  angle: number;
}

export interface RiverGlyph extends RiverArrowSeed {
  size: number;
  color: [number, number, number, number];
}

export interface RiverLabel {
  position: [number, number];
  text: string;
  size: number;
  offset: [number, number];
  color: [number, number, number, number];
}

const MIN_LEN_DEG = 0.004; // skip sub-~450 m stubs
const ARROW_SPACING_DEG = 0.014; // ~1.5 km
const MAX_ARROWS = 6;
const MATCH_DEG2 = 0.022 * 0.022; // ~2.4 km
const THA_DEE_MATCH_DEG2 = 0.04 * 0.04;
const MODELLED_AMOUNT: Record<WaterwayFlowClass, number> = { slow: 0.22, medium: 0.45, fast: 0.78 };
const COLOR_SLOW: [number, number, number] = [37, 99, 235];
const COLOR_FAST: [number, number, number] = [224, 242, 254];
const COLOR_FLOOD: [number, number, number] = [239, 68, 68];
const COLOR_HIGH: [number, number, number] = [251, 146, 60];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function isThaDeeName(name: string): boolean {
  return /ท่าดี|tha\s*d[ie]/i.test(name);
}

export function featureName(p: WaterwayArrowProps): string {
  return [p.nameTh, p.name, p.nameEn].filter((s) => s && String(s).trim()).join(" ");
}

export function segmentAngleDeg(from: [number, number], to: [number, number]): number {
  // CCW from +lng (east) — matches a right-pointing ▶ on a billboard:false TextLayer.
  return (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
}

export function arrowSizePx(amount: number): number {
  return 14 + clamp(amount, 0, 1.3) * 22;
}

export function flowWidthPx(amount: number): number {
  return 2 + clamp(amount, 0, 1.3) * 8;
}

export function blinkMsForAmount(amount: number, flood: boolean): number {
  if (flood) return 520;
  return 1600 - clamp(amount, 0, 1) * 1000;
}

/** Opacity pulse 110–255 so arrows blink without vanishing. */
export function blinkAlpha(tMs: number, cycleMs: number): number {
  const phase = ((tMs % cycleMs) / cycleMs) * Math.PI;
  return Math.round(110 + 145 * Math.abs(Math.sin(phase)));
}

export function amountFromSensors(
  gauge: WaterGauge | null,
  flowClass: WaterwayFlowClass,
): { amount: number; gauged: boolean } {
  if (gauge?.dischargeCms != null && Number.isFinite(gauge.dischargeCms)) {
    if (gauge.qmaxCms != null && gauge.qmaxCms > 0) {
      return { amount: clamp(gauge.dischargeCms / gauge.qmaxCms, 0, 1.3), gauged: true };
    }
    return { amount: clamp(gauge.dischargeCms / 80, 0.08, 1.2), gauged: true };
  }
  if (gauge?.fullnessPct != null && Number.isFinite(gauge.fullnessPct)) {
    return { amount: clamp(gauge.fullnessPct / 100, 0.08, 1.2), gauged: true };
  }
  return { amount: MODELLED_AMOUNT[flowClass], gauged: false };
}

export function arrowColor(
  amount: number,
  gauged: boolean,
  situation: number | null,
): [number, number, number] {
  if (gauged && situation != null && situation >= 5) return COLOR_FLOOD;
  if (gauged && situation != null && situation >= 4) return COLOR_HIGH;
  const t = clamp(amount, 0, 1);
  return [
    Math.round(COLOR_SLOW[0] + (COLOR_FAST[0] - COLOR_SLOW[0]) * t),
    Math.round(COLOR_SLOW[1] + (COLOR_FAST[1] - COLOR_SLOW[1]) * t),
    Math.round(COLOR_SLOW[2] + (COLOR_FAST[2] - COLOR_SLOW[2]) * t),
  ];
}

export function matchReachGauge(
  lng: number,
  lat: number,
  gauges: WaterGauge[],
  thaDee: boolean,
): WaterGauge | null {
  const maxD = thaDee ? THA_DEE_MATCH_DEG2 : MATCH_DEG2;
  let best: WaterGauge | null = null;
  let bestScore = Infinity;
  for (const g of gauges) {
    const d = (g.lng - lng) ** 2 + (g.lat - lat) ** 2;
    if (d > maxD) continue;
    const score = d - (g.dischargeCms != null ? 0.01 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = g;
    }
  }
  return best;
}

function lineLengthDeg(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
  }
  return total;
}

export function placeArrows(
  coords: [number, number][],
  spacingDeg = ARROW_SPACING_DEG,
  maxCount = MAX_ARROWS,
): RiverArrowSeed[] {
  const out: RiverArrowSeed[] = [];
  if (coords.length < 2) return out;
  let acc = 0;
  let nextAt = spacingDeg * 0.45;
  for (let i = 0; i < coords.length - 1 && out.length < maxCount; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len === 0) continue;
    const angle = segmentAngleDeg(a, b);
    while (nextAt <= acc + len && out.length < maxCount) {
      const t = (nextAt - acc) / len;
      out.push({
        position: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        angle,
      });
      nextAt += spacingDeg;
    }
    acc += len;
  }
  if (out.length === 0) {
    const mid = Math.floor((coords.length - 1) / 2);
    out.push({
      position: coords[mid],
      angle: segmentAngleDeg(coords[mid], coords[mid + 1] ?? coords[mid]),
    });
  }
  return out;
}

export function prepareRiverArrows(
  features: Feature<LineString, WaterwayArrowProps>[],
  gauges: WaterGauge[] = [],
): PreparedRiver[] {
  const out: PreparedRiver[] = [];
  for (const f of features) {
    const coords = f.geometry?.coordinates as [number, number][] | undefined;
    if (!coords || coords.length < 2) continue;
    const len = lineLengthDeg(coords);
    if (len < MIN_LEN_DEG) continue;
    const p = f.properties ?? {};
    const name = featureName(p);
    const thaDee = isThaDeeName(name);
    const fclass: WaterwayFlowClass = p.flowClass ?? "medium";
    const mid = coords[Math.floor(coords.length / 2)];
    const gauge = matchReachGauge(mid[0], mid[1], gauges, thaDee);
    const { amount, gauged } = amountFromSensors(gauge, fclass);
    const flood = (gauge?.situationLevel ?? 0) >= 5;
    out.push({
      coords,
      color: arrowColor(amount, gauged, gauge?.situationLevel ?? null),
      amount,
      sizePx: arrowSizePx(amount),
      widthPx: flowWidthPx(amount),
      blinkMs: blinkMsForAmount(amount, flood),
      gauged,
      name,
      elevStart: p.elevStart ?? null,
      elevEnd: p.elevEnd ?? null,
      downhillConfident: p.downhillConfident !== false,
      thaDee,
      seeds: placeArrows(coords),
    });
  }
  return out;
}

export function riverArrowGlyphs(prepared: PreparedRiver[], tMs: number): RiverGlyph[] {
  const glyphs: RiverGlyph[] = [];
  for (const line of prepared) {
    const a = blinkAlpha(tMs, line.blinkMs);
    for (const seed of line.seeds) {
      glyphs.push({
        ...seed,
        size: line.sizePx,
        color: [line.color[0], line.color[1], line.color[2], a],
      });
    }
  }
  return glyphs;
}

export function riverArrowLayer(glyphs: RiverGlyph[]) {
  return new TextLayer<RiverGlyph>({
    id: "waterway-flow",
    data: glyphs,
    getPosition: (d) => d.position,
    getText: () => "▶",
    getSize: (d) => d.size,
    sizeUnits: "pixels",
    getAngle: (d) => d.angle,
    getColor: (d) => d.color,
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    billboard: false,
    fontFamily: "sans-serif",
    fontWeight: "bold",
    outlineColor: [10, 14, 20, 200],
    outlineWidth: 2,
    fontSettings: { sdf: true, radius: 12, buffer: 8 },
    pickable: false,
    parameters: { depthTest: false },
  });
}

export function riverFlowWidthLayer(prepared: PreparedRiver[]) {
  return new PathLayer<PreparedRiver>({
    id: "waterway-flow-width",
    data: prepared,
    getPath: (d) => d.coords,
    getColor: (d) => [d.color[0], d.color[1], d.color[2], d.gauged ? 160 : 110],
    getWidth: (d) => d.widthPx,
    widthUnits: "pixels",
    widthMinPixels: 1.5,
    capRounded: true,
    jointRounded: true,
    pickable: false,
    parameters: { depthTest: false },
  });
}

function labelColor(kind: "name" | "high" | "low" | "inflow" | "place"): [number, number, number, number] {
  if (kind === "high") return [253, 224, 71, 235];
  if (kind === "low" || kind === "inflow") return [125, 211, 252, 240];
  return [255, 255, 255, 230];
}

export function riverTypographyData(
  prepared: PreparedRiver[],
  inflow: CityInflow,
): RiverLabel[] {
  const labels: RiverLabel[] = [];
  const seen = new Set<string>();
  for (const line of prepared) {
    if (!line.name && !line.thaDee) continue;
    const key = `${line.name}|${line.coords[0][0].toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const mid = line.coords[Math.floor(line.coords.length / 2)];
    const start = line.coords[0];
    const end = line.coords[line.coords.length - 1];
    const display = line.name || "คลองท่าดี Tha Dee";
    labels.push({
      position: mid,
      text: display,
      size: line.thaDee ? 13 : 11,
      offset: [0, -14],
      color: labelColor("name"),
    });
    if (line.elevStart != null) {
      labels.push({
        position: start,
        text: `▲ HIGH ${Math.round(line.elevStart)} m`,
        size: 11,
        offset: [0, -12],
        color: labelColor("high"),
      });
    }
    if (line.elevEnd != null) {
      const floodHere = line.thaDee && line.elevEnd <= 15;
      labels.push({
        position: end,
        text: floodHere
          ? `▼ LOW ${Math.round(line.elevEnd)} m → เมือง floods here`
          : `▼ LOW ${Math.round(line.elevEnd)} m`,
        size: 11,
        offset: [0, 12],
        color: labelColor("low"),
      });
    }
  }

  for (const z of WATERSHED_ZONES) {
    const caption = z.isCity
      ? fmtCityInflowShort(inflow)
      : z.key === "khiri-wong"
        ? "▲ HIGH · Tha Dee source · water runs downhill"
        : z.key === "lan-saka"
          ? "↓ downhill to the city lowland"
          : "SW divide · not Tha Dee";
    labels.push({
      position: [z.lng, z.lat],
      text: `${z.th} ${z.en} · ${caption}`,
      size: z.isCity ? 13 : 11,
      offset: z.isCity ? [0, 20] : [0, 18],
      color: labelColor(z.isCity ? "inflow" : "place"),
    });
  }
  return labels;
}

export function riverTypographyLayer(labels: RiverLabel[]) {
  return new TextLayer<RiverLabel>({
    id: "waterway-flow-labels",
    data: labels,
    getPosition: (d) => d.position,
    getText: (d) => d.text,
    getSize: (d) => d.size,
    getColor: (d) => d.color,
    getPixelOffset: (d) => d.offset,
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    billboard: true,
    fontFamily: "'Inter', 'IBM Plex Sans Thai', sans-serif",
    fontWeight: "bold",
    background: true,
    getBackgroundColor: [10, 14, 20, 175],
    backgroundPadding: [4, 2],
    parameters: { depthTest: false },
    pickable: false,
  }) as Layer;
}
