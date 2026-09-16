import { describe, expect, test } from "vitest";
import type { FeatureCollection, LineString } from "geojson";
import { isTrunkWaterway, stitchThaDeePath, THA_DEE_WAY_CHAIN, THA_DEE_WAY_IDS, type WaterwayFeature } from "./thaDee";

function way(id: string, coords: [number, number][], extra: Partial<WaterwayFeature["properties"]> = {}): WaterwayFeature {
  return {
    type: "Feature",
    properties: { id, waterway: "river", flowClass: "medium", lengthM: 1000, ...extra },
    geometry: { type: "LineString", coordinates: coords },
  };
}

function fc(features: WaterwayFeature[]): FeatureCollection<LineString, WaterwayFeature["properties"]> {
  return { type: "FeatureCollection", features: features as Feature[] } as unknown as FeatureCollection<LineString, WaterwayFeature["properties"]>;
}
type Feature = WaterwayFeature;

describe("stitchThaDeePath", () => {
  test("joins the chain upstream → city and re-orients ways drawn the wrong way", () => {
    // Way 1 flows A→B, way 2 is stored reversed (C→B) and must be flipped,
    // way 3 continues from C.
    const w1 = way(THA_DEE_WAY_CHAIN[0]!, [[99.70, 8.45], [99.78, 8.43]]);
    const w2 = way(THA_DEE_WAY_CHAIN[1]!, [[99.90, 8.40], [99.78, 8.43]]); // reversed
    const w3 = way(THA_DEE_WAY_CHAIN[2]!, [[99.90, 8.40], [99.95, 8.41]]);
    const path = stitchThaDeePath(fc([w3, w1, w2]));
    expect(path).toEqual([
      [99.70, 8.45], [99.78, 8.43], // w1
      [99.90, 8.40],                // w2 flipped, shared vertex de-duplicated
      [99.95, 8.41],                // w3, shared vertex de-duplicated
    ]);
  });

  test("tolerates a partial load — missing ways are skipped, not fatal", () => {
    const w1 = way(THA_DEE_WAY_CHAIN[0]!, [[99.70, 8.45], [99.78, 8.43]]);
    const w3 = way(THA_DEE_WAY_CHAIN[2]!, [[99.79, 8.43], [99.95, 8.41]]);
    const path = stitchThaDeePath(fc([w1, w3]));
    expect(path).toHaveLength(4);
    expect(path[0]).toEqual([99.70, 8.45]);
    expect(path[path.length - 1]).toEqual([99.95, 8.41]);
  });

  test("returns [] with no data and a single way's coords when only one is present", () => {
    expect(stitchThaDeePath(null)).toEqual([]);
    expect(stitchThaDeePath(fc([]))).toEqual([]);
    const only = way(THA_DEE_WAY_CHAIN[1]!, [[1, 1], [2, 2], [3, 3]]);
    expect(stitchThaDeePath(fc([only]))).toEqual([[1, 1], [2, 2], [3, 3]]);
  });
});

describe("isTrunkWaterway", () => {
  test("Tha Dee ways, named rivers, fast reaches and long rivers are trunk; short unnamed stubs are not", () => {
    expect(isTrunkWaterway(way(THA_DEE_WAY_CHAIN[3]!, [[0, 0], [1, 1]], { lengthM: 500 }))).toBe(true);
    expect(isTrunkWaterway(way("way/1", [[0, 0], [1, 1]], { name: "แม่น้ำตาปี", lengthM: 500 }))).toBe(true);
    expect(isTrunkWaterway(way("way/2", [[0, 0], [1, 1]], { flowClass: "fast", lengthM: 500 }))).toBe(true);
    // Province scale is stricter: fast-but-short reaches and 9 km rivers drop out.
    expect(isTrunkWaterway(way("way/2", [[0, 0], [1, 1]], { flowClass: "fast", lengthM: 500 }), 0)).toBe(false);
    expect(isTrunkWaterway(way("way/3", [[0, 0], [1, 1]], { lengthM: 13000 }), 0)).toBe(false);
    expect(isTrunkWaterway(way("way/3", [[0, 0], [1, 1]], { lengthM: 25000 }), 0)).toBe(true);
    expect(isTrunkWaterway(way("way/3", [[0, 0], [1, 1]], { lengthM: 12000 }))).toBe(true);
    expect(isTrunkWaterway(way("way/4", [[0, 0], [1, 1]], { lengthM: 12000, waterway: "ditch" }))).toBe(false);
    expect(isTrunkWaterway(way("way/5", [[0, 0], [1, 1]], { lengthM: 900, name: " " }))).toBe(false);
  });

  test("chain and id set agree", () => {
    expect(THA_DEE_WAY_IDS.size).toBe(THA_DEE_WAY_CHAIN.length);
    for (const id of THA_DEE_WAY_CHAIN) expect(THA_DEE_WAY_IDS.has(id)).toBe(true);
  });
});
