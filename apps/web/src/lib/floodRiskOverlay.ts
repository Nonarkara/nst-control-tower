/**
 * floodRiskOverlay — colour the waterways by current upstream gauge risk
 * so a child can read "where the water is rising" on the map.
 *
 * Each LineString in the waterways GeoJSON gets a `riskStatus` property
 * computed by finding the NEAREST upstream WaterGauge and reading its
 * situation level. The output collection drives a wide stroke PathLayer
 * (8-14 px depending on the situation level) so the river itself reads
 * as the level: thin green = calm river, thick red = flooding.
 *
 * Designed for city-zoom viewing (zoomBucket 1 / 2): features stay
 * below ~600 m wide so the cartoon doesn't dwarf the buildings
 * underneath.
 */

import type { FeatureCollection, LineString } from "geojson";
import type { WaterGauge } from "@nst/shared";

export type WaterwayRiskStatus = "normal" | "watch" | "warning" | "critical" | "unknown";

export interface WaterwayFeatureProps {
  /** River/canal/stream classification (passed through). */
  waterway?: string;
  /** Flow class (passed through). */
  flowClass?: string;
  /** Computed risk status from nearest gauge. */
  riskStatus: WaterwayRiskStatus;
  /** Pixels of stroke width — bigger = closer to overbank. */
  widthPx: number;
  /** Optional debug: nearest gauge id, for tooltips. */
  nearestGaugeId?: string;
  /** Optional debug: nearest gauge situation level (1-5). */
  nearestSituation?: number;
}

/** HII situation level → risk band. 5 overbank = critical (red), 4 high =
 *  warning (orange), 3 normal / 2 low / 1 drought = normal (green).
 *  Watch (yellow) is reserved for "rising fast" — separate pass. */
function situationToRisk(sit: number | undefined): WaterwayRiskStatus {
  if (sit == null || !Number.isFinite(sit)) return "unknown";
  if (sit >= 5) return "critical";
  if (sit >= 4) return "warning";
  if (sit >= 1) return "normal";
  return "unknown";
}

const RIVER_BASE_WIDTH_PX: Record<WaterwayRiskStatus, number> = {
  normal: 4,
  watch: 6,
  warning: 9,
  critical: 12,
  unknown: 4,
};

const CANAL_BASE_WIDTH_PX: Record<WaterwayRiskStatus, number> = {
  normal: 3,
  watch: 4,
  warning: 6,
  critical: 8,
  unknown: 3,
};

const RISK_RGBA: Record<WaterwayRiskStatus, [number, number, number, number]> = {
  // Same status palette as the rest of the dashboard — never invented hues.
  normal:  [138, 180, 255, 230],
  watch:   [240, 180, 41,  230],
  warning: [255, 154, 61,  230],
  critical:[255, 107, 94,  230],
  unknown: [120, 130, 145, 180],
};

export function riskStatusToRgba(s: WaterwayRiskStatus): [number, number, number, number] {
  return RISK_RGBA[s];
}

/** Find the nearest WaterGauge to a [lng, lat] point. Haversine — the
 *  waterways dataset is small enough that O(N) per feature is fine. */
function nearestGauge(
  lng: number,
  lat: number,
  gauges: WaterGauge[],
): WaterGauge | null {
  let best: { g: WaterGauge; km: number } | null = null;
  for (const g of gauges) {
    const km = haversineKm(lat, lng, g.lat, g.lng);
    if (best == null || km < best.km) best = { g, km };
  }
  // If nothing is within 8 km, treat as unknown — keeps far-away
  // waterways from being falsely coloured by a distant cascade.
  if (best == null || best.km > 8) return null;
  return best.g;
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

/** Walk each LineString's first coordinate to find the nearest gauge.
 *  Cheap + deterministic — works on the first point of the river, which
 *  for most Thai rivers is upstream. (Could be improved with the
 *  nearest-to-river-centroid instead of the upstream point, but
 *  upstream is fine for the kid-readable overview.) */
export function colorizeWaterways(
  collection: FeatureCollection<LineString, Record<string, unknown>>,
  gauges: WaterGauge[],
): FeatureCollection<LineString, WaterwayFeatureProps> {
  const out: FeatureCollection<LineString, WaterwayFeatureProps> = {
    type: "FeatureCollection",
    features: collection.features.map((f) => {
      const first = f.geometry.coordinates[0] ?? [0, 0];
      const gauge = nearestGauge(first[0], first[1], gauges);
      const riskStatus: WaterwayRiskStatus = gauge ? situationToRisk(gauge.situationLevel) : "unknown";
      const waterway = String(f.properties?.waterway ?? "stream").toLowerCase();
      const base = waterway === "river" ? RIVER_BASE_WIDTH_PX : CANAL_BASE_WIDTH_PX;
      const widthPx = base[riskStatus];
      const props: WaterwayFeatureProps = {
        waterway: f.properties?.waterway as string | undefined,
        flowClass: f.properties?.flowClass as string | undefined,
        riskStatus,
        widthPx,
        nearestGaugeId: gauge?.id,
        nearestSituation: gauge?.situationLevel,
      };
      return { ...f, properties: props };
    }),
  };
  return out;
}

/** Compute the dominant risk across all gauge readings. Used for the
 *  layer's overall service-status chip in the layer palette. */
export function dominantRisk(gauges: WaterGauge[]): WaterwayRiskStatus {
  const worst = gauges.reduce<number>((n, g) => Math.max(n, g.situationLevel ?? 0), 0);
  return situationToRisk(worst);
}
