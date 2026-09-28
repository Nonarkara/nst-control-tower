/**
 * Reference-anchoring regression guard.
 *
 * These three cases pin the behaviour that the "immutable reference"
 * docstring claimed but the implementation did not deliver. Each one
 * was a real defect caught during a pre-flood-readiness audit.
 *
 * Before the fix:
 *   - decideRise() called writeRef() on EVERY reading, so the "reference"
 *     was really the previous frame. A slow flood (1% per sweep) measured
 *     1% every sweep and never crossed the 4% threshold — a slow-onset
 *     flood was structurally invisible.
 *   - `rise >= RISE_THRESHOLD` with RISE_THRESHOLD = 0.04 failed for a
 *     rise of EXACTLY 4%, because IEEE-754 evaluates 0.60 - 0.56 as
 *     0.039999999999999925. The documented threshold was not the real
 *     threshold.
 *   - The EMA branch was an empty `if` block whose body was only
 *     comments; it never moved the reference, so it was dead code that
 *     read like an implementation.
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  decideRise,
  reanchorRef,
  __resetRefs,
  riseExceedsThreshold,
  RISE_THRESHOLD,
  MIN_CONFIDENCE,
} from "./gaugeWatch";

const T0 = Date.UTC(2026, 8, 28, 4, 0, 0); // noon ICT, daylight
const STEP = 10 * 60_000; // the per-camera 10-minute analysis interval

describe("gaugeWatch — reference anchoring", () => {
  beforeEach(() => __resetRefs());

  test("the first reading seeds the reference and reports no rise", () => {
    const d = decideRise("cam-seed", 0.5, 0.9, T0, "water");
    expect(d.rising).toBe(false);
    expect(d.rise).toBe(0);
  });

  test("rises accumulate against the immutable reference, not the previous frame", () => {
    decideRise("cam-cum", 0.5, 0.9, T0, "water");
    expect(decideRise("cam-cum", 0.49, 0.9, T0 + STEP, "water").rise).toBeCloseTo(0.01, 6);
    expect(decideRise("cam-cum", 0.48, 0.9, T0 + 2 * STEP, "water").rise).toBeCloseTo(0.02, 6);
    expect(decideRise("cam-cum", 0.47, 0.9, T0 + 3 * STEP, "water").rise).toBeCloseTo(0.03, 6);
    // Crossing the threshold reports the FULL cumulative rise, not the last step.
    const d = decideRise("cam-cum", 0.46, 0.9, T0 + 4 * STEP, "water");
    expect(d.rise).toBeCloseTo(0.04, 6);
    expect(d.rising).toBe(true);
  });

  test("a slow flood accumulates and eventually fires", () => {
    // 1% per sweep. Before the fix this never fired, because every sweep
    // re-based the reference and only ever measured 1%.
    decideRise("cam-slow", 0.6, 0.9, T0, "water");
    const firedAt: number[] = [];
    for (let i = 1; i <= 20; i++) {
      if (decideRise("cam-slow", 0.6 - i * 0.01, 0.9, T0 + i * STEP, "water").rising) {
        firedAt.push(i);
      }
    }
    expect(firedAt.length).toBeGreaterThan(0);
    expect(firedAt[0]).toBe(4); // 4% cumulative
  });

  test("a rise of EXACTLY the threshold fires (float-safe compare)", () => {
    // 0.60 - 0.56 === 0.039999999999999925 in IEEE-754, so a bare
    // `>= 0.04` silently rejected the documented boundary case.
    decideRise("cam-edge", 0.6, 0.9, T0, "water");
    const d = decideRise("cam-edge", 0.56, 0.9, T0 + STEP, "water");
    expect(d.rise).toBeCloseTo(RISE_THRESHOLD, 6);
    expect(d.rising).toBe(true);
  });

  test("riseExceedsThreshold accepts the boundary and rejects just under it", () => {
    expect(riseExceedsThreshold(RISE_THRESHOLD)).toBe(true);
    expect(riseExceedsThreshold(RISE_THRESHOLD - 1e-6)).toBe(false);
    expect(riseExceedsThreshold(0.6 - 0.56)).toBe(true);
  });

  test("a quiet frame never moves the reference", () => {
    decideRise("cam-quiet", 0.5, 0.9, T0, "water");
    // Ten quiet frames with 0.1% jitter each.
    for (let i = 1; i <= 10; i++) {
      const d = decideRise("cam-quiet", 0.5 + (i % 2 === 0 ? 0.001 : -0.001), 0.9, T0 + i * STEP, "water");
      expect(d.rising).toBe(false);
    }
    // Jitter accumulated nowhere: a real 4% rise still measures 4%.
    const d = decideRise("cam-quiet", 0.46, 0.9, T0 + 11 * STEP, "water");
    expect(d.rise).toBeCloseTo(0.04, 6);
    expect(d.rising).toBe(true);
  });

  test("low confidence never fires even on a large rise", () => {
    decideRise("cam-conf", 0.6, 0.9, T0, "water");
    const d = decideRise("cam-conf", 0.5, MIN_CONFIDENCE - 0.01, T0 + STEP, "water");
    expect(d.rise).toBeGreaterThan(RISE_THRESHOLD);
    expect(d.rising).toBe(false);
  });

  test("receding water reports a negative rise and never fires", () => {
    decideRise("cam-recede", 0.4, 0.9, T0, "water");
    const d = decideRise("cam-recede", 0.5, 0.9, T0 + STEP, "water");
    expect(d.rise).toBeCloseTo(-0.1, 6);
    expect(d.rising).toBe(false);
  });

  test("reanchorRef moves the baseline on demand, not during analysis", () => {
    decideRise("cam-reanchor", 0.5, 0.9, T0, "water");
    // Explicit operator/season action: adopt 0.45 as the new dry baseline.
    reanchorRef("cam-reanchor", 0.45, T0 + STEP);
    // A rise that was 5% from the old reference is now only 0% from the new one.
    const d = decideRise("cam-reanchor", 0.45, 0.9, T0 + 2 * STEP, "water");
    expect(d.rise).toBeCloseTo(0, 6);
    expect(d.rising).toBe(false);
  });

  test("street frames run the same detector as water frames", () => {
    decideRise("cam-street", 0.6, 0.9, T0, "street");
    const d = decideRise("cam-street", 0.55, 0.9, T0 + STEP, "street");
    expect(d.frameKind).toBe("street");
    expect(d.rise).toBeCloseTo(0.05, 6);
    expect(d.rising).toBe(true);
  });

  test("cameras are independent — one camera's reference never moves another's", () => {
    decideRise("cam-A", 0.6, 0.9, T0, "water");
    decideRise("cam-B", 0.3, 0.9, T0, "water");
    for (let i = 1; i <= 6; i++) {
      decideRise("cam-A", 0.6 - i * 0.01, 0.9, T0 + i * STEP, "water");
    }
    // cam-B never moved, so its rise is still 0 against its own 0.3 reference.
    const b = decideRise("cam-B", 0.3, 0.9, T0 + 7 * STEP, "water");
    expect(b.rise).toBeCloseTo(0, 6);
    expect(b.rising).toBe(false);
  });
});

describe("alert hysteresis — a level is not an event", () => {
  test("steady high water alerts ONCE, not on every sweep", () => {
    __resetRefs();
    decideRise("h1", 0.50, 0.8, 0, "water");
    const alerts: number[] = [];
    for (let i = 1; i <= 24; i++) {
      // 2 hours of water sitting 10% above the dry reference.
      if (decideRise("h1", 0.40, 0.8, i * 300_000, "water").shouldAlert) alerts.push(i);
    }
    expect(alerts).toEqual([1]);
  });

  test("still reports the level every sweep — the flood does not disappear", () => {
    __resetRefs();
    decideRise("h2", 0.50, 0.8, 0, "water");
    decideRise("h2", 0.40, 0.8, 300_000, "water");
    const later = decideRise("h2", 0.40, 0.8, 600_000, "water");
    expect(later.rising).toBe(true);
    expect(later.shouldAlert).toBe(false);
  });

  test("water climbing a further threshold alerts again", () => {
    __resetRefs();
    decideRise("h3", 0.50, 0.8, 0, "water");
    expect(decideRise("h3", 0.45, 0.8, 300_000, "water").shouldAlert).toBe(true);  // +5%
    expect(decideRise("h3", 0.44, 0.8, 600_000, "water").shouldAlert).toBe(false); // +6%, not a new step
    expect(decideRise("h3", 0.41, 0.8, 900_000, "water").shouldAlert).toBe(true);  // +9% = one more threshold
  });

  test("a slow 1%-per-sweep flood still alerts, and keeps escalating", () => {
    __resetRefs();
    decideRise("h4", 0.50, 0.8, 0, "water");
    const alerts: number[] = [];
    for (let i = 1; i <= 20; i++) {
      if (decideRise("h4", 0.50 - i * 0.01, 0.8, i * 300_000, "water").shouldAlert) alerts.push(i);
    }
    // First alert at the 4% crossing, then every further 4% of climb.
    expect(alerts).toEqual([4, 8, 12, 16, 20]);
  });

  test("water receding re-arms: the NEXT flood alerts on its first crossing", () => {
    __resetRefs();
    decideRise("h5", 0.50, 0.8, 0, "water");
    expect(decideRise("h5", 0.40, 0.8, 300_000, "water").shouldAlert).toBe(true);
    expect(decideRise("h5", 0.50, 0.8, 600_000, "water").rising).toBe(false); // receded
    expect(decideRise("h5", 0.40, 0.8, 900_000, "water").shouldAlert).toBe(true); // rose again
  });

  test("cameras re-arm independently", () => {
    __resetRefs();
    decideRise("a", 0.50, 0.8, 0, "water");
    decideRise("b", 0.50, 0.8, 0, "water");
    expect(decideRise("a", 0.40, 0.8, 300_000, "water").shouldAlert).toBe(true);
    expect(decideRise("b", 0.40, 0.8, 300_000, "water").shouldAlert).toBe(true);
    expect(decideRise("a", 0.40, 0.8, 600_000, "water").shouldAlert).toBe(false);
  });
});
