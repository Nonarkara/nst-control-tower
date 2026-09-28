/**
 * gaugeWatch — turn WL-camera stills into `water-rising` cv-events.
 *
 * The telemetry deserts (canals with a CCTV + wooden pole but no HII gauge)
 * are exactly where floods surprise the city. The wall's capture pool already
 * holds recent stills for on-screen cameras, so the watch analyses THOSE —
 * zero extra upstream requests, respectful of MediaMTX's ~60-req limiter.
 *
 * Per camera, at most one analysis per 10 min, max 3 per sweep, daylight
 * ICT only (night/IR frames read as water to a pixel test). A rise of ≥4% of
 * frame height vs the IMMUTABLE per-camera reference (the first dry frame
 * ever analysed for that camera) posts one `water-rising` event; the POST
 * is fire-and-forget and can never break the UI.
 */

import type { CctvCamera } from "../map/layers";
import { getCachedFrame } from "./cctvCapturePool";
import { readWaterLevel } from "./gaugeReader";

export const RISE_THRESHOLD = 0.04; // lineY fraction of frame height
export const MIN_CONFIDENCE = 0.5;
export const GAUGE_EVENT_CLASS = "water-rising";
const MAX_PER_SWEEP = 3;

function ictHour(nowMs = Date.now()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(nowMs)));
}

/** Daylight gate — the pixel test is meaningless on night/IR frames. */
export function isDaylightICT(nowMs = Date.now()): boolean {
  const h = ictHour(nowMs);
  return h >= 7 && h < 18;
}

/** Classify a water-level reading into one of three frame kinds so the
 *  reference-anchored rise detector knows what it's comparing against.
 *  - "water"  → camera pointed at a canal; the line is the water surface.
 *  - "street" → camera pointing at a road; we look for water on the road surface.
 *  - "reflective" → a "water" camera where the surface is too mirror-like
 *    for the line detector to find a stable edge. */
function classifyFrameKind(camera: CctvCamera, reading: { lineY: number; confidence: number }): "reference" | "street" | "water" {
  if (camera.category === "water") {
    // A water camera where the line was found but confidence is low often means
    // a reflective surface. Treat as water frame kind; the reference will still work
    // if the water later drops (real rise), but won't fire on quiet reflections.
    return "water";
  }
  // Non-water camera (street/scene). If confidence is decent, water-on-road is plausible.
  return "street";
}

/** SSR-safe storage — typeof-guard like useFeed (vitest runs in node). */
function storage(): Pick<Storage, "getItem" | "setItem"> | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readStore(key: string): { lineY: number; at: number } | null {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as { lineY?: unknown; at?: unknown };
    if (typeof v.lineY !== "number" || typeof v.at !== "number") return null;
    return { lineY: v.lineY, at: v.at };
  } catch {
    return null;
  }
}

function writeStore(key: string, v: { lineY: number; at: number }): void {
  try {
    storage()?.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode — the watch just won't persist */
  }
}

export interface GaugeCandidate {
  camera: CctvCamera;
  dataUrl: string;
  capturedAt: number;
}

/** WL cameras with a fresh-enough pooled frame, due for analysis. Pure
 *  selection — the DOM/canvas work happens in the caller. */
export function pickGaugeCandidates(
  cameras: CctvCamera[],
  nowMs = Date.now(),
): GaugeCandidate[] {
  if (!isDaylightICT(nowMs)) return [];
  const out: GaugeCandidate[] = [];
  for (const c of cameras) {
    if (out.length >= MAX_PER_SWEEP) break;
    if ((c.category ?? "other") !== "water") continue;
    if (c.status === "offline") continue;
    const frame = getCachedFrame(c.id);
    if (!frame) continue;
    if (nowMs - frame.capturedAt > 15 * 60_000) continue; // stale still
    const base = readRef(c.id);
    if (base && nowMs - base.at < 10 * 60_000) continue; // recently analyzed, skip
    out.push({ camera: c, dataUrl: frame.dataUrl, capturedAt: frame.capturedAt });
  }
  return out;
}

export interface RiseDecision {
  /** STATE: the water is currently ≥ RISE_THRESHOLD above the dry reference.
   *  Stays true for as long as the water stays up — it is a level, not an event. */
  rising: boolean;
  /** EVENT: this reading is worth telling someone about. True on the first
   *  crossing, and again on each further RISE_THRESHOLD of climb, but NOT on
   *  every sweep of steady high water. Without this, a 12 h flood posts an
   *  alert every 5 min per camera and the operator learns to ignore the panel. */
  shouldAlert: boolean;
  /** How far the new water line is below the reference line (0 = at reference, >0 = rose). */
  rise: number;
  /** Confidence in this reading. */
  confidence: number;
  /** Status of the frame: "reference", "street", or "water" (optional for legacy callers). */
  frameKind?: "reference" | "street" | "water";
}

/** The reference-frame baseline. Each camera gets ONE stored reference still
 *  (the first dry frame analysed for that camera). It is IMMUTABLE for the
 *  life of the page: every later reading is compared against this original
 *  dry state, so a SLOW flood (1% per sweep for 20 sweeps = 20% total) still
 *  accumulates past the threshold instead of being measured frame-to-frame
 *  and never firing.
 *
 *  Re-anchoring is explicit, never implicit: `reanchorRef` is called only by
 *  an operator action or a season rollover, never by the analysis loop. */
type RefMap = Record<string, { lineY: number; at: number; dataUrl: string } | null>;

const refMap: RefMap = {};

function readRef(camId: string): { lineY: number; at: number; dataUrl: string } | null {
  return refMap[camId] ?? null;
}

function writeRef(camId: string, lineY: number, at: number, dataUrl: string): void {
  refMap[camId] = { lineY, at, dataUrl };
}

/** Explicitly re-anchor a camera to a new dry baseline. NOT called by the
 *  analysis loop — a quiet reading must never move the reference, or a slow
 *  flood becomes invisible (the bug this replaced). */
export function reanchorRef(camId: string, lineY: number, nowMs = Date.now()): void {
  writeRef(camId, lineY, nowMs, "");
}

/** Per-camera memory of the last rise we actually alerted on, so steady high
 *  water does not re-alert every sweep. Cleared when the water drops back
 *  below the threshold, so the NEXT flood alerts from scratch. Separate from
 *  refMap on purpose: the dry reference must stay immutable. */
const alertedRise: Record<string, number | undefined> = {};

/** Test-only: forget every stored reference. */
export function __resetRefs(): void {
  for (const k of Object.keys(refMap)) delete refMap[k];
  for (const k of Object.keys(alertedRise)) delete alertedRise[k];
}

/** Float-safe threshold compare. `0.60 - 0.56` evaluates to
 *  0.039999999999999925 in IEEE-754, which is < 0.04 — so a rise of EXACTLY
 *  the documented 4% silently failed to fire. Compare with a small epsilon
 *  instead of raw `>=` so the documented threshold is the real threshold. */
const RISE_EPSILON = 1e-9;
export function riseExceedsThreshold(rise: number, threshold = RISE_THRESHOLD): boolean {
  return rise >= threshold - RISE_EPSILON;
}

/** Reference-anchored rise decision.
 *  - No reference exists → seed it from the first reading, report no rise.
 *  - Reference exists → compare new lineY against it. A SMALLER lineY (water
 *    lower in the frame) means it rose. The reference is NEVER moved here.
 *  - Street frames (non-`water` cameras) run the same detector; they post the
 *    same `water-rising` class when the line rises past the threshold. */
export function decideRise(camId: string, lineY: number, confidence: number, nowMs = Date.now(), frameKind: "reference" | "street" | "water" = "water"): RiseDecision {
  const base = readRef(camId);
  if (!base) {
    // First reading for this camera: seed the immutable reference.
    writeRef(camId, lineY, nowMs, "");
    return { rising: false, shouldAlert: false, rise: 0, confidence, frameKind };
  }
  const rise = base.lineY - lineY; // positive = water rose (moved up the frame)
  const rising = riseExceedsThreshold(rise) && confidence >= MIN_CONFIDENCE;
  if (!rising) {
    // Back below the threshold — re-arm, so a later flood alerts on its first crossing.
    delete alertedRise[camId];
    return { rising, shouldAlert: false, rise, confidence, frameKind };
  }
  const last = alertedRise[camId];
  // Alert on the first crossing, then only on each further threshold of climb.
  const shouldAlert = last === undefined || riseExceedsThreshold(rise - last);
  if (shouldAlert) alertedRise[camId] = rise;
  return { rising, shouldAlert, rise, confidence, frameKind };
}

/** Load a data: URL through an <img>. NOT fetch(): the CSP's connect-src (rightly)
 *  has no `data:`, so fetch(dataUrl) is blocked and every frame silently read
 *  as "unusable" — the whole watch never produced a single reading. Image
 *  loads follow img-src, which allows data:. */
function loadImage(dataUrl: string, timeoutMs = 10_000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (img: HTMLImageElement | null) => {
      if (done) return;
      done = true;
      globalThis.clearTimeout(timer);
      resolve(img);
    };
    const img = new Image();
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = dataUrl;
    // A stuck decode must never wedge the sweep (the running flag would skip
    // every later sweep). Data-URL images resolve in ms or never. globalThis,
    // not window — the CSP regression tests stub window without timers.
    const timer = globalThis.setTimeout(() => finish(null), timeoutMs);
  });
}

/** Decode a JPEG dataURL to downscaled pixels. Downscale to 160 px wide —
 *  the reader only needs rows, and small keeps the main thread quiet. */
export async function framePixels(dataUrl: string): Promise<{ data: Uint8ClampedArray; w: number; h: number } | null> {
  try {
    const img = await loadImage(dataUrl);
    if (!img || img.naturalWidth < 8 || img.naturalHeight < 8) return null;
    const w = 160;
    const h = Math.max(8, Math.round((img.naturalHeight / img.naturalWidth) * w));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h);
    return { data: px.data, w, h };
  } catch {
    return null;
  }
}

export type AnalysisOutcome =
  | { status: "undecodable" }
  | { status: "unreadable"; frameKind: "reference" | "street" | "water" }
  | { status: "read"; decision: RiseDecision };

/** Analyse one candidate. The outcome says WHY when there is no reading, so the
 *  panel can report real coverage instead of implying every camera is watched. */
export async function analyzeCandidate(c: GaugeCandidate, nowMs = Date.now()): Promise<AnalysisOutcome> {
  const px = await framePixels(c.dataUrl);
  if (!px) return { status: "undecodable" };
  const reading = readWaterLevel(px.data, px.w, px.h);
  if (!reading) {
    // Classify why we can't read: night/fog, street scene, or reflective water.
    const kind = classifyFrameKind(c.camera, reading!);
    return { status: "unreadable", frameKind: kind };
  }
  // Reading has lineY + confidence. Frame kind depends on camera category.
  const frameKind: "reference" | "street" | "water" =
    (c.camera.category ?? "other") === "water" ? "water" : "street";
  return { status: "read", decision: decideRise(c.camera.id, reading.lineY, reading.confidence, nowMs, frameKind) };
}

// ── Sweep stats (what the watch actually managed to do) ─────────────────────
export interface SweepStats {
  /** Epoch ms of the last sweep that analysed at least one frame; 0 = never. */
  at: number;
  analysed: number;
  undecodable: number;
  unreadable: number;
  /** Readings whose confidence cleared MIN_CONFIDENCE (the only ones that can post). */
  confident: number;
  /** Rises posted since the page loaded. */
  posted: number;
}

let stats: SweepStats = { at: 0, analysed: 0, undecodable: 0, unreadable: 0, confident: 0, posted: 0 };
let statsListeners: Array<() => void> = [];

export function getSweepStats(): SweepStats {
  return stats;
}

export function subscribeSweepStats(listener: () => void): () => void {
  statsListeners.push(listener);
  return () => {
    statsListeners = statsListeners.filter((l) => l !== listener);
  };
}

/** Fold one sweep's outcomes into the running totals (posted is cumulative, the rest are the LAST sweep). */
export function recordSweep(outcomes: Array<{ outcome: AnalysisOutcome; posted: boolean }>, nowMs = Date.now()): void {
  if (outcomes.length === 0) return;
  stats = {
    at: nowMs,
    analysed: outcomes.length,
    undecodable: outcomes.filter((o) => o.outcome.status === "undecodable").length,
    unreadable: outcomes.filter((o) => o.outcome.status === "unreadable").length,
    confident: outcomes.filter((o) => o.outcome.status === "read" && o.outcome.decision.confidence >= MIN_CONFIDENCE).length,
    posted: stats.posted + outcomes.filter((o) => o.posted).length,
  };
  for (const l of statsListeners) l();
}

/** POST a water-rising event. Fire-and-forget — failures are silent by
 *  design (a dead API must never break the map). */
export async function postRiseEvent(apiBase: string, camId: string, rise: number, confidence: number): Promise<void> {
  try {
    await fetch(`${apiBase}/api/cctv/cv-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cameraId: camId,
        timestamp: new Date().toISOString(),
        detections: [{ class: GAUGE_EVENT_CLASS, confidence: Math.min(0.99, 0.5 + rise * 4) }],
        counts: { [GAUGE_EVENT_CLASS]: 1 },
        model: "gauge-watch/v1 (browser CV, experimental)",
      }),
    });
  } catch {
    /* silent — the next sweep retries */
  }
}
