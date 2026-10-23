import { isCurrentObservation, type EwsStation } from "@nst/shared";
import { SOIL_PRIMED } from "./sensorInsights";

/**
 * The official DWR layer, read for the mayor's briefing.
 *
 * The DWR Early Warning System is the only source in this product that
 * carries the authority's own judgement: a 0–3 alert tier and a per-station
 * alert level in metres. Until 23 Oct 2026 it reached the map lens but never
 * the briefing, so a DWR alert in force would have been invisible on the one
 * page the mayor reads. It is a different question from anything else on that
 * page, not a second copy of it: the HII gauges answer "how far to the bank
 * at a river gauge", and DWR answers "has the authority raised the level
 * here, and how close is the water to its own threshold".
 *
 * Two upstream conventions, measured 2026-10-23 against the live endpoint
 * (2,275 stations nationwide, 86 in NST):
 *
 *  • `stn_type` arrives in lower case ("wl"), and once as "RF " with a
 *    trailing space. The adapter folds case and trims, so a water-level
 *    station is actually typed "water" — before that, NST had 61 "rain",
 *    25 "unknown" and zero "water" stations.
 *  • `alert_max` is 0 for a station with no threshold set, and `alert_min` is
 *    the constant 55 on every water-level station (455 of 455). Neither is a
 *    per-station threshold, so the adapter carries only `alertMax`, and only
 *    when it is a real level.
 */

export type EwsTier = 0 | 1 | 2 | 3;

/** The authority's own tier names, in its own order. */
export const EWS_TIER_TH: Record<EwsTier, string> = {
  0: "ปกติ",
  1: "เฝ้าระวัง",
  2: "เตรียมพร้อม",
  3: "วิกฤติ",
};

export const EWS_TIER_EN: Record<EwsTier, string> = {
  0: "normal",
  1: "watch",
  2: "prepare",
  3: "critical",
};

export interface EwsAlertState {
  /** Stations the feed actually reported. Zero means the source could not be read. */
  checked: number;
  /** Stations the authority has raised above normal, highest tier first. */
  alerting: EwsStation[];
  maxTier: EwsTier;
}

/**
 * The official alert state of the province.
 *
 * `checked === 0` is not "no alert" — it is "the source could not be read",
 * and the two must never be printed the same way.
 */
export function ewsAlertState(stations: readonly EwsStation[] | undefined | null): EwsAlertState {
  const list = stations ?? [];
  const alerting = list.filter(s => s.status >= 1).sort((a, b) => b.status - a.status);
  return { checked: list.length, alerting, maxTier: (alerting[0]?.status ?? 0) as EwsTier };
}

/**
 * One line for the briefing: what the authority has declared.
 *
 * "Checked N stations, nothing declared" and "could not ask the authority" are
 * different sentences with different consequences, and printing one as the
 * other is how a control room ends up treating silence as safety.
 */
export function ewsStatusLine(
  state: EwsAlertState,
  options: { fromSnapshot?: boolean } = {},
): string {
  if (state.checked === 0) {
    return "ยังยืนยันสถานะเตือน อต. ไม่ได้ — แหล่งข้อมูลไม่ตอบ (ไม่ใช่การไม่มีประกาศ)";
  }
  const snapshot = options.fromSnapshot ? " · จากสแนปช็อตล่าสุด ไม่ใช่ข้อมูลสด" : "";
  if (state.maxTier >= 1) {
    return `อต. ประกาศเตือน ${state.alerting.length} สถานี — ระดับ${EWS_TIER_TH[state.maxTier]}${snapshot}`;
  }
  return `ไม่มีประกาศเตือนจาก อต. ขณะนี้ (ตรวจ ${state.checked} สถานี${snapshot})`;
}

/** The same statement in English, for the English summary. */
export function ewsStatusLineEn(
  state: EwsAlertState,
  options: { fromSnapshot?: boolean } = {},
): string {
  if (state.checked === 0) {
    return "DWR warning state cannot be confirmed — the source did not answer (this is not the same as no warning being in force)";
  }
  const snapshot = options.fromSnapshot ? ", from the last-good snapshot rather than live" : "";
  if (state.maxTier >= 1) {
    return `DWR has declared an alert on ${state.alerting.length} station(s) — tier ${EWS_TIER_EN[state.maxTier]}${snapshot}`;
  }
  return `No DWR alert in force — ${state.checked} stations checked${snapshot}`;
}

export interface EwsWaterRow {
  station: EwsStation;
  /** The station's own level, in metres. */
  level: number;
  /** DWR's own alert level for this station, in metres. */
  alertLevel: number;
  /** Metres of rise left before DWR's alert level. Negative = at or above it. */
  margin: number;
  /** The observation sits inside the product's own current-observation window. */
  current: boolean;
  ageMinutes: number;
}

/**
 * The DWR water-level stations, measured against DWR's own alert level.
 *
 * Current stations come first: this table answers "how close is the water to
 * the alert level now", and a 25-day-old reading must not lead it. Stale rows
 * stay in the table, marked with their age — a station that stopped reporting
 * is a hole in the evidence, not a quiet station, and hiding it would make
 * the gap look like calm.
 */
export function ewsWaterRows(
  stations: readonly EwsStation[] | undefined | null,
  now: number,
): EwsWaterRow[] {
  return (stations ?? [])
    .filter(s => s.type === "water" && s.alertMax != null && s.waterLevel != null)
    .map(s => {
      const level = s.waterLevel as number;
      const alertLevel = s.alertMax as number;
      const parsed = Date.parse(s.observedAt);
      return {
        station: s,
        level,
        alertLevel,
        margin: Math.round((alertLevel - level) * 100) / 100,
        current: !s.stale && isCurrentObservation(s.observedAt, now),
        ageMinutes: Number.isFinite(parsed) ? Math.max(0, Math.floor((now - parsed) / 60_000)) : NaN,
      };
    })
    .sort((a, b) => {
      if (a.current !== b.current) return a.current ? -1 : 1;
      return a.margin - b.margin;
    });
}

export interface EwsSoilState {
  /** Stations that report soil moisture at all. */
  measured: number;
  /** Stations at or above the product's soil-primed line. */
  primed: number;
  /** The wettest measured stations, wettest first. */
  wettest: EwsStation[];
}

/**
 * Measured soil moisture from the DWR stations — the real measurement, not a
 * proxy. The briefing already asks "how much rain has the ground absorbed"
 * and answers it with FloodDash's wetness index, which the page itself
 * labels as not a measured soil value; this is the measured one.
 */
export function ewsSoilState(
  stations: readonly EwsStation[] | undefined | null,
  limit = 3,
): EwsSoilState {
  const measured = (stations ?? []).filter(
    s => s.soilMoisture != null && Number.isFinite(s.soilMoisture),
  );
  const wettest = [...measured]
    .sort((a, b) => (b.soilMoisture as number) - (a.soilMoisture as number))
    .slice(0, limit);
  return {
    measured: measured.length,
    primed: measured.filter(s => (s.soilMoisture as number) >= SOIL_PRIMED).length,
    wettest,
  };
}

export { SOIL_PRIMED };
