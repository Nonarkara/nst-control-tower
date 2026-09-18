/**
 * evacPriority — "which villages do we call first, and who in them can't
 * move on their own?"
 *
 * Static inputs (scripts/buildEvacData.py → /data/evac/villages.json, all
 * from data.go.th): 437 flood-risk villages with coordinates, flood type
 * (flash / standing water), whether residents must leave when it floods,
 * registered population + households, and per-DISTRICT counts of bedridden
 * elderly, homebound elderly and registered people with disabilities.
 *
 * Live inputs: water gauges (same judgeGauge rule as the headline + real
 * time-to-overtop from the basin ledger), DWR flash-flood early-warning
 * stations, and rain gauges near each village.
 *
 * Honesty rules baked in:
 *  - vulnerable counts per village are ESTIMATES (district rate × village
 *    population); the UI says so. Names and addresses are not in any open
 *    dataset — they stay with the local health office / อสม.
 *  - a village is only "move now" on a live signal, never on seasonality alone.
 */

import type { BasinWaterBalance, EwsStation, RainfallStation, WaterGauge } from "@nst/shared";
import type { CctvCamera } from "../map/layers";
import { distanceM, judgeGauge } from "./levelWatch";

export type FloodType = "flash" | "standing" | "landslide";

export interface EvacVillage {
  code: string;
  village: string;
  moo: string;
  community: string | null;
  tambon: string;
  amphoe: string;
  lat: number;
  lng: number;
  floodTypes: FloodType[];
  mustEvacuate: boolean;
  impactTh?: string;
  returnYears?: number;
  riskMonths: number[];
  population: number | null;
  households: number | null;
  centre: { authority: string; trained: boolean } | null;
}

export interface EvacDistrict {
  bedridden: number | null;
  homebound: number | null;
  disabled: number | null;
  population?: number | null;
}

export interface EvacData {
  generatedAt: string;
  sources: Record<string, string>;
  years: { population: string; disabled: string; elderly: string };
  villages: EvacVillage[];
  districts: Record<string, EvacDistrict>;
}

/** move-now > get-ready > watch > calm. */
export type EvacTier = "move-now" | "get-ready" | "watch" | "calm";

export interface EvacSignal {
  /** 1 watch · 2 warning · 3 critical */
  severity: 1 | 2 | 3;
  text: string;
}

export interface EvacRow {
  village: EvacVillage;
  tier: EvacTier;
  /** Strongest live signal (0 = none). */
  hazard: 0 | 1 | 2 | 3;
  signals: EvacSignal[];
  inSeason: boolean;
  /** District rate × village population — null when population unknown. */
  est: { bedridden: number | null; homebound: number | null; disabled: number | null };
  /** bedridden + homebound: people who need someone to move them. */
  needHelp: number | null;
  action: string;
  leadTime: string;
  camera: CctvCamera | null;
}

export interface EvacSummary {
  moveNow: number;
  getReady: number;
  watch: number;
  needHelpMoveNow: number;
  needHelpGetReady: number;
  peopleMoveNow: number;
}

// A river gauge speaks for the reach it sits on: 5 km. Rain and the DWR
// flash-flood stations describe an area (upstream catchment): 8 km.
const GAUGE_RADIUS_M = 5000;
const SIGNAL_RADIUS_M = 8000;
const CAMERA_RADIUS_M = 3000;
const TIER_RANK: Record<EvacTier, number> = { "move-now": 3, "get-ready": 2, watch: 1, calm: 0 };

function nearestWithin<T extends { lat: number; lng: number }>(lat: number, lng: number, items: T[], maxM: number) {
  let best: { item: T; d: number } | null = null;
  for (const it of items) {
    const d = distanceM(lat, lng, it.lat, it.lng);
    if (d <= maxM && (!best || d < best.d)) best = { item: it, d };
  }
  return best;
}

function km(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

function estimate(v: EvacVillage, d: EvacDistrict | undefined): EvacRow["est"] {
  const pop = v.population;
  const dpop = d?.population;
  if (!pop || !dpop || !d) return { bedridden: null, homebound: null, disabled: null };
  const scale = (n: number | null) => (n == null ? null : Math.round((n / dpop) * pop));
  return { bedridden: scale(d.bedridden), homebound: scale(d.homebound), disabled: scale(d.disabled) };
}

function gaugeSignal(g: WaterGauge, d: number, etaH: number | null): EvacSignal | null {
  const where = `${g.name} gauge ${km(d)} away`;
  if (etaH != null && etaH > 0 && etaH <= 6) return { severity: 3, text: `${where} may overtop in about ${etaH < 1 ? `${Math.round(etaH * 60)} min` : `${etaH.toFixed(1)} h`}` };
  const v = judgeGauge(g);
  if (v?.level === "critical") return { severity: 3, text: `${where}: ${v.reason}` };
  if (etaH != null && etaH > 0 && etaH <= 24) return { severity: 2, text: `${where} may overtop in about ${Math.round(etaH)} h` };
  if (v?.level === "warning") return { severity: 2, text: `${where}: ${v.reason}` };
  if (v?.level === "watch") return { severity: 1, text: `${where}: ${v.reason}` };
  return null;
}

function ewsSignal(s: EwsStation, d: number): EvacSignal | null {
  const where = `flash-flood warning station ${s.name} (${km(d)})`;
  if (s.status === 3) return { severity: 3, text: `${where}: CRITICAL alarm` };
  if (s.status === 2) return { severity: 2, text: `${where}: prepare alarm` };
  if (s.status === 1) return { severity: 1, text: `${where}: watch` };
  return null;
}

function rainSignal(r: RainfallStation, d: number): EvacSignal | null {
  const h24 = r.rain24h ?? 0;
  const h1 = r.rain1h ?? 0;
  const where = `rain gauge ${r.name} (${km(d)})`;
  const amount = h1 >= 30 ? `${Math.round(h1)} mm in 1 h` : `${Math.round(h24)} mm in 24 h`;
  // Calibrated not to cry wolf: an evacuation list people learn to ignore
  // kills. 35 mm/24 h is only TMD "heavy"; 90 is "very heavy"; ≥ 150 mm/24 h
  // or ≥ 50 mm in one hour is extreme, flash-flood-producing rain.
  if (h1 >= 50 || h24 >= 150) return { severity: 3, text: `${where}: ${amount} — extreme rain` };
  if (h1 >= 30 || h24 >= 90) return { severity: 2, text: `${where}: ${amount} — very heavy rain` };
  if (h24 >= 35) return { severity: 1, text: `${where}: ${amount} — heavy rain` };
  return null;
}

/**
 * Tiers. "Move now" needs a CRITICAL live signal (overbank / RID critical /
 * overtop ≤ 6 h / EWS critical alarm / extreme rain). Flash-flood and
 * must-leave villages are ordered first within a tier, never promoted on
 * weaker evidence.
 */
function tierOf(hazard: number, v: EvacVillage, inSeason: boolean): EvacTier {
  if (hazard >= 3) return "move-now";
  if (hazard >= 2) return "get-ready";
  if (hazard >= 1 || (inSeason && v.mustEvacuate)) return "watch";
  return "calm";
}

function actionFor(tier: EvacTier, v: EvacVillage): string {
  const who = v.centre?.authority ? v.centre.authority : `the ${v.tambon} local authority`;
  switch (tier) {
    case "move-now":
      return `Move bedridden and homebound residents now, before the roads flood. Call ${who} and the village health volunteers (อสม.) for the named list; send a vehicle that can carry a stretcher.`;
    case "get-ready":
      return `Call ${who}: confirm who is bedridden or homebound, who their carers are, and which vehicle will move them. Be ready to go within the hour.`;
    case "watch":
      return `Check the list of residents who cannot leave on their own is current, and where they would go.`;
    default:
      return "No action needed.";
  }
}

function leadTimeFor(v: EvacVillage): string {
  if (v.floodTypes.includes("flash")) return "Flash flood: water can arrive within 1–3 h of heavy rain upstream, often at night.";
  if (v.floodTypes.includes("landslide")) return "Landslide risk: move people away from slopes after heavy rain.";
  return "Standing water: rises over hours to days, but access roads go first.";
}

export function rankEvacuation(opts: {
  data: EvacData;
  gauges: WaterGauge[];
  basins?: BasinWaterBalance[];
  ews?: EwsStation[];
  rain?: RainfallStation[];
  cameras?: CctvCamera[];
  now?: Date;
}): EvacRow[] {
  const month = (opts.now ?? new Date()).getMonth() + 1;
  const ews = (opts.ews ?? []).filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  const rain = (opts.rain ?? []).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
  const cameras = (opts.cameras ?? []).filter((c) => c.status !== "offline");
  const etaById = new Map<string, number>();
  for (const b of opts.basins ?? []) {
    for (const s of b.gauges) if (s.etaOvertopH != null) etaById.set(s.id, s.etaOvertopH);
  }

  const rows: EvacRow[] = [];
  for (const v of opts.data.villages) {
    const signals: EvacSignal[] = [];
    const g = nearestWithin(v.lat, v.lng, opts.gauges, GAUGE_RADIUS_M);
    if (g) {
      const s = gaugeSignal(g.item, g.d, etaById.get(g.item.id) ?? null);
      if (s) signals.push(s);
    }
    const e = nearestWithin(v.lat, v.lng, ews, SIGNAL_RADIUS_M);
    if (e) {
      const s = ewsSignal(e.item, e.d);
      if (s) signals.push(s);
    }
    // Wettest rain gauge in range, not merely the nearest.
    let wettest: { item: RainfallStation; d: number } | null = null;
    for (const r of rain) {
      const d = distanceM(v.lat, v.lng, r.lat, r.lng);
      if (d <= SIGNAL_RADIUS_M && (!wettest || (r.rain24h ?? 0) > (wettest.item.rain24h ?? 0))) wettest = { item: r, d };
    }
    if (wettest) {
      const s = rainSignal(wettest.item, wettest.d);
      if (s) signals.push(s);
    }
    signals.sort((a, b) => b.severity - a.severity);
    const hazard = (signals[0]?.severity ?? 0) as EvacRow["hazard"];
    const inSeason = v.riskMonths.includes(month);
    const tier = tierOf(hazard, v, inSeason);
    const est = estimate(v, opts.data.districts[v.amphoe]);
    const needHelp = est.bedridden == null && est.homebound == null ? null : (est.bedridden ?? 0) + (est.homebound ?? 0);
    rows.push({
      village: v,
      tier,
      hazard,
      signals,
      inSeason,
      est,
      needHelp,
      action: actionFor(tier, v),
      leadTime: leadTimeFor(v),
      camera: nearestWithin(v.lat, v.lng, cameras, CAMERA_RADIUS_M)?.item ?? null,
    });
  }

  const exposed = (r: EvacRow) => (r.village.floodTypes.includes("flash") ? 2 : 0) + (r.village.mustEvacuate ? 1 : 0);
  rows.sort((a, b) =>
    TIER_RANK[b.tier] - TIER_RANK[a.tier] ||
    b.hazard - a.hazard ||
    exposed(b) - exposed(a) ||
    (b.needHelp ?? -1) - (a.needHelp ?? -1) ||
    (b.village.population ?? -1) - (a.village.population ?? -1),
  );
  return rows;
}

export function summarizeEvacuation(rows: EvacRow[]): EvacSummary {
  const sum = (tier: EvacTier, f: (r: EvacRow) => number) => rows.filter((r) => r.tier === tier).reduce((s, r) => s + f(r), 0);
  return {
    moveNow: rows.filter((r) => r.tier === "move-now").length,
    getReady: rows.filter((r) => r.tier === "get-ready").length,
    watch: rows.filter((r) => r.tier === "watch").length,
    needHelpMoveNow: sum("move-now", (r) => r.needHelp ?? 0),
    needHelpGetReady: sum("get-ready", (r) => r.needHelp ?? 0),
    peopleMoveNow: sum("move-now", (r) => r.village.population ?? 0),
  };
}

export function villageLabel(v: EvacVillage): string {
  const moo = v.moo ? `หมู่ ${v.moo} ` : "";
  return `${moo}บ้าน${v.village} · ต.${v.tambon} · อ.${v.amphoe}`;
}
