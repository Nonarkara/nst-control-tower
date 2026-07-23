/**
 * Sensor Situation — graphic summaries for water + air telemetry.
 *
 * FloodDash (water) and AirDash (air) both reduce dense station networks
 * into a few human-readable signals: where is it worst, which way is water
 * moving, how concentrated is the field. Pure helpers so the board and
 * the map layers share one vocabulary.
 */

import type { AirQualityPoint, RainfallStation, WaterGauge } from "@nst/shared";

export type SituationBand = "calm" | "watch" | "elevated" | "critical";

export interface WaterSituationSummary {
  stationCount: number;
  overbank: number;
  high: number;
  rising: number;
  falling: number;
  maxFullnessPct: number | null;
  worst: WaterGauge | null;
  band: SituationBand;
  /** Mean freeboard (m): negative ⇒ above bank. */
  meanFreeboardM: number | null;
}

export interface AirSituationSummary {
  stationCount: number;
  withReading: number;
  maxPm25: number | null;
  maxAqi: number | null;
  worst: AirQualityPoint | null;
  band: SituationBand;
  /** Share of stations at unhealthy-or-worse (US EPA). */
  unhealthyShare: number;
}

export interface RainSituationSummary {
  stationCount: number;
  heavy: number; // ≥ 35 mm / 24 h (TMD)
  veryHeavy: number; // ≥ 90 mm / 24 h
  maxRain24h: number | null;
  band: SituationBand;
}

export interface FlowStep {
  name: string;
  nameEn: string;
  levelM: number | null;
  freeboardM: number | null;
  situationLevel: number;
  trend: WaterGauge["trend"] | "unknown";
  lat: number;
  lng: number;
}

/** Match station name / amphoe only — never riverName (every Tha Dee gauge shares it). */
const THA_DEE_FLOW: Array<{ match: RegExp; name: string; nameEn: string }> = [
  { match: /คีรีวง|khiri\s*wong|kiriwong/i, name: "คีรีวง", nameEn: "Khiri Wong" },
  { match: /ลานสกา|lan\s*saka/i, name: "ลานสกา", nameEn: "Lan Saka" },
  { match: /เมือง|muang|นครศรี|nakhon\s*si|เทศบาล/i, name: "เมืองนคร", nameEn: "City" },
];

export function waterBand(g: WaterGauge): SituationBand {
  if (g.situationLevel >= 5) return "critical";
  if (g.situationLevel >= 4) return "elevated";
  if (g.trend === "rising" && (g.fullnessPct ?? 0) >= 70) return "watch";
  return "calm";
}

export function summarizeWater(gauges: WaterGauge[]): WaterSituationSummary {
  if (gauges.length === 0) {
    return {
      stationCount: 0,
      overbank: 0,
      high: 0,
      rising: 0,
      falling: 0,
      maxFullnessPct: null,
      worst: null,
      band: "calm",
      meanFreeboardM: null,
    };
  }

  const overbank = gauges.filter((g) => g.situationLevel >= 5).length;
  const high = gauges.filter((g) => g.situationLevel === 4).length;
  const rising = gauges.filter((g) => g.trend === "rising").length;
  const falling = gauges.filter((g) => g.trend === "falling").length;

  let maxFullnessPct: number | null = null;
  let worst: WaterGauge | null = null;
  let freeSum = 0;
  let freeN = 0;

  for (const g of gauges) {
    if (g.fullnessPct != null) {
      maxFullnessPct = maxFullnessPct == null ? g.fullnessPct : Math.max(maxFullnessPct, g.fullnessPct);
    }
    if (g.diffFromBank != null) {
      // diffFromBank: positive = overbank; freeboard = -diffFromBank
      freeSum += -g.diffFromBank;
      freeN++;
    }
    if (
      !worst ||
      g.situationLevel > worst.situationLevel ||
      (g.situationLevel === worst.situationLevel && (g.fullnessPct ?? 0) > (worst.fullnessPct ?? 0))
    ) {
      worst = g;
    }
  }

  let band: SituationBand = "calm";
  if (overbank > 0) band = "critical";
  else if (high >= 2) band = "elevated";
  else if (high === 1 || rising >= Math.ceil(gauges.length * 0.35)) band = "watch";

  return {
    stationCount: gauges.length,
    overbank,
    high,
    rising,
    falling,
    maxFullnessPct,
    worst,
    band,
    meanFreeboardM: freeN > 0 ? freeSum / freeN : null,
  };
}

export function summarizeAir(stations: AirQualityPoint[]): AirSituationSummary {
  const withPm = stations.filter((s) => s.pm25 != null || s.aqi != null);
  if (withPm.length === 0) {
    return {
      stationCount: stations.length,
      withReading: 0,
      maxPm25: null,
      maxAqi: null,
      worst: null,
      band: "calm",
      unhealthyShare: 0,
    };
  }

  let maxPm25: number | null = null;
  let maxAqi: number | null = null;
  let worst: AirQualityPoint | null = null;
  let unhealthy = 0;

  for (const s of withPm) {
    if (s.pm25 != null) maxPm25 = maxPm25 == null ? s.pm25 : Math.max(maxPm25, s.pm25);
    if (s.aqi != null) maxAqi = maxAqi == null ? s.aqi : Math.max(maxAqi, s.aqi);
    const score = s.pm25 ?? s.aqi ?? 0;
    const worstScore = worst ? (worst.pm25 ?? worst.aqi ?? 0) : -1;
    if (score > worstScore) worst = s;
    if (
      s.category === "unhealthy-sg" ||
      s.category === "unhealthy" ||
      s.category === "very-unhealthy" ||
      s.category === "hazardous" ||
      (s.pm25 != null && s.pm25 > 35.4) ||
      (s.aqi != null && s.aqi > 100)
    ) {
      unhealthy++;
    }
  }

  let band: SituationBand = "calm";
  const peak = maxPm25 ?? maxAqi ?? 0;
  if (peak > 150.4 || (maxAqi != null && maxAqi > 200)) band = "critical";
  else if (peak > 55.4 || (maxAqi != null && maxAqi > 150)) band = "elevated";
  else if (peak > 35.4 || (maxAqi != null && maxAqi > 100)) band = "watch";

  return {
    stationCount: stations.length,
    withReading: withPm.length,
    maxPm25,
    maxAqi,
    worst,
    band,
    unhealthyShare: unhealthy / withPm.length,
  };
}

export function summarizeRain(stations: RainfallStation[]): RainSituationSummary {
  if (stations.length === 0) {
    return { stationCount: 0, heavy: 0, veryHeavy: 0, maxRain24h: null, band: "calm" };
  }
  let maxRain24h: number | null = null;
  let heavy = 0;
  let veryHeavy = 0;
  for (const s of stations) {
    const mm = s.rain24h ?? 0;
    if (s.rain24h != null) maxRain24h = maxRain24h == null ? s.rain24h : Math.max(maxRain24h, s.rain24h);
    if (mm >= 90) veryHeavy++;
    else if (mm >= 35) heavy++;
  }
  let band: SituationBand = "calm";
  if (veryHeavy > 0) band = "critical";
  else if (heavy >= 3) band = "elevated";
  else if (heavy >= 1) band = "watch";
  return { stationCount: stations.length, heavy, veryHeavy, maxRain24h, band };
}

/** Pick Tha Dee cascade stations in upstream→city order for the flow strip. */
export function thaDeeFlowSteps(gauges: WaterGauge[]): FlowStep[] {
  const steps: FlowStep[] = [];
  for (const def of THA_DEE_FLOW) {
    const hit = gauges.find(
      (g) => def.match.test(g.name) || def.match.test(g.amphoe),
    );
    if (!hit) continue;
    steps.push({
      name: def.name,
      nameEn: def.nameEn,
      levelM: hit.levelMsl,
      freeboardM: hit.diffFromBank != null ? -hit.diffFromBank : null,
      situationLevel: hit.situationLevel,
      trend: hit.trend,
      lat: hit.lat,
      lng: hit.lng,
    });
  }
  return steps;
}

/** Heatmap weight 0–1 from water situation (overbank dominates). */
export function waterHeatWeight(g: WaterGauge): number {
  if (g.fullnessPct != null && Number.isFinite(g.fullnessPct)) {
    return Math.min(1, Math.max(0.05, g.fullnessPct / 120));
  }
  return Math.min(1, Math.max(0.08, g.situationLevel / 5));
}

/** Heatmap weight 0–1 from PM2.5 / AQI. */
export function airHeatWeight(s: AirQualityPoint): number {
  if (s.pm25 != null && Number.isFinite(s.pm25)) {
    return Math.min(1, Math.max(0.05, s.pm25 / 150));
  }
  if (s.aqi != null && Number.isFinite(s.aqi)) {
    return Math.min(1, Math.max(0.05, s.aqi / 200));
  }
  return 0;
}

export function bandLabel(band: SituationBand): string {
  switch (band) {
    case "critical":
      return "CRITICAL";
    case "elevated":
      return "ELEVATED";
    case "watch":
      return "WATCH";
    default:
      return "CALM";
  }
}
