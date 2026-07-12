/**
 * In-memory ring of recent water-level samples per gauge, fed by each
 * successful ThaiWater poll, so the water-balance ledger can compute observed
 * rise rates (m/h) and time-to-overtop without extra upstream calls.
 *
 * Deliberately not persisted: rates warm up after two samples ≥30 min apart
 * (~30–60 min of normal polling). Until then riseRatePerHour returns null and
 * the UI says so — no fabricated trends. Cloudflare isolate recycling resets
 * the ring; the long-lived Node dev/ops server keeps it warm.
 */

interface GaugeSample {
  /** Epoch ms of the upstream observation (not our fetch time). */
  t: number;
  levelMsl: number;
}

const MAX_SAMPLES = 60; // ≥10 h at the 10-min gauge cadence
const RISE_WINDOW_MS = 6 * 3600_000; // FloodDash rise ladder uses a 6 h window
const MIN_SPAN_MS = 30 * 60_000; // two samples closer than this → no rate yet

const rings = new Map<string, GaugeSample[]>();

/** Record one observation. Duplicate timestamps (same upstream reading) are ignored. */
export function recordGaugeSample(id: string, observedAt: string, levelMsl: number | null): void {
  if (levelMsl == null || !Number.isFinite(levelMsl)) return;
  const t = Date.parse(observedAt);
  if (!Number.isFinite(t)) return;
  const ring = rings.get(id) ?? [];
  if (ring.length > 0 && ring[ring.length - 1].t === t) return;
  const next = [...ring, { t, levelMsl }].slice(-MAX_SAMPLES);
  rings.set(id, next);
}

/**
 * Observed rise rate (m/h) over up to the last 6 h. Null until the ring holds
 * two samples at least 30 min apart. Negative = falling.
 */
export function riseRatePerHour(id: string, nowMs: number = Date.now()): number | null {
  const ring = rings.get(id);
  if (!ring || ring.length < 2) return null;
  const latest = ring[ring.length - 1];
  const windowStart = nowMs - RISE_WINDOW_MS;
  const oldest = ring.find((s) => s.t >= windowStart) ?? ring[0];
  const spanMs = latest.t - oldest.t;
  if (spanMs < MIN_SPAN_MS) return null;
  return ((latest.levelMsl - oldest.levelMsl) / spanMs) * 3600_000;
}

/** Test hook — clears all rings. */
export function resetGaugeHistory(): void {
  rings.clear();
}
