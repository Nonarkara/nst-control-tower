/**
 * floodScenario — static-level ("bathtub") street-flooding arithmetic over the
 * HII 2025 road-elevation survey (see public/geo/nst/hii/road-levels.geojson).
 *
 * Everything here is direct comparison against surveyed elevations on ONE
 * shared datum (m MSL) — no flow routing, no drainage dynamics, no timing.
 * That limitation is surfaced in the FLOOD COMMAND panel caveat; what this
 * buys in exchange is total auditability: "at level L these points are below
 * water" is measurement, not model.
 */

import type { Feature, FeatureCollection, Point } from "geojson";
import type { FloodMarkProps, RoadLevelProps } from "../map/layers";

/** Historic reference levels, m MSL — derived from the HII flood-mark survey
 *  shipped in flood-marks.geojson (43 normal-season + 40 Pabuk marks):
 *  NORMAL = median of the normal-season set, PABUK = the Pabuk set's maximum.
 *  Recompute if the source assets are regenerated. */
export const SCENARIO_PRESETS = [
  { key: "normal", label: "NORMAL FLOOD", levelM: 1.24 },
  // "MAX" in the label on purpose — 2.12 m is the HIGHEST surveyed Pabuk
  // mark (the Pabuk median was 1.66 m); presenting the max as "the Pabuk
  // level" without saying so would overstate the typical footprint.
  { key: "pabuk", label: "PABUK 2019 MAX", levelM: 2.12 },
] as const;

export const SCENARIO_MIN_M = 0.8;
export const SCENARIO_MAX_M = 3.0;

export interface ScenarioIndexPoint {
  z: number;
  /** Road length this survey point represents (m) — from the gap to its
   *  same-route neighbour, capped so route-to-route jumps don't inflate it. */
  segM: number;
}

export interface ScenarioIndex {
  points: ScenarioIndexPoint[];
  totalKm: number;
}

// Survey points sit ~2.5 m apart within a route (thinned from the ~0.8 m raw
// spacing); anything much longer is a gap or a route boundary, not road.
const MAX_SEG_M = 30;

function metersBetween(a: [number, number], b: [number, number]): number {
  // Equirectangular — fine at survey-point spacing.
  const kx = 111_320 * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const ky = 110_574;
  const dx = (a[0] - b[0]) * kx;
  const dy = (a[1] - b[1]) * ky;
  return Math.hypot(dx, dy);
}

/**
 * One-time prep: measure how much road each surveyed point stands for, so the
 * scenario can report km (not just point counts). Self-calibrating from the
 * data itself — no assumed spacing constant.
 */
export function buildScenarioIndex(
  collection: FeatureCollection<Point, RoadLevelProps>,
): ScenarioIndex {
  const feats = collection.features;
  const points: ScenarioIndexPoint[] = [];
  let totalM = 0;
  for (let i = 0; i < feats.length; i++) {
    const f = feats[i];
    const prev = i > 0 ? feats[i - 1] : null;
    const sameRoute = prev != null && prev.properties.route === f.properties.route;
    const gap = sameRoute
      ? metersBetween(
          prev.geometry.coordinates as [number, number],
          f.geometry.coordinates as [number, number],
        )
      : 0;
    const segM = gap > 0 && gap <= MAX_SEG_M ? gap : 0;
    points.push({ z: f.properties.z, segM });
    totalM += segM;
  }
  return { points, totalKm: totalM / 1000 };
}

export interface FloodScenarioStats {
  levelM: number;
  wetCount: number;
  totalCount: number;
  /** Share of surveyed points below the level, 0–1. */
  wetShare: number;
  wetKm: number;
  totalKm: number;
  /** Deepest submergence (level − lowest surveyed z), m. */
  deepestM: number;
  /** Historical high-water marks at or below this level. */
  marksExceeded: number;
  marksTotal: number;
}

export function floodScenarioStats(
  index: ScenarioIndex,
  marks: Feature<Point, FloodMarkProps>[],
  levelM: number,
): FloodScenarioStats {
  let wetCount = 0;
  let wetM = 0;
  let minZ = Infinity;
  for (const p of index.points) {
    if (p.z < minZ) minZ = p.z;
    if (p.z < levelM) {
      wetCount++;
      wetM += p.segM;
    }
  }
  const totalCount = index.points.length;
  const marksExceeded = marks.filter((m) => m.properties.z <= levelM).length;
  return {
    levelM,
    wetCount,
    totalCount,
    wetShare: totalCount ? wetCount / totalCount : 0,
    wetKm: wetM / 1000,
    totalKm: index.totalKm,
    deepestM: totalCount && levelM > minZ ? levelM - minZ : 0,
    marksExceeded,
    marksTotal: marks.length,
  };
}
