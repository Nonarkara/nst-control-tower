import { describe, test, expect } from "vitest";
import type { Feature, LineString } from "geojson";
import { prepareWaterwayFlows, waterwayFlowDots, type WaterwayFlowClass } from "./layers";

function line(
  coords: [number, number][],
  props: { waterway?: string; flowClass?: WaterwayFlowClass; name?: string | null } = {},
): Feature<LineString, { waterway?: string; flowClass?: WaterwayFlowClass; name?: string | null }> {
  return { type: "Feature", properties: props, geometry: { type: "LineString", coordinates: coords } };
}

// A ~2 km diagonal line (well above the FLOW_MIN_LEN stub cutoff).
const LONG: [number, number][] = [
  [99.90, 8.40],
  [99.93, 8.43],
];

describe("prepareWaterwayFlows", () => {
  test("skips sub-minimum stubs, keeps real lines", () => {
    const prepared = prepareWaterwayFlows([
      line(LONG, { flowClass: "medium" }),
      line([[99.90, 8.40], [99.9001, 8.4001]], { flowClass: "fast" }), // ~15 m stub
    ]);
    expect(prepared).toHaveLength(1);
  });

  test("faster class → shorter cycle (dots move quicker) for the same geometry", () => {
    const [slow] = prepareWaterwayFlows([line(LONG, { flowClass: "slow" })]);
    const [fast] = prepareWaterwayFlows([line(LONG, { flowClass: "fast" })]);
    expect(fast.cycleMs).toBeLessThan(slow.cycleMs);
  });

  test("class drives dot color: slow bluer, fast near-white", () => {
    const [slow] = prepareWaterwayFlows([line(LONG, { flowClass: "slow" })]);
    const [fast] = prepareWaterwayFlows([line(LONG, { flowClass: "fast" })]);
    // fast is near-white → higher red channel than deep-blue slow
    expect(fast.color[0]).toBeGreaterThan(slow.color[0]);
  });

  test("gauge override replaces speed + color and flags gauged", () => {
    const [g] = prepareWaterwayFlows(
      [line(LONG, { flowClass: "slow", name: "คลองท่าดี" })],
      (f) => (f.properties.name?.includes("ท่าดี") ? { speed: 2.2, color: [255, 0, 0] } : null),
    );
    expect(g.gauged).toBe(true);
    expect(g.color).toEqual([255, 0, 0]);
    // higher speed than the base slow → shorter cycle
    const [base] = prepareWaterwayFlows([line(LONG, { flowClass: "slow" })]);
    expect(g.cycleMs).toBeLessThan(base.cycleMs);
  });

  test("defaults missing flowClass to medium", () => {
    const [p] = prepareWaterwayFlows([line(LONG, {})]);
    expect(p.dotCount).toBeGreaterThanOrEqual(1);
    expect(p.cycleMs).toBeGreaterThan(0);
  });
});

describe("waterwayFlowDots", () => {
  test("emits dotCount dots per line, advancing with the clock", () => {
    const prepared = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    const totalDots = prepared.reduce((n, l) => n + l.dotCount, 0);
    const t0 = waterwayFlowDots(prepared, 0);
    const t1 = waterwayFlowDots(prepared, 500);
    expect(t0).toHaveLength(totalDots);
    expect(t1).toHaveLength(totalDots);
    // At least one dot moved between the two frames.
    const moved = t0.some((d, i) => d.position[0] !== t1[i].position[0] || d.position[1] !== t1[i].position[1]);
    expect(moved).toBe(true);
  });

  test("dots ride the line's own coordinates (downhill node order)", () => {
    const prepared = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    const dots = waterwayFlowDots(prepared, 0);
    for (const d of dots) {
      expect(d.position[0]).toBeGreaterThanOrEqual(99.90 - 1e-6);
      expect(d.position[0]).toBeLessThanOrEqual(99.93 + 1e-6);
    }
  });

  test("empty prepared → no dots", () => {
    expect(waterwayFlowDots([], 1000)).toHaveLength(0);
  });
});
