/**
 * levelWatch — "is water above the allowed level anywhere, and can I look?"
 *
 * Pure ranking over the gauge feeds: every station that is at / near / over
 * its own reference level becomes a row, tagged with WHICH rule fired (so the
 * source's contribution is visible), the nearest water-level camera (so the
 * operator can verify with their eyes), and the nearest GISTDA level post.
 *
 * Reference levels differ by upstream, and the feeds are honest about it:
 *   - HII ThaiWater rows carry `bankMsl` + `fullnessPct` + `situationLevel`
 *     (1 drought … 3 normal … 5 overbank).
 *   - RID hydro rows carry `criticalMsl` only, with `bankMsl` = 0 as a "not
 *     provided" sentinel — never treat 0 as a real bank.
 * So the rules read whichever reference a row actually has.
 */

import type { WaterGauge, GistdaLevelPost } from "@nst/shared";
import type { CctvCamera } from "../map/layers";

export type WatchLevel = "critical" | "warning" | "watch";

export interface LevelWatchRow {
  id: string;
  stationCode: string | null;
  name: string;
  river: string;
  amphoe: string;
  level: WatchLevel;
  /** Which rule fired, EN + TH. */
  reason: string;
  reasonTh: string;
  levelM: number | null;
  /** The reference the rule compared against (bank or critical), m MSL. */
  refM: number | null;
  refKind: "bank" | "critical" | null;
  fullnessPct: number | null;
  trend: WaterGauge["trend"];
  /** Feed(s) this row's evidence came from. */
  sources: string[];
  lat: number;
  lng: number;
  camera: CctvCamera | null;
  cameraDistanceM: number | null;
  post: GistdaLevelPost | null;
  postDistanceM: number | null;
}

export interface LevelWatchSummary {
  critical: number;
  warning: number;
  watch: number;
  total: number;
  /** Gauges considered (rows with a usable reading). */
  gaugesConsidered: number;
}

// Camera must be close enough to plausibly be looking at the same water.
const CAMERA_MAX_M = 1500;
const POST_MAX_M = 1000;

// HII channel fullness bands (% of bank).
const FULL_WATCH = 80;
const FULL_WARNING = 90;
// RID critical-level proximity (m of headroom left).
const CRIT_WARNING_GAP_M = 0.5;
const CRIT_WATCH_GAP_M = 1.0;

const RANK: Record<WatchLevel, number> = { critical: 3, warning: 2, watch: 1 };

export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function hasBank(g: WaterGauge): boolean {
  return g.bankMsl != null && Number.isFinite(g.bankMsl) && g.bankMsl !== 0;
}

function hasCritical(g: WaterGauge): boolean {
  return g.criticalMsl != null && Number.isFinite(g.criticalMsl) && g.criticalMsl > 0;
}

interface Verdict {
  level: WatchLevel;
  reason: string;
  reasonTh: string;
  refM: number | null;
  refKind: LevelWatchRow["refKind"];
  sources: string[];
}

/** The rule set. Returns null when the station is comfortably normal. */
export function judgeGauge(g: WaterGauge): Verdict | null {
  const lvl = g.levelMsl;
  const src = g.stationCode?.startsWith("ridhydro_") ? "RID" : "HII ThaiWater";

  // 1. Overbank — the strongest signal, needs a real bank.
  if (g.situationLevel === 5 || (hasBank(g) && g.diffFromBank != null && g.diffFromBank >= 0)) {
    return {
      level: "critical",
      reason: "over bank",
      reasonTh: "น้ำล้นตลิ่ง",
      refM: hasBank(g) ? g.bankMsl : null,
      refKind: hasBank(g) ? "bank" : null,
      sources: [src],
    };
  }
  // 2. RID critical level — absolute m MSL, so headroom in metres is meaningful.
  if (hasCritical(g) && lvl != null) {
    const gap = (g.criticalMsl as number) - lvl;
    if (gap <= 0) return { level: "critical", reason: "at/above critical level", reasonTh: "ถึงระดับวิกฤต", refM: g.criticalMsl, refKind: "critical", sources: [src] };
    if (gap <= CRIT_WARNING_GAP_M) return { level: "warning", reason: `${gap.toFixed(2)} m below critical`, reasonTh: `ต่ำกว่าระดับวิกฤต ${gap.toFixed(2)} ม.`, refM: g.criticalMsl, refKind: "critical", sources: [src] };
    if (gap <= CRIT_WATCH_GAP_M) return { level: "watch", reason: `${gap.toFixed(2)} m below critical`, reasonTh: `ต่ำกว่าระดับวิกฤต ${gap.toFixed(2)} ม.`, refM: g.criticalMsl, refKind: "critical", sources: [src] };
  }
  // 3. HII channel fullness — % of bank.
  const full = g.fullnessPct;
  if (full != null && Number.isFinite(full)) {
    if (full >= 100) return { level: "critical", reason: `${full.toFixed(0)}% of bank`, reasonTh: `${full.toFixed(0)}% ของตลิ่ง`, refM: hasBank(g) ? g.bankMsl : null, refKind: hasBank(g) ? "bank" : null, sources: [src] };
    if (full >= FULL_WARNING || g.situationLevel === 4) return { level: "warning", reason: `${full.toFixed(0)}% of bank`, reasonTh: `${full.toFixed(0)}% ของตลิ่ง`, refM: hasBank(g) ? g.bankMsl : null, refKind: hasBank(g) ? "bank" : null, sources: [src] };
    if (full >= FULL_WATCH) return { level: "watch", reason: `${full.toFixed(0)}% of bank`, reasonTh: `${full.toFixed(0)}% ของตลิ่ง`, refM: hasBank(g) ? g.bankMsl : null, refKind: hasBank(g) ? "bank" : null, sources: [src] };
  } else if (g.situationLevel === 4) {
    return { level: "warning", reason: "high (situation 4)", reasonTh: "ระดับสูง", refM: hasBank(g) ? g.bankMsl : null, refKind: hasBank(g) ? "bank" : null, sources: [src] };
  }
  return null;
}

function nearest<T extends { lat: number; lng: number }>(lat: number, lng: number, items: T[], maxM: number): { item: T; d: number } | null {
  let best: { item: T; d: number } | null = null;
  for (const it of items) {
    const d = distanceM(lat, lng, it.lat, it.lng);
    if (d <= maxM && (best === null || d < best.d)) best = { item: it, d };
  }
  return best;
}

export function rankLevelWatch(opts: {
  gauges: WaterGauge[];
  posts?: GistdaLevelPost[];
  cameras?: CctvCamera[];
}): LevelWatchRow[] {
  const posts = opts.posts ?? [];
  const cameras = (opts.cameras ?? []).filter((c) => c.status !== "offline");
  const rows: LevelWatchRow[] = [];
  for (const g of opts.gauges) {
    const v = judgeGauge(g);
    if (!v) continue;
    const cam = nearest(g.lat, g.lng, cameras, CAMERA_MAX_M);
    const post = nearest(g.lat, g.lng, posts, POST_MAX_M);
    const sources = [...v.sources];
    if (post) sources.push("GISTDA post");
    if (cam) sources.push("nstcctv");
    rows.push({
      id: g.id,
      stationCode: g.stationCode,
      name: g.name,
      river: g.riverName || post?.item.river || "",
      amphoe: g.amphoe,
      level: v.level,
      reason: v.reason,
      reasonTh: v.reasonTh,
      levelM: g.levelMsl,
      refM: v.refM,
      refKind: v.refKind,
      fullnessPct: g.fullnessPct,
      trend: g.trend,
      sources,
      lat: g.lat,
      lng: g.lng,
      camera: cam?.item ?? null,
      cameraDistanceM: cam ? Math.round(cam.d) : null,
      post: post?.item ?? null,
      postDistanceM: post ? Math.round(post.d) : null,
    });
  }
  rows.sort((a, b) => {
    const r = RANK[b.level] - RANK[a.level];
    if (r !== 0) return r;
    const fa = a.fullnessPct ?? -1;
    const fb = b.fullnessPct ?? -1;
    if (fb !== fa) return fb - fa;
    return (b.trend === "rising" ? 1 : 0) - (a.trend === "rising" ? 1 : 0);
  });
  return rows;
}

export function summarizeLevelWatch(rows: LevelWatchRow[], gauges: WaterGauge[]): LevelWatchSummary {
  return {
    critical: rows.filter((r) => r.level === "critical").length,
    warning: rows.filter((r) => r.level === "warning").length,
    watch: rows.filter((r) => r.level === "watch").length,
    total: rows.length,
    gaugesConsidered: gauges.filter((g) => g.levelMsl != null).length,
  };
}
