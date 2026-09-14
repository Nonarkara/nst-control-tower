import type { StatusLevel } from "./status";

/**
 * Pure helpers for the WaterPanel reservoir display —
 * extracted from WaterPanel.tsx for unit testing.
 */

/**
 * Classify remaining water supply into an alert level.
 *
 * Thresholds (days of supply remaining):
 *   null   → "ok"      (unknown — don't alarm)
 *   < 10   → "critical"
 *   < 30   → "low"
 *   < 120  → "watch"
 *   ≥ 120  → "ok"
 */
export function alertLevel(days: number | null): "critical" | "low" | "watch" | "ok" {
  if (days == null) return "ok";
  if (days < 10)   return "critical";
  if (days < 30)   return "low";
  if (days < 120)  return "watch";
  return "ok";
}

// ─── Status mapping (display) ────────────────────────────────────────────────
// Domain scales mapped onto the ONE status vocabulary in lib/status.ts, so the
// flood panels never invent their own colours. Labels always travel with them.


/** ThaiWater situation_level (1 drought … 5 overbank) → status. Drought is a
 *  warning, not the same "critical" as overbank flooding. */
export function situationStatus(sit: number | null | undefined): StatusLevel {
  switch (sit) {
    case 5: return "critical";
    case 4: return "warning";
    case 3: return "normal";
    case 2: return "watch";
    case 1: return "warning";
    default: return "unknown";
  }
}

/** alertLevel() (days of supply) → status. */
export function reservoirStatus(level: ReturnType<typeof alertLevel>): StatusLevel {
  return { critical: "critical", low: "warning", watch: "watch", ok: "normal" }[level] as StatusLevel;
}

/** Reservoir storage % → status (over-full is the flood-side risk). */
export function storageStatus(pct: number | null | undefined): StatusLevel {
  if (pct == null) return "unknown";
  if (pct > 90) return "critical";
  if (pct > 70) return "watch";
  return "normal";
}

/** Accumulated rain (mm/24h) → status on the TMD bands:
 *  moderate ≥ 10, heavy ≥ 35, very heavy ≥ 90. */
export function rainStatus(mm: number | null | undefined): StatusLevel {
  if (mm == null) return "unknown";
  if (mm >= 90) return "critical";
  if (mm >= 35) return "warning";
  if (mm >= 10) return "watch";
  return "normal";
}
