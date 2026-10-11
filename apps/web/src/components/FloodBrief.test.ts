import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The flood panel must not invent a measurement when it has none.
 *
 * The GloFAS fallback branch of FloodBrief used to render:
 *
 *     <StatusValue level={...}>{worstGauge.status.toUpperCase()}</StatusValue>
 *     {worstGauge.name} · {fmt(worstGauge.levelM, 2, " m")}
 *
 * A red, unqualified **FLOOD** followed by a water level to two decimals **in
 * metres** — against `levelM`, which GloFAS never populates and which is
 * therefore always null. The number that produced the status was a river
 * *discharge* in m³/s.
 *
 * This branch only renders when the real ThaiWater telemetry has FAILED, which
 * is the worst possible moment to show a confident, unqualified, wrong-unit
 * number. That is the whole reason these guards exist.
 */

const brief = readFileSync(new URL("./FloodBrief.tsx", import.meta.url), "utf8");

/** The fallback branch only — not the ThaiWater branch, which has real levels. */
function fallbackBranch(): string {
  const start = brief.indexOf("worstGauge ? (");
  expect(start, "the GloFAS fallback branch disappeared from FloodBrief").toBeGreaterThan(-1);
  return brief.slice(start, start + 2000);
}

describe("the model feed never presents a modelled discharge as a measured level", () => {
  it("does not print a water level in metres", () => {
    // The exact defect. levelM is null on this feed by construction, so a
    // fmt(levelM, 2, " m") is a fabricated measurement even when it renders
    // as a dash rather than a number.
    expect(fallbackBranch()).not.toMatch(/fmt\(\s*worstGauge\.levelM/);
  });

  it("marks the status word as a model", () => {
    expect(fallbackBranch()).toMatch(/\(MODEL\)/);
  });

  it("states in words that it is not a measured level", () => {
    expect(fallbackBranch()).toMatch(/Not a measured water level/);
  });

  it("uses m³/s — the unit a discharge is actually in", () => {
    expect(fallbackBranch()).toMatch(/m³\/s/);
    // And nothing in this branch may reintroduce the metre unit.
    expect(fallbackBranch()).not.toMatch(/worstGauge\.levelM/);
  });

  it("says the real telemetry is offline instead of implying coverage", () => {
    expect(fallbackBranch()).toMatch(/Real gauge telemetry is offline/);
  });

  it("says NO MODEL DATA rather than a status word when the model returned nothing", () => {
    // `unknown` is a real status in the union. Rendering it as "UNKNOWN" in red
    // implies a broken sensor; it means there is no model output at all.
    expect(fallbackBranch()).toMatch(/NO MODEL DATA/);
  });
});

describe("the panel tells the reader which way the river is going", () => {
  it("shows the forecast peak beside the current discharge", () => {
    // peakDischarge() computed the model's 7-day peak and was never called, so
    // the panel could not say the river was about to get worse — in the exact
    // week it was forecast to roughly triple.
    expect(fallbackBranch()).toMatch(/forecastPeakCms/);
    expect(fallbackBranch()).toMatch(/forecast peak/i);
  });

  it("handles a missing forecast without printing a number", () => {
    expect(fallbackBranch()).toMatch(/discharge unavailable/);
  });
});

describe("the ThaiWater branch keeps its real units", () => {
  it("still shows measured levels in m MSL", () => {
    // The other branch has real telemetry and real levels. These guards are
    // scoped to the fallback on purpose: over-applying them would push us into
    // deleting a correct reading.
    expect(brief).toMatch(/toFixed\(2\)\} m MSL/);
  });
});