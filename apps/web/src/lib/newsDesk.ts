/**
 * Pure helpers for the NewsDesk component —
 * extracted for unit testing.
 */

import { STATUS, type StatusLevel } from "./status";

/**
 * Map a Traffy Fondue complaint score to a status level.
 * Score reflects cumulative engagement (views + votes).
 *
 *   ≥ 1000 → critical — high-profile issue
 *   ≥ 500  → watch    — notable issue
 *   < 500  → unknown  — routine (neutral ink)
 */
export function scoreStatus(score: number): StatusLevel {
  if (score >= 1000) return "critical";
  if (score >= 500) return "watch";
  return "unknown";
}

/** Status colour token for a complaint score (always shown beside its glyph + figure). */
export function scoreColor(score: number): string {
  return STATUS[scoreStatus(score)].color;
}
