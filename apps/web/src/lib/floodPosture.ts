/**
 * floodPosture — decision-support synthesis for the FLOOD lens.
 *
 * Fuses the live signals NST already collects (ThaiWater gauges, rainfall,
 * precip nowcast) into a single staged municipal alert level and the action it
 * warrants — closing the "decision-support gap" municipalities report (Cao et
 * al. 2024, IJDRR).
 *
 * Method, grounded in the Japan-ASEAN Flood Roundtable (SIWW, 15 Jun 2026):
 *  • 5-level alert ladder — JMA evacuation scale (1-2 advisory, 3 evacuate-
 *    vulnerable, 4 evacuation order, 5 emergency) cross-walked to JAXA
 *    "Today's Earth" return-period flood-risk levels.
 *  • Composite trigger — like Okazaki City's Yahagi River plan, the level is
 *    driven by BOTH observed river state AND forecast rainfall.
 *  • Upland weighting — the actionable signal arrives upstream (Khao Luang)
 *    hours before the city floods (Iligan "Project Daloy" lesson).
 *  • Precautionary bias — ~76% of municipalities prioritise avoiding a missed
 *    event over a false alarm (Cao 2024); ties break upward.
 */

import type { WaterGauge, PrecipNowcast, RainfallStation, EwsStation } from "@nst/shared";

export type Level = 1 | 2 | 3 | 4 | 5;

export interface LadderStep {
  level: Level;
  th: string;
  en: string;
  action: string;
  color: string;
  issuer: string;
}

// JMA evacuation ladder (Cao 2024) × JAXA Today's Earth return-period levels.
// Levels 1-2 = advisory (national agency); 3-5 = municipal action decisions.
export const LADDER: Record<Level, LadderStep> = {
  1: {
    level: 1,
    th: "เฝ้าระวัง",
    en: "MONITOR",
    action: "Routine watch. Track upland rain + gauge trend.",
    color: "var(--good)",
    issuer: "TMD / HII advisory",
  },
  2: {
    level: 2,
    th: "เตรียมพร้อม",
    en: "STANDBY",
    action: "Brief response staff, pre-position pumps & barriers, verify shelters.",
    color: "var(--data)",
    issuer: "TMD / HII advisory",
  },
  3: {
    level: 3,
    th: "อพยพกลุ่มเปราะบาง",
    en: "EVAC VULNERABLE",
    action: "Move elderly, disabled & low-lying households early. Open shelters.",
    color: "var(--warn)",
    issuer: "Municipality decision",
  },
  4: {
    level: 4,
    th: "สั่งอพยพ",
    en: "EVACUATION ORDER",
    action: "Order evacuation of flood zones — complete movement before peak.",
    color: "var(--bad)",
    issuer: "Municipality decision",
  },
  5: {
    level: 5,
    th: "ภาวะฉุกเฉิน",
    en: "EMERGENCY",
    action: "Life-safety only. Vertical evacuation, swiftwater rescue, DDPM EOC.",
    color: "var(--bad)",
    issuer: "Municipality / DDPM",
  },
};

// TMD heavy-rain bands (mm/24h): หนัก 35–90, หนักมาก > 90.
export const RAIN_HEAVY = 35;
export const RAIN_VERY_HEAVY = 90;
// Soil moisture (%) at/above which an upland slope is flash-flood primed.
export const SOIL_PRIMED = 85;

// Khao Luang / Tha Dee headwater amphoe — rain here becomes the city's river rise
// hours later, so these stations are the leading indicator (Iligan "Project Daloy"
// lesson). Both Thai and romanised spellings, because HII rainfall reports English
// amphoe ("Lan Saka District") while DWR EWS reports Thai ("ลานสกา").
export const UPLAND_AMPHOE = [
  "ลานสกา", "นบพิตำ", "พิปูน", "พรหมคีรี", "ทุ่งสง", "ช้างกลาง",
  "Lan Saka", "Nopphitam", "Phipun", "Phrom Khiri", "Thung Song", "Chang Klang",
];
function isUpland(amphoe: string | undefined): boolean {
  return amphoe != null && UPLAND_AMPHOE.some((a) => amphoe.includes(a));
}

// DWR EWS official status (0-3) → the alert level it justifies on the ladder.
const EWS_STATUS_TO_LEVEL: Record<EwsStation["status"], Level> = { 0: 1, 1: 2, 2: 3, 3: 4 };

export interface Posture {
  level: Level;
  drivers: string[];
  worstSit: number;
  overbankCount: number;
  risingCount: number;
  rain24hMax: number;
  uplandRain: number;
  /** Worst DWR EWS official alert status across NST upland stations (0-3). */
  worstEwsStatus: 0 | 1 | 2 | 3;
  /** Upland stations with saturated soil AND heavy 12h rain — flash-flood primed. */
  primedCount: number;
  /** Max upland soil moisture (%). */
  maxSoil: number | null;
}

export function computePosture(
  gauges: WaterGauge[],
  rainfall: RainfallStation[],
  precip: PrecipNowcast | null,
  ews: EwsStation[] = [],
): Posture {
  const drivers: string[] = [];

  const worstSit = gauges.reduce((m, g) => Math.max(m, g.situationLevel), 0);
  const overbankCount = gauges.filter((g) => g.situationLevel >= 5).length;
  const risingCount = gauges.filter((g) => g.trend === "rising").length;

  // Upland (headwater) stations lead the city: the composite escalator is driven
  // by the worst UPLAND 24h rainfall, while rain24hMax keeps the genuine
  // province-wide observed max for context/display. When no upland gauge reports,
  // upland rain falls back to the all-station max so the escalator never silently
  // reads 0 (precautionary bias — Cao 2024).
  const withRain = rainfall.filter((r) => r.rain24h != null);
  const rain24hMax = withRain.reduce((m, r) => Math.max(m, r.rain24h ?? 0), 0);
  const uplandStations = withRain.filter((r) => isUpland(r.amphoe));
  const hasUpland = uplandStations.length > 0;
  const uplandRain = hasUpland
    ? uplandStations.reduce((m, r) => Math.max(m, r.rain24h ?? 0), 0)
    : rain24hMax;

  // 1. Base level from observed river state (the dominant decision input).
  let level = 1;
  if (worstSit >= 5) {
    level = 4;
    drivers.push("river overbank (situation 5)");
  } else if (worstSit === 4) {
    level = 3;
    drivers.push("river high (situation 4)");
  }

  // 2. Composite forecast escalation (Okazaki-style: observed + forecast),
  //    driven by the LEADING upland rainfall signal.
  const rainLabel = hasUpland ? "upland" : "rain";
  if (uplandRain >= RAIN_VERY_HEAVY) {
    level += 1;
    drivers.push(`${rainLabel} ${Math.round(uplandRain)} mm/24h (หนักมาก)`);
  } else if (uplandRain >= RAIN_HEAVY && level < 2) {
    level = 2;
    drivers.push(`${rainLabel} ${Math.round(uplandRain)} mm/24h (หนัก)`);
  }

  if (precip?.intensity === "heavy" && risingCount >= 1) {
    level += 1;
    drivers.push("heavy rain now + gauges rising");
  } else if (risingCount >= 3) {
    level = Math.max(level, 2);
    drivers.push(`${risingCount} gauges rising`);
  }

  // 3. Upland flash-flood signal (DWR EWS) — the leading indicator for Khao
  //    Luang runoff. An official upland alert escalates regardless of city
  //    river state, because the water has not arrived downtown yet.
  const worstEwsStatus = ews.reduce<0 | 1 | 2 | 3>((m, s) => (s.status > m ? s.status : m), 0);
  if (worstEwsStatus > 0) {
    level = Math.max(level, EWS_STATUS_TO_LEVEL[worstEwsStatus]);
    if (worstEwsStatus >= 2) drivers.push(`upland EWS ${worstEwsStatus === 3 ? "วิกฤติ" : "เตรียมพร้อม"}`);
  }

  // Saturated soil + heavy recent rain on a headwater slope = flash-flood primed.
  const primedCount = ews.filter(
    (s) => (s.soilMoisture ?? 0) >= SOIL_PRIMED && (s.rain12h ?? 0) >= RAIN_HEAVY,
  ).length;
  if (primedCount >= 1) {
    level = Math.max(level, 3);
    drivers.push(`${primedCount} upland slope${primedCount > 1 ? "s" : ""} flash-flood primed`);
  }
  const soils = ews.map((s) => s.soilMoisture).filter((v): v is number => v != null);
  const maxSoil = soils.length ? Math.max(...soils) : null;

  // 4. Widespread overbank → emergency (precautionary; ties break upward).
  if (overbankCount >= 3) {
    level = 5;
    drivers.push(`${overbankCount} stations overbank`);
  }

  const clamped = Math.min(5, Math.max(1, level)) as Level;
  if (!drivers.length) drivers.push("all stations within banks");
  return {
    level: clamped,
    drivers,
    worstSit,
    overbankCount,
    risingCount,
    rain24hMax,
    uplandRain,
    worstEwsStatus,
    primedCount,
    maxSoil,
  };
}

export function leadSignal(precip: PrecipNowcast | null, risingCount: number): string {
  if (precip?.minutesToSignificant != null) {
    const m = precip.minutesToSignificant;
    return m <= 15 ? "rain imminent" : `rain in ~${m} min`;
  }
  if (risingCount > 0) return "levels rising — watch peak";
  return "no near-term rain signal";
}
