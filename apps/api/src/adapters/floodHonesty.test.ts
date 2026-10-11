import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { NST_CANAL_GLOFAS_THRESHOLDS } from "./flood";

/**
 * The flood panel's honesty under flood conditions.
 *
 * This file exists because of what the GloFAS fallback branch used to render:
 *
 *     <StatusValue level={...}>{worstGauge.status.toUpperCase()}</StatusValue>
 *     {worstGauge.name} · {fmt(worstGauge.levelM, 2, " m")}
 *
 * A red, unqualified **FLOOD**, followed by a water level formatted to two
 * decimals **in metres** — against `levelM`, which GloFAS never populates and
 * which is therefore always null. The number beside it was a river *discharge*
 * in m³/s. To anyone who did not open the API that is a measured river height,
 * and it appeared precisely when the real telemetry had failed and the reader
 * most needed to know what they were looking at.
 *
 * Three separate obligations are pinned here, because they fail independently:
 * the field type, the adapter actually populating it, and the panel refusing to
 * print a metre it does not have.
 */

describe("the rising signal is on the wire", () => {
  it("the adapter populates the forecast peak rather than computing and discarding it", () => {
    // peakDischarge() existed and was never called. The adapter knew the river
    // was about to get several times worse and the panel could not say so.
    const adapter = readFileSync(new URL("./flood.ts", import.meta.url), "utf8");
    expect(adapter).toMatch(/forecastPeakCms:\s*peakDischarge\(/);
  });

  it("both fallback gauges carry it", () => {
    const adapter = readFileSync(new URL("./flood.ts", import.meta.url), "utf8");
    expect(adapter.match(/forecastPeakCms:/g)?.length).toBe(2);
  });

  it("marks the records as modelled so a consumer can tell", () => {
    const adapter = readFileSync(new URL("./flood.ts", import.meta.url), "utf8");
    expect(adapter.match(/modelled:\s*true/g)?.length).toBe(2);
  });
});

describe("the thresholds the model status is derived from", () => {
  it("stay ordered watch < warning < emergency", () => {
    const t = NST_CANAL_GLOFAS_THRESHOLDS;
    expect(t.watch).toBeLessThan(t.warning);
    expect(t.warning).toBeLessThan(t.emergency);
  });

  it("are multiples of 5 so a float comparison cannot miss the boundary", () => {
    for (const v of Object.values(NST_CANAL_GLOFAS_THRESHOLDS)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v % 5).toBe(0);
    }
  });

  it("keep a real baseline below the watch threshold, so watch is reachable", () => {
    // The comment records an observed baseline of ~6–8 m³/s. If watch sat at or
    // below that, the panel would sit permanently in watch and stop meaning
    // anything.
    expect(NST_CANAL_GLOFAS_THRESHOLDS.watch).toBeGreaterThan(8);
  });
});
