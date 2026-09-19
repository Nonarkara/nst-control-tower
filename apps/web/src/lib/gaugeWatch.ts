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
 * frame height vs the EMA baseline posts one `water-rising` event; the POST
 * is fire-and-forget and can never break the UI.
 */

import type { CctvCamera } from "../map/layers";
import { getCachedFrame } from "./cctvCapturePool";
import { readWaterLevel } from "./gaugeReader";

export const GAUGE_EVENT_CLASS = "water-rising";
export const RISE_THRESHOLD = 0.04; // lineY fraction of frame height
export const MIN_CONFIDENCE = 0.5;
const ANALYZE_COOLDOWN_MS = 10 * 60_000;
const MAX_PER_SWEEP = 3;
const BASE_KEY = "nst:gauge-base:";
const SEEN_KEY = "nst:gauge-seen:";

function ictHour(nowMs = Date.now()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(nowMs)));
}

/** Daylight gate — the pixel test is meaningless on night/IR frames. */
export function isDaylightICT(nowMs = Date.now()): boolean {
  const h = ictHour(nowMs);
  return h >= 7 && h < 18;
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
    const seen = readStore(SEEN_KEY + c.id);
    if (seen && nowMs - seen.at < ANALYZE_COOLDOWN_MS) continue;
    out.push({ camera: c, dataUrl: frame.dataUrl, capturedAt: frame.capturedAt });
  }
  return out;
}

export interface RiseDecision {
  rising: boolean;
  /** lineY delta vs baseline (positive = water rose). */
  rise: number;
  confidence: number;
}

/** Compare a fresh reading against the EMA baseline. Updates both stores. */
export function decideRise(camId: string, lineY: number, confidence: number, nowMs = Date.now()): RiseDecision {
  writeStore(SEEN_KEY + camId, { lineY, at: nowMs });
  const base = readStore(BASE_KEY + camId);
  if (!base || nowMs - base.at > 6 * 3_600_000) {
    // No baseline (or older than 6 h — different light, different scene):
    // seed it, report nothing.
    writeStore(BASE_KEY + camId, { lineY, at: nowMs });
    return { rising: false, rise: 0, confidence };
  }
  const rise = base.lineY - lineY; // line moves UP the frame = water rises
  const rising = rise >= RISE_THRESHOLD && confidence >= MIN_CONFIDENCE;
  // A confirmed rise HARD-anchors the baseline: the same level never re-fires,
  // only FURTHER rise posts again. Quiet readings EMA toward the new level so
  // slow drift (light, debris, camera nudge) doesn't accumulate into a phantom.
  writeStore(BASE_KEY + camId, { lineY: rising ? lineY : base.lineY * 0.5 + lineY * 0.5, at: nowMs });
  return { rising, rise, confidence };
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
  | { status: "unreadable" } // decoded, but no usable water line (night, fog, street scene, reflective water)
  | { status: "read"; decision: RiseDecision };

/** Analyse one candidate. The outcome says WHY when there is no reading, so the
 *  panel can report real coverage instead of implying every camera is watched. */
export async function analyzeCandidate(c: GaugeCandidate, nowMs = Date.now()): Promise<AnalysisOutcome> {
  const px = await framePixels(c.dataUrl);
  if (!px) return { status: "undecodable" };
  const reading = readWaterLevel(px.data, px.w, px.h);
  if (!reading) return { status: "unreadable" };
  return { status: "read", decision: decideRise(c.camera.id, reading.lineY, reading.confidence, nowMs) };
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
