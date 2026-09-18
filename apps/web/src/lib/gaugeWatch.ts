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

/** Decode a JPEG dataURL to downscaled pixels. Downscale to 160 px wide —
 *  the reader only needs rows, and small keeps the main thread quiet. */
export async function framePixels(dataUrl: string): Promise<{ data: Uint8ClampedArray; w: number; h: number } | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const bmp = await createImageBitmap(blob);
    const w = 160;
    const h = Math.max(8, Math.round((bmp.height / Math.max(1, bmp.width)) * w));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bmp.close();
      return null;
    }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const img = ctx.getImageData(0, 0, w, h);
    return { data: img.data, w, h };
  } catch {
    return null;
  }
}

/** Analyse one candidate; returns the reading (or null when unusable). */
export async function analyzeCandidate(c: GaugeCandidate, nowMs = Date.now()): Promise<RiseDecision | null> {
  const px = await framePixels(c.dataUrl);
  if (!px) return null;
  const reading = readWaterLevel(px.data, px.w, px.h);
  if (!reading) return null;
  return decideRise(c.camera.id, reading.lineY, reading.confidence, nowMs);
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
