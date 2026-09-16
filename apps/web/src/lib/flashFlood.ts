/**
 * flashFlood.ts — NST-flavored Flash Flood Potential Index (FFPI).
 *
 * Mirrors the spirit of ONWR's public FFPI popup (สำนักงานทรัพยากรน้ำแห่งชาติ —
 * Office of National Water Resources) that surfaces top-at-risk sub-districts
 * based on a multi-factor score.
 *
 * Why we built our own rather than scraping the ONWR feed:
 *   1. ONWR's score is per-tambon across Thailand; we need an NST-only
 *      score we can wire into our own panels + map pins + chatbot.
 *   2. Per-station visibility — our existing rain telemetry + DWR EWS
 *      sensors carry every input ONWR uses (rain 1h, 24h, soil moisture,
 *      EWS official alert). No need to pull from upstream blindly.
 *   3. We can tune the bands to match our 5-level Status vocabulary
 *      (normal / watch / prepare / critical) instead of only matching
 *      TMD warning thresholds.
 *
 * Score (0–10), four bands:
 *   0–2   น้อย          normal  (--good)
 *   2–4   ปานกลาง       watch   (--warn)
 *   4–6   เตรียมพร้อม   prepare (--alert)
 *   6+    วิกฤติ         critical (--bad)
 *
 * Formula (each component capped to keep a single dimension from
 * dominating):
 *   rain24h band  : 0 / 0.5 / 1 / 2 / 3  (mm: 0 / 1-35 / 35-90 / 90-150 / 150+)
 *   rain1h rate   : 0 / 0.5 / 1.5 / 2.5  (mm/h: 0 / 1-15 / 15-35 / 35+)
 *   soil moisture : 0 / 1 / 2 / 3       (% : <50 / 50-70 / 70-85 / 85+)
 *   EWS official  : 0 / 1 / 2 / 3       (status: 0 / 1 / 2 / 3)
 *   ─── clamp ──> 0..10
 *
 * Each component's ceiling mirrors ONWR's documented "ไม่คิดค่าหนัก
 * เกินความจริง" — saturating instead of letting one spike dominate.
 */

import type { EwsStation, RainfallStation, WaterGauge } from "@nst/shared";
import type { StatusLevel } from "./status";

export type FfpiBand = "normal" | "watch" | "prepare" | "critical";

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
  normal: "var(--good)",
  watch: "var(--warn)",
  prepare: "var(--alert)",
  critical: "var(--bad)",
};

const BAND_LABEL_EN: Record<FfpiBand, string> = {
  normal: "Normal",
  watch: "Watch",
  prepare: "Prepare",
  critical: "Critical",
};

const BAND_LABEL_TH: Record<FfpiBand, string> = {
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
  return { score, band: bandFromScore(score), components: c };
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
    rain1hMm: s.rain ?? null,
    rain24hMm: s.rain07h ?? null, // DWR's rain07h is "since 07:00 today" — closest 24h proxy
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
  const base = opts.ews ? ewsStationToFfpi(opts.ews) : opts.rain ? rainStationToFfpi(opts.rain) : computeFfpi({ rain1hMm: 0, rain24hMm: 0, soilPct: 0, ewsStatus: 0 });
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
    const score = clamp(merged.rain24h + merged.rain1h + merged.soil + merged.ews + bonus, 0, 10);
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
  const rainByAmphoe = groupBy(opts.rain ?? [], (r) => normAmphoe(r.amphoe));
  const ewsByAmphoe = groupBy(opts.ews ?? [], (e) => normAmphoe(e.amphoe));
  const keys = new Set<string>([...rainByAmphoe.keys(), ...ewsByAmphoe.keys()]);
  const rows: FfpiRow[] = [];
  for (const key of keys) {
    const amphoe = key;
    const rains = rainByAmphoe.get(key) ?? [];
    const ewses = ewsByAmphoe.get(key) ?? [];
    // Pick the worst-case rain + ews in this amphoe (not just first).
    const worstRain = rains.reduce<{ r: RainfallStation; score: number } | null>((acc, r) => {
      const ffpi = rainStationToFfpi(r);
      if (!acc || ffpi.score > acc.score) return { r, score: ffpi.score };
      return acc;
    }, null);
    const worstEws = ewses.reduce<{ e: EwsStation; score: number } | null>((acc, e) => {
      const ffpi = ewsStationToFfpi(e);
      if (!acc || ffpi.score > acc.score) return { e, score: ffpi.score };
      return acc;
    }, null);
    // Sub-district: prefer tambon from EWS (richer metadata), else use
    // station id + amphoe.
    const ewsPrimary = worstEws?.e ?? null;
    const rainPrimary = worstRain?.r ?? null;
    const tambon = ewsPrimary?.tambon ?? rainPrimary?.name ?? "—";
    const rainList = rains.map((r) => r.rain24h ?? 0);
    const peak24 = rainList.length > 0 ? Math.max(...rainList) : null;
    const peak1h = rains.reduce<number | null>(
      (acc, r) => (acc == null ? r.rain1h ?? null : Math.max(acc, r.rain1h ?? 0)),
      null,
    );
    const gauges = opts.gaugesByAmphoe?.get(amphoe) ?? [];
    const fullness = gauges.reduce<number | null>(
      (acc, g) => {
        const v = g.fullnessPct;
        if (v == null) return acc;
        return acc == null ? v : Math.max(acc, v);
      },
      null,
    );
    const ffpi = mergedFfpi({
      rain: rainPrimary,
      ews: ewsPrimary,
      channelFullnessPct: fullness,
    });
    rows.push({
      id: ewsPrimary?.id ?? rainPrimary?.id ?? `${amphoe}/${tambon}`,
      amphoe,
      tambon,
      province: PROVINCE_TH,
      rain1hMm: peak1h,
      rain24hMm: peak24,
      soilPct: ewsPrimary?.soilMoisture ?? null,
      ewsStatus: ewsPrimary?.status ?? null,
      ewsName: ewsPrimary?.name ?? null,
      channelFullnessPct: fullness,
      ffpi,
      lat: ewsPrimary?.lat ?? rainPrimary?.lat ?? 0,
      lng: ewsPrimary?.lng ?? rainPrimary?.lng ?? 0,
    });
  }
  rows.sort((a, b) => {
    if (b.ffpi.score !== a.ffpi.score) return b.ffpi.score - a.ffpi.score;
    // Tiebreaker: EWS entry ranks higher than rain-only.
    if ((b.ewsStatus ?? -1) !== (a.ewsStatus ?? -1)) return (b.ewsStatus ?? -1) - (a.ewsStatus ?? -1);
    return a.amphoe.localeCompare(b.amphoe);
  });
  return rows.slice(0, limit);
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function groupBy<T, K extends string>(arr: T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const t of arr) {
    const k = key(t);
    let l = m.get(k);
    if (!l) { l = []; m.set(k, l); }
    l.push(t);
  }
  return m;
}

/** Normalize amphoe — sometimes EWS reports "เมือง", rain reports "Mueang";
 *  we lowercase + collapse whitespace so matching is deterministic. */
function normAmphoe(s: string | null | undefined): string {
  if (!s) return "";
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

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
  if (band === "critical") return "critical";
  if (band === "prepare") return "warning";
  if (band === "watch") return "watch";
  return "normal";
}
