/**
 * cameraEyes — what the cameras say about haze, and which cameras we ask.
 *
 * The flood half (water line on canal cameras) lives in gaugeWatch.ts; this adds
 * haze and the target selection both halves share. Everything is a LOCAL
 * browser reading — never posted as a trusted camera signal (see gaugeWatch).
 */
import type { CctvCamera } from "../map/layers";
import { framePixels, isDaylightICT } from "./gaugeWatch";
import {
  BASELINE_MIN_SAMPLES,
  rateHaze,
  readHaze,
  summarizeHaze,
  type CityHaze,
  type HazeBand,
} from "./hazeReader";

export const WATER_PER_SWEEP = 4;
export const SKY_PER_SWEEP = 4;
const MIN_CONFIDENCE = 0.45;
const HISTORY_KEY = "nst-haze-history-v1";
const HISTORY_MAX = 30;

export interface EyesTarget {
  camera: CctvCamera;
  whepUrl: string;
}

export function whepUrlForEmbed(embedUrl: string | undefined): string | undefined {
  return embedUrl ? embedUrl.replace(/\/?$/, "/") + "whep" : undefined;
}

function rotate<T>(list: T[], start: number, count: number): T[] {
  if (list.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, list.length); i++) out.push(list[(start + i) % list.length]!);
  return out;
}

/** Cameras to look through this sweep. Water cameras for the flood reader; wide
 *  road/safety views for haze (distance is where haze shows). Rotates so every
 *  camera gets a turn without ever asking for more than a handful at once. */
export function pickEyesTargets(cameras: readonly CctvCamera[], sweepNo: number): EyesTarget[] {
  const usable = cameras
    .filter((c) => c.status !== "offline")
    .map((c) => ({ camera: c, whepUrl: whepUrlForEmbed(c.embedUrl) }))
    .filter((t): t is EyesTarget => t.whepUrl != null)
    .sort((a, b) => a.camera.id.localeCompare(b.camera.id));
  const water = usable.filter((t) => t.camera.category === "water");
  const sky = usable.filter((t) => t.camera.category === "traffic" || t.camera.category === "safety");
  return [
    ...rotate(water, sweepNo * WATER_PER_SWEEP, WATER_PER_SWEEP),
    ...rotate(sky, sweepNo * SKY_PER_SWEEP, SKY_PER_SWEEP),
  ];
}

// ── Per-camera history (a camera is rated against ITS OWN clearest view) ────

type History = Record<string, number[]>;

function loadHistory(): History {
  try {
    const raw = globalThis.localStorage?.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as History) : {};
  } catch {
    return {};
  }
}

function saveHistory(h: History): void {
  try {
    globalThis.localStorage?.setItem(HISTORY_KEY, JSON.stringify(h));
  } catch {
    /* storage blocked — ratings fall back to absolute bands */
  }
}

/** The clearest this camera has looked, once there is enough history to trust. */
export function baselineFor(samples: readonly number[] | undefined): number | null {
  if (!samples || samples.length < BASELINE_MIN_SAMPLES) return null;
  return Math.min(...samples);
}

// ── Haze state ──────────────────────────────────────────────────────────────

export interface HazeSample {
  camId: string;
  name: string;
  index: number;
  band: HazeBand;
  /** Rated against the camera's own clearest view (true) or absolute bands (false). */
  relative: boolean;
}

export interface EyesSnapshot {
  /** Epoch ms of the last sweep that produced a haze reading; 0 = never. */
  at: number;
  samples: HazeSample[];
  city: CityHaze;
  /** Cameras looked through, and why some gave nothing. */
  looked: number;
  undecodable: number;
  unreadable: number;
  /** How many of the samples are still calibrating (absolute bands). */
  calibrating: number;
}

const EMPTY: EyesSnapshot = {
  at: 0, samples: [], city: { band: null, cameras: 0, agreeing: 0 },
  looked: 0, undecodable: 0, unreadable: 0, calibrating: 0,
};

let snapshot: EyesSnapshot = EMPTY;
let listeners: Array<() => void> = [];

export function getEyes(): EyesSnapshot {
  return snapshot;
}

export function subscribeEyes(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/** Test-only. */
export function __resetEyes(): void {
  snapshot = EMPTY;
}

export type HazeOutcome =
  | { status: "undecodable" }
  | { status: "unreadable" }
  | { status: "read"; sample: HazeSample };

export async function analyzeHaze(camera: CctvCamera, dataUrl: string, history: History = loadHistory()): Promise<HazeOutcome> {
  const px = await framePixels(dataUrl);
  if (!px) return { status: "undecodable" };
  const reading = readHaze(px.data, px.w, px.h);
  if (!reading || reading.confidence < MIN_CONFIDENCE) return { status: "unreadable" };
  const base = baselineFor(history[camera.id]);
  const { band, relative } = rateHaze(reading.index, base);
  return {
    status: "read",
    sample: { camId: camera.id, name: camera.name, index: reading.index, band, relative },
  };
}

/** Fold a sweep in: update each camera's history, then the city summary. */
export function recordHazeSweep(outcomes: HazeOutcome[], nowMs = Date.now()): void {
  if (outcomes.length === 0) return;
  const samples = outcomes.flatMap((o) => (o.status === "read" ? [o.sample] : []));
  if (samples.length > 0) {
    const history = loadHistory();
    for (const s of samples) {
      history[s.camId] = [...(history[s.camId] ?? []), s.index].slice(-HISTORY_MAX);
    }
    saveHistory(history);
  }
  snapshot = {
    at: samples.length > 0 ? nowMs : snapshot.at,
    samples,
    city: summarizeHaze(samples.map((s) => s.band)),
    looked: outcomes.length,
    undecodable: outcomes.filter((o) => o.status === "undecodable").length,
    unreadable: outcomes.filter((o) => o.status === "unreadable").length,
    calibrating: samples.filter((s) => !s.relative).length,
  };
  for (const l of listeners) l();
}

export { isDaylightICT };
