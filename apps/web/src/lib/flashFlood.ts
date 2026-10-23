/** Experimental station screening score. Not ONWR FFPI, a calibrated flood
 * probability, or an evacuation instruction. DWR alerts always take precedence.
 */
import type { EwsStation, RainfallStation, WaterGauge } from "@nst/shared";
import type { StatusLevel } from "./status";

export type FfpiBand = "unknown" | "normal" | "watch" | "prepare" | "critical";

export interface FfpiScore {
  score: number; // 0–10 (clamped)
  band: FfpiBand;
  /** Component contributions, exposed for diagnostics. */
  components: {
    rain24h: number;
    rain1h: number;
    soil: number;
    ews: number;
  };
}

const STATUS_VAR: Record<FfpiBand, string> = {
  unknown: "var(--muted)",
  normal: "var(--good)",
  watch: "var(--warn)",
  prepare: "var(--alert)",
  critical: "var(--bad)",
};

const BAND_LABEL_EN: Record<FfpiBand, string> = {
  unknown: "Unknown",
  normal: "Normal",
  watch: "Watch",
  prepare: "Prepare",
  critical: "Critical",
};

const BAND_LABEL_TH: Record<FfpiBand, string> = {
  unknown: "ไม่ทราบ",
  normal: "น้อย",
  watch: "ปานกลาง",
  prepare: "เตรียมพร้อม",
  critical: "วิกฤติ",
};

function rain24Component(mm: number | null | undefined): number {
  if (mm == null || !Number.isFinite(mm) || mm <= 0) return 0;
  if (mm < 1) return 0;
  if (mm < 35) return 0.5;
  if (mm < 90) return 1;
  if (mm < 150) return 2;
  return 3;
}

function rain1hComponent(mmPerHour: number | null | undefined): number {
  if (mmPerHour == null || !Number.isFinite(mmPerHour) || mmPerHour <= 0) return 0;
  if (mmPerHour < 1) return 0;
  if (mmPerHour < 15) return 0.5;
  if (mmPerHour < 35) return 1.5;
  return 2.5;
}

function soilComponent(pct: number | null | undefined): number {
  if (pct == null || !Number.isFinite(pct) || pct <= 0) return 0;
  if (pct < 50) return 0;
  if (pct < 70) return 1;
  if (pct < 85) return 2;
  return 3;
}

function ewsComponent(status: number | null | undefined): number {
  if (status == null || !Number.isFinite(status)) return 0;
  if (status <= 0) return 0;
  if (status === 1) return 1;
  if (status === 2) return 2;
  return 3;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function bandFromScore(score: number): FfpiBand {
  if (score >= 6) return "critical";
  if (score >= 4) return "prepare";
  if (score >= 2) return "watch";
  return "normal";
}

/** Pure FFPI from raw readings — the canonical computation used by
 *  every other entry point. Returns `{ score, band, components }`. */
export function computeFfpi(input: {
  rain1hMm: number | null;
  rain24hMm: number | null;
  soilPct: number | null;
  ewsStatus: number | null;
}): FfpiScore {
  const c = {
    rain24h: rain24Component(input.rain24hMm),
    rain1h: rain1hComponent(input.rain1hMm),
    soil: soilComponent(input.soilPct),
    ews: ewsComponent(input.ewsStatus),
  };
  const score = clamp(c.rain24h + c.rain1h + c.soil + c.ews, 0, 10);
  const observed = Object.values(input).some(v => v != null && Number.isFinite(v) && v >= 0);
  const officialFloor = input.ewsStatus === 3 ? 6 : input.ewsStatus === 2 ? 4 : input.ewsStatus === 1 ? 2 : 0;
  const effective = Math.max(score, officialFloor);
  return { score: effective, band: observed ? bandFromScore(effective) : "unknown", components: c };
}

// ─── Station-level FFPI ────────────────────────────────────────────────────

/** Map a rain telemetry station to an FFPI input. EWS status isn't known
 *  here so the soil/ews components stay at 0 — combine via merging with
 *  EWS data on the map for richer scores when EWS exists in tambon. */
export function rainStationToFfpi(s: RainfallStation): FfpiScore {
  return computeFfpi({
    rain1hMm: s.rain1h,
    rain24hMm: s.rain24h,
    soilPct: null,
    ewsStatus: null,
  });
}

/** Map a DWR EWS station to FFPI directly. Status 0-3 is the single
 *  most authoritative precursor signal we have — community sirens fire
 *  on these, so we trust the official call. */
export function ewsStationToFfpi(s: EwsStation): FfpiScore {
  return computeFfpi({
    rain1hMm: null, // DWR accumulation duration is unverified.
    rain24hMm: null, // Since 07:00 is not a rolling 24-hour accumulation.
    soilPct: s.soilMoisture ?? null,
    ewsStatus: s.status,
  });
}

// ─── Per-sub-district merge ────────────────────────────────────────────────

/** Merge rain telemetry + EWS readings for the same sub-district into a
 *  best-possible FFPI. Falls back to the rain-only score when EWS data is
 *  absent. Used to surface the per-tambon ranking the ONWR popup exposes. */
export function mergedFfpi(opts: {
  rain: RainfallStation | null | undefined;
  ews: EwsStation | null | undefined;
  /** Optional bonus from a nearby water gauge's fullness (0–1). Adds up
   *  to +1 to the composite when the channel is already at the bank. */
  channelFullnessPct?: number | null;
}): FfpiScore {
  const base = opts.ews ? ewsStationToFfpi(opts.ews) : opts.rain ? rainStationToFfpi(opts.rain) : computeFfpi({ rain1hMm: null, rain24hMm: null, soilPct: null, ewsStatus: null });
  // When both exist, take MAX of the two component-wise so we don't
  // double-count — EWS status is the worst-case saying.
  if (opts.ews && opts.rain) {
    const r = rainStationToFfpi(opts.rain);
    const e = ewsStationToFfpi(opts.ews);
    const merged = {
      rain24h: Math.max(r.components.rain24h, e.components.rain24h),
      rain1h: Math.max(r.components.rain1h, e.components.rain1h),
      soil: Math.max(r.components.soil, e.components.soil),
      ews: Math.max(r.components.ews, e.components.ews),
    };
    const bonus = opts.channelFullnessPct != null && opts.channelFullnessPct >= 95 ? 1 : 0;
    const score = Math.max(base.score, clamp(merged.rain24h + merged.rain1h + merged.soil + merged.ews + bonus, 0, 10));
    void base; // keep base live for the explicit take-max pattern above
    return { score, band: bandFromScore(score), components: merged };
  }
  // Pure rain or pure EWS — apply channel-fullness bonus if we have a
  // nearby water gauge reporting close to bank.
  const bonus = opts.channelFullnessPct != null && opts.channelFullnessPct >= 95 ? 1 : 0;
  if (bonus === 0) return base;
  const score = clamp(base.score + bonus, 0, 10);
  return { score, band: bandFromScore(score), components: base.components };
}

/** A station + tambon + scope. Used to build the table rows. */
export interface FfpiRow {
  observedAt: string;
  /** Stable id (rain id, ews id, or composite `${amphoe}/${tambon}`). */
  id: string;
  amphoe: string;
  tambon: string;
  province: string;
  rain1hMm: number | null;
  rain24hMm: number | null;
  soilPct: number | null;
  ewsStatus: number | null;
  ewsName: string | null;
  /** Nearest gauge's fullness (0–120). Optional. */
  channelFullnessPct: number | null;
  ffpi: FfpiScore;
  lat: number;
  lng: number;
}

const PROVINCE_TH = "นครศรีธรรมราช";

/** Build per-station rows ranked by FFPI desc. Sort key is `score` first
 *  (so critical floats to the top), then stations with EWS (which carry
 *  the official alert) come ahead of rain-only rows at the same score. */
export function rankFfpi(opts: {
  rain?: RainfallStation[];
  ews?: EwsStation[];
  /** Optional gauge snap: each gauge keyed by approximate amphoe so we
   *  can fold channel fullness into the FFPI of nearby stations. */
  gaugesByAmphoe?: Map<string, WaterGauge[]>;
  /** Hard cap on rows returned (default 50 = enough to populate ONWR-style
   *  paginated table). */
  limit?: number;
}): FfpiRow[] {
  const limit = opts.limit ?? 50;
  // One score per actual station. Administrative co-location does not prove
  // rainfall, soil and a channel share a catchment or represent one tambon.
  const rows: FfpiRow[] = [
    ...(opts.ews ?? []).map(e => ({
      observedAt: e.observedAt, id: `ews:${e.id}`, amphoe: e.amphoe, tambon: e.name,
      province: PROVINCE_TH, rain1hMm: null, rain24hMm: null,
      soilPct: e.soilMoisture, ewsStatus: e.status, ewsName: e.name,
      channelFullnessPct: null, ffpi: ewsStationToFfpi(e), lat: e.lat, lng: e.lng,
    })),
    ...(opts.rain ?? []).map(r => ({
      observedAt: r.observedAt, id: `rain:${r.id}`, amphoe: r.amphoe, tambon: r.name,
      province: PROVINCE_TH, rain1hMm: r.rain1h, rain24hMm: r.rain24h,
      soilPct: null, ewsStatus: null, ewsName: null,
      channelFullnessPct: null, ffpi: rainStationToFfpi(r), lat: r.lat, lng: r.lng,
    })),
  ];
  rows.sort((a, b) => (b.ewsStatus && b.ewsStatus > 0 ? b.ewsStatus : 0) - (a.ewsStatus && a.ewsStatus > 0 ? a.ewsStatus : 0) || b.ffpi.score - a.ffpi.score);
  return rows.slice(0, limit);
}

// ─── Helpers ──────────────────────────────────────────────────────────────

// ─── Re-exports for the UI layer ───────────────────────────────────────────

export const FFPI = {
  STATUS_VAR,
  BAND_LABEL_EN,
  BAND_LABEL_TH,
} as const;

export type StationStatus = StatusLevel;

/** Convert FFPI band to our app-wide StatusLevel vocabulary so it can
 *  be styled with the same tokens used elsewhere. */
export function ffpiBandToStatusLevel(band: FfpiBand): StatusLevel {
  if (band === "unknown") return "unknown";
  if (band === "critical") return "critical";
  if (band === "prepare") return "warning";
  if (band === "watch") return "watch";
  return "normal";
}
