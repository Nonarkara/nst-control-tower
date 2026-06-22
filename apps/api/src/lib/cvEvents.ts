/**
 * CV (computer-vision) detection event store.
 *
 * External CV pipeline flow:
 *   1. A Python/Node sidecar reads HLS/RTSP frames from CCTV cameras
 *   2. Runs inference (YOLO, MediaPipe, custom model)
 *   3. POSTs CvDetectionEvent JSON to POST /api/cctv/cv-events
 *   4. Dashboard polls GET /api/cctv/cv-events for display + alerting
 *
 * This module is a lightweight in-memory ring buffer — no external deps,
 * no DB required.  For persistent history, wire JSONL append at the route
 * layer (same pattern as news-archive / sensor-ingest).
 *
 * Capacity: 2,000 events (≈ a few hours at 1 camera × 1 detection/min).
 * Each event is ~400 bytes → ~800 KB peak.
 */

import type { CvDetectionEvent } from "@nst/shared";

export type { CvDetectionEvent };

const MAX_EVENTS = 2_000;

/** Ring buffer — oldest entries are evicted when full. */
const ring: CvDetectionEvent[] = [];

/** Index from cameraId → most-recent event for that camera. */
const latestByCamera = new Map<string, CvDetectionEvent>();

// ─── Validation ──────────────────────────────────────────────────────────────

export class CvValidationError extends Error {}

/**
 * Validate and normalise an incoming CV event payload.
 * Throws CvValidationError with a human-readable message on bad input.
 */
export function validateCvEvent(raw: unknown): CvDetectionEvent {
  if (!raw || typeof raw !== "object") {
    throw new CvValidationError("payload must be a JSON object");
  }
  const m = raw as Record<string, unknown>;

  if (typeof m.cameraId !== "string" || !m.cameraId.trim()) {
    throw new CvValidationError("cameraId is required (string)");
  }
  if (typeof m.timestamp !== "string" || Number.isNaN(Date.parse(m.timestamp))) {
    throw new CvValidationError("timestamp must be an ISO-8601 string");
  }
  if (!Array.isArray(m.detections)) {
    throw new CvValidationError("detections must be an array");
  }

  // Build counts from detections if not provided
  const counts: Record<string, number> = {};
  if (m.counts && typeof m.counts === "object" && !Array.isArray(m.counts)) {
    Object.assign(counts, m.counts);
  } else {
    for (const d of m.detections as Record<string, unknown>[]) {
      if (typeof d.class === "string") {
        counts[d.class] = (counts[d.class] ?? 0) + 1;
      }
    }
  }

  // bbox values are frame-normalised — anything outside 0..1 is a CV-pipeline
  // bug we'd rather drop than render at a nonsense screen position.
  const validBbox = (b: unknown): CvDetectionEvent["detections"][0]["bbox"] => {
    if (!b || typeof b !== "object") return undefined;
    const { x, y, w, h } = b as Record<string, unknown>;
    const inUnit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
    if (!inUnit(x) || !inUnit(y) || !inUnit(w) || !inUnit(h)) return undefined;
    return { x, y, w, h };
  };

  return {
    cameraId: (m.cameraId as string).trim(),
    timestamp: m.timestamp as string,
    detections: (m.detections as Record<string, unknown>[]).map((d) => ({
      class: typeof d.class === "string" ? d.class : "unknown",
      confidence: typeof d.confidence === "number" ? d.confidence : 0,
      bbox: validBbox(d.bbox),
    })),
    snapshotUrl: typeof m.snapshotUrl === "string" ? m.snapshotUrl : undefined,
    model: typeof m.model === "string" ? m.model : undefined,
    counts,
  };
}

// ─── Write ───────────────────────────────────────────────────────────────────

export function recordCvEvent(event: CvDetectionEvent): void {
  if (ring.length >= MAX_EVENTS) ring.shift(); // evict oldest
  ring.push(event);
  latestByCamera.set(event.cameraId, event);
}

// ─── Read ────────────────────────────────────────────────────────────────────

export interface CvQueryOptions {
  /** Filter to a specific camera. */
  cameraId?: string;
  /** Only events at or after this ISO timestamp. */
  since?: string;
  /** Maximum events to return (default 100, max 500). */
  limit?: number;
  /** Only events containing detections of this class. */
  cls?: string;
}

export function listCvEvents(opts: CvQueryOptions = {}): CvDetectionEvent[] {
  const limit = Math.min(opts.limit ?? 100, 500);
  const sinceMs = opts.since ? Date.parse(opts.since) : 0;

  const results: CvDetectionEvent[] = [];
  // Iterate newest-first
  for (let i = ring.length - 1; i >= 0 && results.length < limit; i--) {
    const e = ring[i];
    if (opts.cameraId && e.cameraId !== opts.cameraId) continue;
    if (sinceMs && Date.parse(e.timestamp) < sinceMs) break; // ring is oldest→newest
    if (opts.cls && !e.detections.some((d) => d.class === opts.cls)) continue;
    results.push(e);
  }
  return results;
}

export function getLatestByCameraId(cameraId: string): CvDetectionEvent | undefined {
  return latestByCamera.get(cameraId);
}

export function getAllLatestByCamera(): Map<string, CvDetectionEvent> {
  return latestByCamera;
}

export function cvEventStats(): {
  totalEvents: number;
  activeCameras: number;
  oldestTs: string | null;
  newestTs: string | null;
} {
  return {
    totalEvents: ring.length,
    activeCameras: latestByCamera.size,
    oldestTs: ring[0]?.timestamp ?? null,
    newestTs: ring[ring.length - 1]?.timestamp ?? null,
  };
}
