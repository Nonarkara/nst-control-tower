/**
 * cctvCapturePool — a small, global scheduler that keeps CCTV wall tiles
 * filled with recent still frames grabbed via WHEP (see `whepSnapshot.ts`).
 *
 * The model is a NOC "guard tour": tiles that are on screen register interest;
 * the pool captures a single frame per camera (max `MAX_CONCURRENT` at once),
 * caches it, and re-captures on a slow refresh cadence while the tile stays in
 * view. Because each capture is short-lived (open → one frame → close), the
 * whole visible set fills within seconds and only a few WebRTC decoders ever
 * run — unlike persistent live iframes, which freeze the tab past ~4.
 *
 * State lives at module scope (like the old slot manager) so a captured frame
 * survives filter changes, scrolling, and re-renders. `useWhepFrame` is the
 * React entry point.
 */

import { useEffect, useState } from "react";
import { captureFrame, type WhepFrame } from "./whepSnapshot";

function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[name];
  const n = Number(raw);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

// How many WHEP captures may run at once. Each is brief.
const MAX_CONCURRENT = envInt("VITE_CCTV_MAX_CAPTURES", 4, 1, 8);
// Re-capture an in-view tile no more often than this — slow, so a filled wall
// stays quiet against the upstream.
const REFRESH_MS = 90_000;

// The upstream (MediaMTX) rate-limits hard: measured ~60 requests per window,
// then HTTP 429 with NO CORS header — so from the browser a 429 preflight
// surfaces as a CORS/"Failed to fetch" error with no status. We therefore
// pace ourselves with a client-side token bucket kept well under that ceiling
// (each capture spends ~2 requests: the preflight + the SDP POST).
const BUCKET_CAPACITY = 8; // initial burst — fills the first screen, stays clear of the ceiling
const REFILL_MS = 2_500; // then ~24 capture-starts/min sustained (~48 req/min)
// A capture that fails FAST (before the SDP round-trip could complete) is
// almost certainly the 429-as-CORS-error. Pause ALL new starts briefly so the
// limiter recovers (measured recovery ~6s), and drain the bucket.
const FAST_FAIL_MS = 1_500;
const GLOBAL_COOLDOWN_MS = 6_500;
// Per-camera backoff after any failure, jittered so a wave of failures doesn't
// retry in lockstep and re-trip the limiter.
const CAMERA_BACKOFF_MS = 45_000;
const CAMERA_BACKOFF_JITTER_MS = 20_000;
// Scheduler cadence.
const TICK_MS = 400;

export type FrameState =
  | { kind: "idle" }
  | { kind: "capturing"; frame?: WhepFrame }
  | { kind: "ready"; frame: WhepFrame }
  | { kind: "error"; frame?: WhepFrame };

interface Interest {
  whepUrl: string;
  notify: (state: FrameState) => void;
}

const interests = new Map<string, Set<Interest>>();
const frames = new Map<string, WhepFrame>();
const capturing = new Set<string>();
/** Earliest epoch-ms at which a camera may be (re)captured. */
const nextEligibleAt = new Map<string, number>();

let activeCount = 0;
let tickTimer: number | null = null;
let statsListeners: Array<() => void> = [];

// Token bucket for capture starts + a global cooldown gate.
let tokens = BUCKET_CAPACITY;
let lastRefillAt = Date.now();
let cooldownUntil = 0;

function refillTokens(now: number): void {
  if (now <= lastRefillAt) return;
  const add = Math.floor((now - lastRefillAt) / REFILL_MS);
  if (add > 0) {
    tokens = Math.min(BUCKET_CAPACITY, tokens + add);
    lastRefillAt += add * REFILL_MS;
  }
}

function currentStateFor(camId: string): FrameState {
  const frame = frames.get(camId);
  if (capturing.has(camId)) return { kind: "capturing", frame };
  if (frame) return { kind: "ready", frame };
  return { kind: "idle" };
}

function notify(camId: string, state: FrameState): void {
  const set = interests.get(camId);
  if (!set) return;
  for (const i of set) i.notify(state);
}

function notifyStats(): void {
  for (const l of statsListeners) l();
}

function ensureTicking(): void {
  if (tickTimer !== null) return;
  tickTimer = window.setInterval(tick, TICK_MS);
}

function stopTickingIfIdle(): void {
  if (interests.size === 0 && activeCount === 0 && tickTimer !== null) {
    window.clearInterval(tickTimer);
    tickTimer = null;
  }
}

function needsCapture(camId: string, now: number): boolean {
  if (capturing.has(camId)) return false;
  const eligibleAt = nextEligibleAt.get(camId) ?? 0;
  if (now < eligibleAt) return false;
  const frame = frames.get(camId);
  if (!frame) return true; // never captured
  return now - frame.capturedAt >= REFRESH_MS; // stale → refresh
}

function tick(): void {
  const now = Date.now();
  refillTokens(now);
  // Global cooldown after a suspected rate-limit — hold all new starts.
  if (now < cooldownUntil) {
    stopTickingIfIdle();
    return;
  }
  // Fill the pool from current interests (Map insertion order — a stable, fair
  // tour). Bounded by both the concurrency cap and the token bucket.
  for (const camId of interests.keys()) {
    if (activeCount >= MAX_CONCURRENT || tokens <= 0) break;
    const set = interests.get(camId);
    if (!set || set.size === 0) continue;
    if (!needsCapture(camId, now)) continue;
    const whepUrl = set.values().next().value?.whepUrl;
    if (!whepUrl) continue;
    tokens -= 1; // spend a start token
    startCapture(camId, whepUrl);
  }
  stopTickingIfIdle();
}

function startCapture(camId: string, whepUrl: string): void {
  capturing.add(camId);
  activeCount++;
  const startedAt = Date.now();
  notify(camId, currentStateFor(camId));
  notifyStats();

  captureFrame(whepUrl)
    .then((frame) => {
      frames.set(camId, frame);
      nextEligibleAt.set(camId, Date.now() + REFRESH_MS);
      notify(camId, { kind: "ready", frame });
    })
    .catch(() => {
      const now = Date.now();
      // Fast failure ⇒ almost certainly the upstream 429 (arrives as a CORS
      // error with no status). Pause everything briefly and drain the bucket
      // so we don't re-storm. Slow failures (offline camera, frame timeout)
      // only back that one camera off.
      if (now - startedAt < FAST_FAIL_MS) {
        cooldownUntil = now + GLOBAL_COOLDOWN_MS;
        tokens = 0;
      }
      const backoff = CAMERA_BACKOFF_MS + Math.random() * CAMERA_BACKOFF_JITTER_MS;
      nextEligibleAt.set(camId, now + backoff);
      notify(camId, { kind: "error", frame: frames.get(camId) });
    })
    .finally(() => {
      capturing.delete(camId);
      activeCount--;
      notifyStats();
    });
}

function addInterest(camId: string, whepUrl: string, notifyFn: (s: FrameState) => void): () => void {
  let set = interests.get(camId);
  if (!set) {
    set = new Set();
    interests.set(camId, set);
  }
  const interest: Interest = { whepUrl, notify: notifyFn };
  set.add(interest);
  // Surface whatever we already have immediately (cached still or idle).
  notifyFn(currentStateFor(camId));
  ensureTicking();

  return () => {
    const s = interests.get(camId);
    if (!s) return;
    s.delete(interest);
    if (s.size === 0) interests.delete(camId);
    stopTickingIfIdle();
  };
}

/** React hook: while `active`, keep this camera's tile filled with a recent
 *  WHEP still. Returns the latest state (idle → capturing → ready, or error
 *  with the last good frame retained). */
export function useWhepFrame(camId: string, whepUrl: string | undefined, active: boolean): FrameState {
  const [state, setState] = useState<FrameState>(() => currentStateFor(camId));

  useEffect(() => {
    if (!active || !whepUrl) {
      setState(currentStateFor(camId));
      return;
    }
    return addInterest(camId, whepUrl, setState);
  }, [camId, whepUrl, active]);

  return state;
}

export interface CaptureStats {
  /** Captures running right now. */
  active: number;
  /** Cap on concurrent captures. */
  cap: number;
  /** Distinct cameras with at least one captured frame. */
  imaged: number;
}

export function getCaptureStats(): CaptureStats {
  return { active: activeCount, cap: MAX_CONCURRENT, imaged: frames.size };
}

export function subscribeCaptureStats(listener: () => void): () => void {
  statsListeners.push(listener);
  return () => {
    statsListeners = statsListeners.filter((l) => l !== listener);
  };
}
