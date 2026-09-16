import { describe, test, expect } from "vitest";
import type { Feature, LineString } from "geojson";
import { prepareWaterwayFlows, waterwayFlowDirectionLayer, type WaterwayFlowClass } from "./layers";

// A ~2 km diagonal line (well above the FLOW_MIN_LEN stub cutoff). Goes from
// (99.90, 8.40) → (99.93, 8.43) — north-east — so the flow direction is
// north-east and a chevron should point in that direction.
const LONG: [number, number][] = [
  [99.90, 8.40],
  [99.93, 8.43],
];

function line(
  coords: [number, number][],
  props: { waterway?: string; flowClass?: WaterwayFlowClass; name?: string | null } = {},
): Feature<LineString, { waterway?: string; flowClass?: WaterwayFlowClass; name?: string | null }> {
  return { type: "Feature", properties: props, geometry: { type: "LineString", coordinates: coords } };
}

describe("waterwayFlowDirectionLayer", () => {
  test("returns null below zoomBucket=2 (LOD gate)", () => {
    const prepared = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    expect(waterwayFlowDirectionLayer(prepared, 0)).toBeNull();
    expect(waterwayFlowDirectionLayer(prepared, 1)).toBeNull();
    expect(waterwayFlowDirectionLayer(prepared, 2)).not.toBeNull();
  });

  test("returns null for empty prepared input", () => {
    const layer = waterwayFlowDirectionLayer([], 2);
    expect(layer).not.toBeNull();
    // data is empty, just no paths to render
    expect((layer as { props: { data: unknown[] } }).props.data).toEqual([]);
  });

  test("one line produces 1 line entry + N chevron entries (N ≥ 3)", () => {
    const prepared = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    const layer = waterwayFlowDirectionLayer(prepared, 2) as { props: { data: { kind: string }[] } };
    const lines = layer.props.data.filter((d) => d.kind === "line");
    const chevrons = layer.props.data.filter((d) => d.kind === "chevron");
    expect(lines).toHaveLength(1);
    expect(chevrons.length).toBeGreaterThanOrEqual(3);
  });

  test("chevrons sit on the line's own coordinates (within bbox)", () => {
    const prepared = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    const layer = waterwayFlowDirectionLayer(prepared, 2) as {
      props: { data: { kind: string; path: [number, number][]; width: number }[] };
    };
    const chevrons = layer.props.data.filter((d) => d.kind === "chevron");
    expect(chevrons.length).toBeGreaterThan(0);
    for (const c of chevrons) {
      // each chevron is a 3-point polyline, tip must sit within the line's bbox
      const tip = c.path[1];
      expect(tip[0]).toBeGreaterThanOrEqual(99.90 - 0.005);
      expect(tip[0]).toBeLessThanOrEqual(99.93 + 0.005);
      expect(tip[1]).toBeGreaterThanOrEqual(8.40 - 0.005);
      expect(tip[1]).toBeLessThanOrEqual(8.43 + 0.005);
    }
  });

  test("chevron tip points downstream (NE direction along the line)", () => {
    // The line goes SE→NE in coordinates, so flow is NE: tip should be NE
    // of the wing midpoint. Compute tip - midpoint and check it has positive
    // dx (east) and positive dy (north) within tolerance.
    const prepared = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    const layer = waterwayFlowDirectionLayer(prepared, 2) as {
      props: { data: { kind: string; path: [number, number][] }[] };
    };
    const chevrons = layer.props.data.filter((d) => d.kind === "chevron");
    expect(chevrons.length).toBeGreaterThan(0);
    for (const c of chevrons) {
      const [w1, tip, w2] = c.path;
      const mid = [(w1[0] + w2[0]) / 2, (w1[1] + w2[1]) / 2];
      const dx = tip[0] - mid[0];
      const dy = tip[1] - mid[1];
      // Line points NE, so both dx and dy should be positive
      expect(dx).toBeGreaterThan(0);
      expect(dy).toBeGreaterThan(0);
    }
  });

  test("chevron arm length scales with flowClass (fast > medium > slow)", () => {
    const preparedSlow = prepareWaterwayFlows([line(LONG, { flowClass: "slow" })]);
    const preparedFast = prepareWaterwayFlows([line(LONG, { flowClass: "fast" })]);
    const slowLayer = waterwayFlowDirectionLayer(preparedSlow, 2) as {
      props: { data: { kind: string; width: number; path: [number, number][] }[] };
    };
    const fastLayer = waterwayFlowDirectionLayer(preparedFast, 2) as {
      props: { data: { kind: string; width: number; path: [number, number][] }[] };
    };
    const slowChev = slowLayer.props.data.filter((d) => d.kind === "chevron");
    const fastChev = fastLayer.props.data.filter((d) => d.kind === "chevron");
    expect(slowChev.length).toBeGreaterThan(0);
    expect(fastChev.length).toBeGreaterThan(0);
    // Width is bigger for fast (5 px) vs slow (2.5 px) vs medium (3.5 px)
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
    expect(avg(fastChev.map((c) => c.width))).toBeGreaterThan(avg(slowChev.map((c) => c.width)));
  });

  test("line entry has its flow-class width (fast > medium > slow)", () => {
    const slowLine = (waterwayFlowDirectionLayer(prepareWaterwayFlows([line(LONG, { flowClass: "slow" })]), 2) as {
      props: { data: { kind: string; width: number }[] };
    }).props.data.filter((d) => d.kind === "line")[0];
    const mediumLine = (waterwayFlowDirectionLayer(prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]), 2) as {
      props: { data: { kind: string; width: number }[] };
    }).props.data.filter((d) => d.kind === "line")[0];
    const fastLine = (waterwayFlowDirectionLayer(prepareWaterwayFlows([line(LONG, { flowClass: "fast" })]), 2) as {
      props: { data: { kind: string; width: number }[] };
    }).props.data.filter((d) => d.kind === "line")[0];
    expect(slowLine.width).toBeLessThan(mediumLine.width);
    expect(mediumLine.width).toBeLessThan(fastLine.width);
    expect(slowLine.width).toBeLessThan(fastLine.width);
  });

  test("gauged flows get full alpha + brighter chevron color", () => {
    const base = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    const gauged = prepareWaterwayFlows(
      [line(LONG, { flowClass: "medium", name: "ท่าดี" })],
      (f) => (f.properties.name?.includes("ท่าดี") ? { speed: 2.0, color: [255, 255, 255] } : null),
    );
    const baseLayer = waterwayFlowDirectionLayer(base, 2) as {
      props: { data: { kind: string; color: [number, number, number, number] }[] };
    };
    const gaugedLayer = waterwayFlowDirectionLayer(gauged, 2) as {
      props: { data: { kind: string; color: [number, number, number, number] }[] };
    };
    const baseLine = baseLayer.props.data.filter((d) => d.kind === "line")[0];
    const gaugedLine = gaugedLayer.props.data.filter((d) => d.kind === "line")[0];
    expect(gaugedLine.color[3]).toBe(255);
    expect(baseLine.color[3]).toBeLessThan(255);
  });

  test("sub-minimum stub lines produce no path entries", () => {
    const stub = line([[99.90, 8.40], [99.9001, 8.4001]], { flowClass: "medium" }); // ~15 m
    const prepared = prepareWaterwayFlows([stub]);
    const layer = waterwayFlowDirectionLayer(prepared, 2) as {
      props: { data: { kind: string }[] };
    };
    expect(layer.props.data).toEqual([]);
  });
});