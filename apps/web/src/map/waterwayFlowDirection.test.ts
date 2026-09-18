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
  type Arrow = { position: [number, number]; angle: number; size: number; color: [number, number, number, number] };
  type PathEntry = { kind: string; width: number; color: [number, number, number, number] };
  const parts = (prepared: ReturnType<typeof prepareWaterwayFlows>) => {
    const layers = waterwayFlowDirectionLayer(prepared, 2) as unknown as Array<{ id: string; props: { data: unknown[]; sizeUnits?: string } }>;
    const lines = layers.find((l) => l.id === "waterway-flow-direction")!;
    const arrows = layers.find((l) => l.id === "waterway-flow-arrows")!;
    return { lineData: lines.props.data as PathEntry[], arrows, arrowData: arrows.props.data as Arrow[] };
  };

  test("returns null below zoomBucket=2 (LOD gate) unless overview", () => {
    const prepared = prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]);
    expect(waterwayFlowDirectionLayer(prepared, 0)).toBeNull();
    expect(waterwayFlowDirectionLayer(prepared, 1)).toBeNull();
    expect(waterwayFlowDirectionLayer(prepared, 0, { overview: true })).not.toBeNull();
    expect(waterwayFlowDirectionLayer(prepared, 2)).not.toBeNull();
  });

  test("empty input still yields (empty) line + arrow layers", () => {
    const { lineData, arrowData } = parts([]);
    expect(lineData).toEqual([]);
    expect(arrowData).toEqual([]);
  });

  test("one line → one path and ≥ 3 arrows", () => {
    const { lineData, arrowData } = parts(prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]));
    expect(lineData).toHaveLength(1);
    expect(arrowData.length).toBeGreaterThanOrEqual(3);
  });

  test("arrows are a fixed screen size (pixels), small enough not to bury the river", () => {
    const { arrows, arrowData } = parts(prepareWaterwayFlows([line(LONG, { flowClass: "fast" })]));
    expect(arrows.props.sizeUnits).toBe("pixels");
    expect(arrowData.length).toBeGreaterThan(0);
    for (const a of arrowData) {
      expect(a.size).toBeGreaterThanOrEqual(8);
      expect(a.size).toBeLessThanOrEqual(16);
    }
  });

  test("arrows sit on the line and point downstream (NE)", () => {
    const { arrowData } = parts(prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]));
    for (const a of arrowData) {
      expect(a.position[0]).toBeGreaterThanOrEqual(99.90 - 0.005);
      expect(a.position[0]).toBeLessThanOrEqual(99.93 + 0.005);
      expect(a.position[1]).toBeGreaterThanOrEqual(8.40 - 0.005);
      expect(a.position[1]).toBeLessThanOrEqual(8.43 + 0.005);
      expect(a.angle).toBeGreaterThan(0);   // NE: between east (0°)…
      expect(a.angle).toBeLessThan(90);     // …and north (90°)
    }
  });

  test("fast rivers get bigger arrows and wider lines than slow ones", () => {
    const slow = parts(prepareWaterwayFlows([line(LONG, { flowClass: "slow" })]));
    const fast = parts(prepareWaterwayFlows([line(LONG, { flowClass: "fast" })]));
    expect(fast.arrowData[0]!.size).toBeGreaterThan(slow.arrowData[0]!.size);
    expect(fast.lineData[0]!.width).toBeGreaterThan(slow.lineData[0]!.width);
  });

  test("gauged flows get full alpha", () => {
    const base = parts(prepareWaterwayFlows([line(LONG, { flowClass: "medium" })]));
    const gauged = parts(prepareWaterwayFlows(
      [line(LONG, { flowClass: "medium", name: "ท่าดี" })],
      (f) => (f.properties.name?.includes("ท่าดี") ? { speed: 2.0, color: [255, 255, 255] } : null),
    ));
    expect(gauged.lineData[0]!.color[3]).toBe(255);
    expect(base.lineData[0]!.color[3]).toBeLessThan(255);
    expect(gauged.arrowData[0]!.color[3]).toBe(255);
  });

  test("sub-minimum stub lines produce no paths or arrows", () => {
    const stub = line([[99.90, 8.40], [99.9001, 8.4001]], { flowClass: "medium" }); // ~15 m
    const { lineData, arrowData } = parts(prepareWaterwayFlows([stub]));
    expect(lineData).toEqual([]);
    expect(arrowData).toEqual([]);
  });
});
