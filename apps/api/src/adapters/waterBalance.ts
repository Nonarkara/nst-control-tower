/**
 * Basin water-balance ledger — the "can the system absorb what's coming"
 * answer, per basin, as a first-order mass balance:
 *
 *   inflow  Vin  = rain (observed 24h + forecast) × catchment area × runoff C
 *   outflow Vout = outlet channel qmax × horizon × tide-gating factor
 *   storage Vres = Σ reservoir free volume (capacity − stored)
 *   stress       = Vin / (Vout + Vres)     → >1 means water must pond somewhere
 *
 * MODELLED, not a hydraulic simulation: no routing, no backwater, no drainage
 * network. Every constant carries provenance; every shortcut lands in
 * `assumptions[]` which the UI must render. Verdict language never exceeds
 * official HII situation levels — the model *explains*, officials *warn*.
 *
 * Inputs (all live, all already adapted):
 *   - HII ThaiWater gauges  — level, bank, fullness %, live discharge, qmax
 *   - HII ThaiWater rain    — 24 h observed, per amphoe
 *   - HII WRF-ROMS grids    — 3-day forecast rain, windowed per basin
 *   - RID reservoirs        — capacity + current storage
 *   - DWR EWS               — soil moisture (antecedent wetness → runoff C)
 *   - Open-Meteo Marine     — hourly sea level at Pak Nakhon (tide gating)
 */

import type {
  BasinGaugeSnapshot,
  BasinHorizonLedger,
  BasinId,
  BasinReservoirHeadroom,
  BasinStressBand,
  BasinWaterBalance,
  BasinWetness,
  NormalizedFeed,
  WaterGauge,
} from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { riseRatePerHour } from "../lib/gaugeHistory.js";
import { fetchJsonOrThrow } from "./common.js";
import { fetchEwsStations } from "./dwrEws.js";
import { fetchRidReservoirs } from "./rid.js";
import { fetchRainfall, fetchWaterGauges } from "./thaiwater.js";
import { fetchWrfWindows, windowStats } from "./wrfRain.js";

const TTL_SECONDS = 10 * 60; // gauge cadence
const STALE_TTL_SECONDS = 6 * 3600;
const SOURCE = "water-balance";

// ── Basin configuration ─────────────────────────────────────────────────────
// Areas are geometric estimates (ridge-to-gauge bounding polygons) pending
// official RID sub-basin polygons — treated as ±40 % and therefore only ever
// used inside lo/hi ranges. Sanity anchor for city_tha_dee: 200 km² × C 0.45 ×
// ~2.4 m/yr rain ≈ 6.8 m³/s mean discharge, which reproduces the observed
// GloFAS baseline (6–8 m³/s) this repo already calibrated
// NST_CANAL_GLOFAS_THRESHOLDS against — see adapters/flood.ts.
interface BasinConfig {
  basinId: BasinId;
  nameTh: string;
  nameEn: string;
  areaKm2: number;
  areaProvenance: string;
  /** Base runoff-coefficient range before wetness adjustment (rational-method tables). */
  cLo: number;
  cHi: number;
  /** Substrings matched against gauge/rain/EWS amphoe names (en or th, lowercased). */
  amphoeKeys: string[];
  /** ThaiWater station oldcodes belonging to this basin. */
  gaugeCodes: string[];
  /** Station whose qmax is the outlet bottleneck; null = capacity unpublished. */
  chokeCode: string | null;
  /** Fallback qmax (m³/s) from the 2026-07-13 live probe, if the feed drops the field. */
  chokeQmaxFallback: number | null;
  /** RID reservoir ids that genuinely buffer THIS basin (see rid.ts header). */
  reservoirIds: string[];
  /** Outlet drains through a tide-gated estuary. */
  tidal: boolean;
  /** WRF-ROMS analysis window for forecast rain (WGS84 box). */
  wrfBox: { lngMin: number; lngMax: number; latMin: number; latMax: number };
}

export const BASINS: BasinConfig[] = [
  {
    basinId: "city_tha_dee",
    nameTh: "คลองท่าดี — เขาหลวง → ตัวเมือง",
    nameEn: "Tha Dee — Khao Luang → city",
    // Ridge (~99.72°E) to city gauge X.203 (~99.92°E) × Lan Saka valley width.
    areaKm2: 200,
    areaProvenance:
      "geometric ridge-to-gauge estimate ±40%; cross-checked against the GloFAS baseline 6–8 m³/s (flood.ts)",
    cLo: 0.3,
    cHi: 0.55, // steep forested mountain front
    amphoeKeys: ["lan saka", "mueang nakhon", "ลานสกา", "เมืองนครศรี"],
    gaugeCodes: ["MOU494", "MOU493", "X.200", "X.203", "TADE01", "PTTEP3"],
    chokeCode: "X.203",
    chokeQmaxFallback: 42.1,
    reservoirIds: [], // honest: no dam regulates the Tha Dee
    tidal: true,
    wrfBox: { lngMin: 99.65, lngMax: 99.95, latMin: 8.25, latMax: 8.55 },
  },
  {
    basinId: "pak_phanang",
    nameTh: "ลุ่มน้ำปากพนัง — ชะอวด/เชียรใหญ่",
    nameEn: "Pak Phanang basin — Cha-uat/Chian Yai",
    // RID Pak Phanang royal-project basin, commonly cited ~2,900–3,200 km².
    areaKm2: 3000,
    areaProvenance: "RID Pak Phanang basin literature (~2,900–3,200 km²) ±10%",
    cLo: 0.15,
    cHi: 0.4, // lowland paddy + gentle hills
    amphoeKeys: [
      "cha-uat", "chian yai", "pak phanang", "hua sai", "chulabhorn", "ron phibun",
      "ชะอวด", "เชียรใหญ่", "ปากพนัง", "หัวไทร", "จุฬาภรณ์", "ร่อนพิบูลย์",
    ],
    gaugeCodes: ["CHAU01", "NKO002", "FOP035", "FOP036", "FOP037", "X.289", "X.167"],
    chokeCode: null, // Uthokvibhajaprasid gate discharge is not machine-published
    chokeQmaxFallback: null,
    reservoirIds: ["rsv434"], // Huai Nam Sai, 86 MCM, basin headwaters
    tidal: true,
    wrfBox: { lngMin: 99.75, lngMax: 100.3, latMin: 7.85, latMax: 8.4 },
  },
  {
    basinId: "klai_north",
    nameTh: "คลองกลาย — นบพิตำ/ท่าศาลา",
    nameEn: "Khlong Klai — Nopphitam/Tha Sala",
    areaKm2: 500,
    areaProvenance: "geometric estimate of the Khlong Klai highlands ±40%",
    cLo: 0.3,
    cHi: 0.55,
    amphoeKeys: ["nopphitam", "tha sala", "sichon", "นบพิตำ", "ท่าศาลา", "สิชล"],
    gaugeCodes: ["X.149", "NPI001"],
    chokeCode: "X.149",
    chokeQmaxFallback: 1932,
    reservoirIds: [],
    tidal: true,
    wrfBox: { lngMin: 99.55, lngMax: 100.0, latMin: 8.55, latMax: 9.0 },
  },
  {
    basinId: "northwest_tapi",
    nameTh: "ต้นน้ำตาปี — ฉวาง/พิปูน",
    nameEn: "Upper Tapi — Chawang/Phipun",
    areaKm2: 600,
    areaProvenance: "geometric estimate of the Chawang–Phipun valleys ±40%",
    cLo: 0.25,
    cHi: 0.5,
    amphoeKeys: [
      "chawang", "phipun", "tham phannara", "thung yai", "chang klang",
      "ฉวาง", "พิปูน", "ถ้ำพรรณรา", "ทุ่งใหญ่", "ช้างกลาง",
    ],
    gaugeCodes: ["X.176", "X.243", "NKO003", "NKO004"],
    chokeCode: "X.176",
    chokeQmaxFallback: 212,
    reservoirIds: ["rsv435", "rsv437", "rsv436"], // Katun 70.5 + Din Daeng 60 + Samet Chuan 1.7
    tidal: false,
    wrfBox: { lngMin: 99.3, lngMax: 99.75, latMin: 8.25, latMax: 8.75 },
  },
];

// Stress bands on the lo/hi midpoint; hi alone reaching 0.7 already means
// "tight" because the ledger's job is early warning, not reassurance.
const STRESS_TIGHT = 0.7;
const STRESS_OVERFLOW = 1.0;

// City ponding geometry for suggestedScenarioM — HII 2025 street survey
// (lib/floodScenario.ts): median road 1.49 m MSL; municipality ~22.6 km²
// (packages/shared campus.ts).
const CITY_SINK_KM2 = 22.6;
const CITY_ROAD_MEDIAN_MSL = 1.49;
const SCENARIO_CLAMP: [number, number] = [0.8, 3.0];

// A gauge must rise at least this fast (m/h) before we quote an overtop ETA.
const MIN_RISE_M_PER_H = 0.02;

// ── Tide gating (Open-Meteo Marine, keyless) ────────────────────────────────
// Gravity drainage through the Pak Nakhon / Pak Phanang estuaries works when
// the sea is below its median; factor spans 0.5 (always-high sea) → 1.0.
const MARINE_URL =
  "https://marine-api.open-meteo.com/v1/marine?latitude=8.45&longitude=100.2&hourly=sea_level_height_msl&forecast_days=2&timezone=Asia%2FBangkok";

interface MarineResp {
  hourly?: { time?: string[]; sea_level_height_msl?: (number | null)[] };
}

export function tideFactorFromLevels(levels: number[]): number | null {
  const clean = levels.filter((v) => Number.isFinite(v));
  if (clean.length < 12) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const next24 = clean.slice(0, 24);
  const ebb = next24.filter((v) => v < median).length / next24.length;
  return Math.round((0.5 + 0.5 * ebb) * 100) / 100;
}

async function fetchTideFactor(): Promise<number | null> {
  try {
    const resp = await fetchJsonOrThrow<MarineResp>(MARINE_URL);
    const levels = (resp.hourly?.sea_level_height_msl ?? []).filter(
      (v): v is number => v != null,
    );
    return tideFactorFromLevels(levels);
  } catch {
    return null; // tide gating degrades to "no adjustment" + assumption note
  }
}

// ── Wetness → runoff-coefficient adjustment ─────────────────────────────────

export function wetnessFromSoil(soilPct: number | null): BasinWetness {
  if (soilPct == null) return "unknown";
  if (soilPct >= 85) return "saturated"; // SOIL_PRIMED precedent (lib/floodPosture.ts)
  if (soilPct >= 60) return "wet";
  if (soilPct >= 40) return "moist";
  return "dry";
}

/**
 * Fallback when no soil telemetry reports: treat the basin's 24 h rain as a
 * one-day antecedent-precipitation index (FloodDash wetness.js bands — api≥120
 * saturated, ≥70 wet, ≥30 moist). Cruder than real soil data, but during a
 * monsoon event "unknown" would silently under-model runoff, which is the
 * unsafe direction.
 */
export function wetnessFromRain24h(rainMm: number): BasinWetness {
  if (rainMm >= 120) return "saturated";
  if (rainMm >= 70) return "wet";
  if (rainMm >= 30) return "moist";
  return "dry";
}

/** Saturated ground converts more rain to runoff; dry ground absorbs some. */
export function adjustRunoffC(
  cLo: number,
  cHi: number,
  wetness: BasinWetness,
): { lo: number; hi: number } {
  const bump: Record<BasinWetness, [number, number]> = {
    saturated: [0.15, 0.2],
    wet: [0.08, 0.12],
    moist: [0.03, 0.05],
    dry: [-0.05, 0],
    unknown: [0, 0],
  };
  const [dLo, dHi] = bump[wetness];
  const clamp = (v: number) => Math.round(Math.max(0.05, Math.min(0.9, v)) * 100) / 100;
  return { lo: clamp(cLo + dLo), hi: clamp(cHi + dHi) };
}

// ── Core ledger math (exported for tests) ───────────────────────────────────

/** Rain (mm) over an area (km²) at coefficient C → runoff volume (m³). */
export function runoffVolumeM3(rainMm: number, areaKm2: number, c: number): number {
  return rainMm * 1000 * areaKm2 * c; // mm × km² → m³ is exactly ×1000
}

export function stressBand(lo: number | null, hi: number | null): BasinStressBand {
  if (lo == null || hi == null) return "unknown";
  const mid = (lo + hi) / 2;
  if (mid >= STRESS_OVERFLOW) return "overflow";
  if (hi >= STRESS_TIGHT) return "tight";
  return "ok";
}

/** Freeboard ÷ rise → hours to overtop; null when not meaningfully rising. */
export function etaOvertopHours(
  freeboardM: number | null,
  riseMPerH: number | null,
): number | null {
  if (freeboardM == null || riseMPerH == null) return null;
  if (freeboardM <= 0) return 0; // already overbank
  if (riseMPerH < MIN_RISE_M_PER_H) return null;
  return Math.round((freeboardM / riseMPerH) * 10) / 10;
}

function matchesAmphoe(amphoe: string, keys: string[]): boolean {
  const a = amphoe.toLowerCase();
  return keys.some((k) => a.includes(k));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

// ── Verdicts (factual-conditional; never exceeds official warnings) ─────────

function verdictFor(
  band: BasinStressBand,
  etaH: number | null,
  observedSituation: number,
): { th: string; en: string } {
  if (band === "overflow" || observedSituation >= 5) {
    const eta = etaH != null && etaH > 0 ? ` ~${Math.round(etaH)} ชม.` : "";
    return {
      th: `แบบจำลอง: น้ำเข้าเกินความสามารถระบาย${eta} — น้ำส่วนเกินจะท่วมพื้นที่ลุ่ม`,
      en: `Model: inflow exceeds drainage capacity${etaH != null && etaH > 0 ? ` in ~${Math.round(etaH)}h` : ""} — excess ponds in the lowland`,
    };
  }
  if (band === "tight" || observedSituation >= 4) {
    return {
      th: "ใกล้เต็มความจุระบบ — เฝ้าระวังใกล้ชิด ติดตามระดับทุกชั่วโมง",
      en: "Near system capacity — monitor hourly",
    };
  }
  if (band === "unknown") {
    return {
      th: "ประเมินอัตราส่วนไม่ได้ (ไม่มีข้อมูลความจุทางออก) — ดูระดับตลิ่งจริงประกอบ",
      en: "Stress ratio unavailable (outlet capacity unpublished) — read live bank levels instead",
    };
  }
  return {
    th: "ระบบรับได้ตามแบบจำลอง",
    en: "System absorbs the load per the model",
  };
}

// ── The adapter ─────────────────────────────────────────────────────────────

export async function fetchWaterBalance(): Promise<NormalizedFeed<BasinWaterBalance>> {
  try {
    return await cached(
      "water-balance",
      TTL_SECONDS,
      computeWaterBalance,
      STALE_TTL_SECONDS,
      true,
    );
  } catch {
    return {
      features: [],
      meta: {
        source: SOURCE,
        fetchedAt: new Date().toISOString(),
        ageMinutes: 0,
        fallbackTier: "unavailable",
        note: "water-balance inputs unreachable (ThaiWater/RID/HII) — retries automatically",
      },
    };
  }
}

async function computeWaterBalance(): Promise<NormalizedFeed<BasinWaterBalance>> {
  const fetchedAt = new Date().toISOString();

  // Pull every input concurrently; each inner feed degrades gracefully on its
  // own, so a single upstream outage narrows the ledger instead of killing it.
  const [gaugesFeed, rainFeed, ridFeed, ewsFeed, wrf, tideFactor] = await Promise.all([
    fetchWaterGauges(),
    fetchRainfall(),
    fetchRidReservoirs(),
    fetchEwsStations(),
    fetchWrfWindows(),
    fetchTideFactor(),
  ]);

  const gauges = gaugesFeed.features;
  const rain = rainFeed.features;
  const reservoirs = ridFeed.features;
  const ews = ewsFeed.features;

  if (gauges.length === 0 && rain.length === 0) {
    // Nothing observed to balance — let cachedWithStale keep the last good
    // ledger instead of caching an empty one for a whole TTL.
    throw new Error("no ThaiWater telemetry available");
  }

  const features = BASINS.map((cfg) =>
    buildBasinLedger(cfg, { gauges, rain, reservoirs, ews, wrf, tideFactor }),
  );

  const liveInputs = [gaugesFeed, rainFeed, ridFeed].filter(
    (f) => f.meta.fallbackTier === "live",
  ).length;

  return {
    features,
    meta: {
      source: SOURCE,
      fetchedAt,
      ageMinutes: cacheAgeMinutes(fetchedAt),
      // The ledger itself is a model even when every input is live.
      fallbackTier: "scenario",
      note: `first-order mass balance over ${liveInputs}/3 live input feeds${
        wrf ? ` · WRF run ${wrf.runId}` : " · WRF forecast unavailable"
      }`,
    },
  };
}

interface LedgerInputs {
  gauges: WaterGauge[];
  rain: { rain24h: number | null; amphoe: string }[];
  reservoirs: { id: string; name: string; storageMcm: number | null; volumeMcm: number | null }[];
  ews: { soilMoisture: number | null; amphoe: string }[];
  wrf: Awaited<ReturnType<typeof fetchWrfWindows>>;
  tideFactor: number | null;
}

function buildBasinLedger(cfg: BasinConfig, inputs: LedgerInputs): BasinWaterBalance {
  const assumptions: string[] = [
    `catchment ${cfg.areaKm2} km² — ${cfg.areaProvenance}`,
    "bathtub-style first-order balance: no routing, no drainage-network dynamics",
  ];

  // ── Gauges in this basin ──
  const codes = new Set(cfg.gaugeCodes);
  const basinGauges = inputs.gauges.filter(
    (g) => (g.stationCode != null && codes.has(g.stationCode)) || matchesAmphoe(g.amphoe, cfg.amphoeKeys),
  );

  const gaugeSnapshots: BasinGaugeSnapshot[] = basinGauges.map((g) => {
    const freeboard =
      g.bankMsl != null && g.levelMsl != null
        ? Math.round((g.bankMsl - g.levelMsl) * 100) / 100
        : null;
    const rise = riseRatePerHour(g.stationCode ?? g.id);
    return {
      id: g.id,
      code: g.stationCode,
      name: g.name,
      levelMsl: g.levelMsl,
      bankMsl: g.bankMsl,
      freeboardM: freeboard,
      fullnessPct: g.fullnessPct,
      dischargeCms: g.dischargeCms,
      qmaxCms: g.qmaxCms,
      situationLevel: g.situationLevel,
      riseMPerH: rise != null ? Math.round(rise * 1000) / 1000 : null,
      etaOvertopH: etaOvertopHours(freeboard, rise),
    };
  });

  // ── Observed + forecast rain ──
  const rain24 = inputs.rain
    .filter((r) => matchesAmphoe(r.amphoe, cfg.amphoeKeys))
    .map((r) => r.rain24h)
    .filter((v): v is number => v != null);
  const rainObservedMm = mean(rain24) ?? 0;
  if (rain24.length === 0) assumptions.push("no rain telemetry matched this basin — observed rain counted as 0");

  const wrfDays = [1, 2, 3].map((d) => {
    const w = inputs.wrf?.days[d - 1];
    return w ? windowStats(w, cfg.wrfBox).meanMm : null;
  });
  if (inputs.wrf == null) assumptions.push("WRF-ROMS forecast unavailable — forecast rain counted as 0");

  // ── Wetness → runoff C ──
  const soil = mean(
    inputs.ews
      .filter((e) => matchesAmphoe(e.amphoe, cfg.amphoeKeys))
      .map((e) => e.soilMoisture)
      .filter((v): v is number => v != null),
  );
  let wetness = wetnessFromSoil(soil);
  if (wetness === "unknown") {
    wetness = wetnessFromRain24h(rainObservedMm);
    assumptions.push("no soil telemetry — ground wetness inferred from 24 h rain");
  }
  const c = adjustRunoffC(cfg.cLo, cfg.cHi, wetness);
  assumptions.push(
    `runoff C ${c.lo.toFixed(2)}–${c.hi.toFixed(2)} (base ${cfg.cLo}–${cfg.cHi}, ground ${wetness})`,
  );

  // ── Outlet conveyance ──
  const choke = cfg.chokeCode
    ? basinGauges.find((g) => g.stationCode === cfg.chokeCode)
    : undefined;
  const qmax = choke?.qmaxCms ?? cfg.chokeQmaxFallback;
  const tideFactor = cfg.tidal ? inputs.tideFactor : null;
  if (cfg.tidal && inputs.tideFactor == null) {
    assumptions.push("tide data unavailable — drainage not derated for high tide");
  } else if (cfg.tidal && tideFactor != null) {
    assumptions.push(`tide gating ×${tideFactor} (share of next 24 h below median sea level)`);
  }
  if (qmax == null) {
    assumptions.push("outlet capacity unpublished — stress ratio unavailable; read live bank levels");
  }

  // ── Reservoir headroom ──
  const basinReservoirs: BasinReservoirHeadroom[] = cfg.reservoirIds.map((id) => {
    const r = inputs.reservoirs.find((x) => x.id === id);
    const capacity = r?.storageMcm ?? null; // RID "storage" = full capacity
    const stored = r?.volumeMcm ?? null;
    const headroom =
      capacity != null && stored != null
        ? Math.max(0, Math.round((capacity - stored) * 10) / 10)
        : null;
    return { id, name: r?.name ?? id, capacityMcm: capacity, storedMcm: stored, headroomMcm: headroom };
  });
  const knownHeadroomM3 = basinReservoirs.reduce(
    (s, r) => s + (r.headroomMcm ?? 0) * 1e6,
    0,
  );
  if (basinReservoirs.some((r) => r.headroomMcm == null)) {
    assumptions.push("reservoir storage unreported today — unknown headroom counted as 0 (safe side)");
  }

  // ── Per-horizon ledger ──
  const horizons: BasinHorizonLedger[] = ([24, 48, 72] as const).map((h) => {
    const daysIn = h / 24;
    const forecastMm = wrfDays
      .slice(0, daysIn)
      .reduce<number>((s, v) => s + (v ?? 0), 0);
    // Observed 24 h rain has already fallen and is still in transit through
    // the basin — it belongs in every horizon's inflow, once.
    const totalRainLo = rainObservedMm + forecastMm;
    const inflowLo = runoffVolumeM3(totalRainLo, cfg.areaKm2, c.lo);
    const inflowHi = runoffVolumeM3(totalRainLo, cfg.areaKm2, c.hi);
    const conveyance =
      qmax != null ? qmax * (tideFactor ?? 1) * h * 3600 : null;
    const denom = conveyance != null ? conveyance + knownHeadroomM3 : null;
    const stressLo = denom != null && denom > 0 ? Math.round((inflowLo / denom) * 100) / 100 : null;
    const stressHi = denom != null && denom > 0 ? Math.round((inflowHi / denom) * 100) / 100 : null;
    return {
      horizonH: h,
      rainObservedMm: Math.round(rainObservedMm * 10) / 10,
      rainForecastMm: Math.round(forecastMm * 10) / 10,
      inflowM3Lo: Math.round(inflowLo),
      inflowM3Hi: Math.round(inflowHi),
      conveyanceM3: conveyance != null ? Math.round(conveyance) : null,
      reservoirHeadroomM3: Math.round(knownHeadroomM3),
      stressLo,
      stressHi,
      band: stressBand(stressLo, stressHi),
    };
  });

  // ── Roll-ups ──
  const chokeUtil =
    choke?.dischargeCms != null && qmax != null && qmax > 0
      ? Math.round((choke.dischargeCms / qmax) * 100)
      : null;
  const etas = gaugeSnapshots
    .map((g) => g.etaOvertopH)
    .filter((v): v is number => v != null);
  const worstEta = etas.length > 0 ? Math.min(...etas) : null;
  const worstSituation = Math.max(3, ...gaugeSnapshots.map((g) => g.situationLevel));

  // City-only ponding suggestion from the 24 h high-estimate overflow.
  let suggestedScenarioM: number | null = null;
  if (cfg.basinId === "city_tha_dee") {
    const h24 = horizons[0];
    if (h24.conveyanceM3 != null) {
      const overflow = h24.inflowM3Hi - (h24.conveyanceM3 + h24.reservoirHeadroomM3);
      if (overflow > 0) {
        const depth = overflow / (CITY_SINK_KM2 * 1e6);
        const level = CITY_ROAD_MEDIAN_MSL + depth;
        suggestedScenarioM =
          Math.round(Math.min(SCENARIO_CLAMP[1], Math.max(SCENARIO_CLAMP[0], level)) * 20) / 20;
        assumptions.push(
          `ponding level spreads the 24 h high-estimate excess over ${CITY_SINK_KM2} km² of city (HII street survey datum)`,
        );
      }
    }
  }

  const band24 = horizons[0].band;
  const verdict = verdictFor(band24, worstEta, worstSituation);

  return {
    basinId: cfg.basinId,
    nameTh: cfg.nameTh,
    nameEn: cfg.nameEn,
    areaKm2: cfg.areaKm2,
    areaProvenance: cfg.areaProvenance,
    runoffCLo: c.lo,
    runoffCHi: c.hi,
    wetness,
    soilMoisturePct: soil != null ? Math.round(soil) : null,
    tidal: cfg.tidal,
    tideFactor,
    horizons,
    gauges: gaugeSnapshots,
    chokeStationCode: cfg.chokeCode,
    chokeUtilizationPct: chokeUtil,
    worstEtaOvertopH: worstEta,
    suggestedScenarioM,
    hasReservoir: cfg.reservoirIds.length > 0,
    reservoirs: basinReservoirs,
    verdictTh: verdict.th,
    verdictEn: verdict.en,
    assumptions,
  };
}
