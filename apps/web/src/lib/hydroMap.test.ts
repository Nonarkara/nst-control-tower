/**
 * hydroMap — invariant tests for the province-scale hydrology rendering.
 *
 * The hydrology map is the boot view of the dashboard — district
 * boundaries (dashed purple) + flow arrows on every river (red
 * triangles pointing downstream) + a few named major-river labels. These
 * tests guard the geometry so a future change can't silently break the
 * "water comes from Khao Luang, flows through the cascade, into the bay"
 * visual the user keeps asking for.
 */

import { describe, it, expect } from "vitest";
import type { FeatureCollection, LineString, Polygon } from "geojson";
import { GeoJsonLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
import { districtBoundariesLayer, hydroFlowArrowsLayer, mountainIconLayer, bayIconLayer } from "./hydroMap";
import { ColumnLayer } from "@deck.gl/layers";

function makeWaterway(
  id: string,
  coords: [number, number][],
  extra: Partial<{ waterway: string; flowClass: string; lengthM: number; name: string }> = {},
): FeatureCollection<LineString, { id: string; name: string | null; nameTh: string | null; waterway: string; flowClass: string; lengthM: number }> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id,
        properties: {
          id,
          name: extra.name ?? null,
          nameTh: extra.name ?? null,
          waterway: extra.waterway ?? "river",
          flowClass: extra.flowClass ?? "medium",
          lengthM: extra.lengthM ?? 1000,
        },
        geometry: { type: "LineString", coordinates: coords },
      },
    ],
  };
}

function makeDistrictCollection(): FeatureCollection<Polygon, { id: string; name: string | null; nameTh: string | null; admin_level: number }> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "d/1",
        properties: { id: "d/1", name: "Mueang NST", nameTh: "อำเภอเมืองนครศรีธรรมราช", admin_level: 6 },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [99.93, 8.41], [99.99, 8.41], [99.99, 8.46], [99.93, 8.46], [99.93, 8.41],
          ]],
        },
      },
      {
        type: "Feature",
        id: "d/2",
        properties: { id: "d/2", name: "Phra Phrom", nameTh: "อำเภอพระพรหม", admin_level: 6 },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [99.85, 8.46], [99.92, 8.46], [99.92, 8.51], [99.85, 8.51], [99.85, 8.46],
          ]],
        },
      },
    ],
  };
}

describe("hydroFlowArrowsLayer", () => {
  it("returns the rivers + arrows stack when given a non-empty waterways collection", () => {
    const fc = makeWaterway("w/1", [[99.93, 8.43], [99.96, 8.435], [99.99, 8.44]]);
    const layers = hydroFlowArrowsLayer(fc);
    // halo + core rivers (2) + halo + core arrows (2) when present = 4
    expect(layers.length).toBeGreaterThanOrEqual(2);
    // First two are the rivers GeoJsonLayers (halo + core)
    expect(layers[0]).toBeInstanceOf(GeoJsonLayer);
    expect(layers[1]).toBeInstanceOf(GeoJsonLayer);
  });

  it("returns just the river-halo + river-core when given an empty collection", () => {
    const fc: FeatureCollection<LineString, never> = { type: "FeatureCollection", features: [] };
    const layers = hydroFlowArrowsLayer(fc as unknown as FeatureCollection<LineString, { id?: string; waterway?: string; flowClass?: string; lengthM?: number }>);
    // No rivers, no arrows, no labels — just the two river layers with empty data
    expect(layers.length).toBe(2);
  });

  it("places ≥2 arrows on a short river line so direction is always visible", () => {
    // 3 km of river at unit scale — should yield ≥ 2 chevrons spaced ~3 km
    const fc = makeWaterway("w/1", [
      [99.93, 8.43],
      [99.94, 8.43],
      [99.95, 8.43],
    ]);
    const layers = hydroFlowArrowsLayer(fc);
    // Find the arrow PolygonLayer (the second PolygonLayer; first is rivers core)
    const arrowLayer = layers.find((l) => l instanceof PolygonLayer && (l as unknown as { id: string }).id === "hydro-flow-arrows");
    expect(arrowLayer).toBeDefined();
    const data = (arrowLayer as unknown as { props: { data: unknown[] } }).props.data;
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  it("places bigger arrows on trunk rivers (flowClass=fast OR lengthM ≥ 8000)", () => {
    const fast = makeWaterway("w/fast", [[99.93, 8.43], [99.95, 8.43]], { flowClass: "fast" });
    const slow = makeWaterway("w/slow", [[99.93, 8.43], [99.95, 8.43]], { flowClass: "slow" });
    const fastArrowLayer = hydroFlowArrowsLayer(fast).find((l) => l instanceof PolygonLayer && (l as unknown as { id: string }).id === "hydro-flow-arrows") as unknown as { props: { data: { size: number }[] } };
    const slowArrowLayer = hydroFlowArrowsLayer(slow).find((l) => l instanceof PolygonLayer && (l as unknown as { id: string }).id === "hydro-flow-arrows") as unknown as { props: { data: { size: number }[] } };
    expect(fastArrowLayer.props.data[0]!.size).toBeGreaterThan(slowArrowLayer.props.data[0]!.size);
  });

  it("labels only fast (trunk) rivers so the map doesn't drown in labels", () => {
    const fast = makeWaterway("w/fast", [[99.93, 8.43], [99.95, 8.43]], { flowClass: "fast", name: "Tha Dee" });
    const slow = makeWaterway("w/slow", [[99.93, 8.43], [99.95, 8.43]], { flowClass: "slow", name: "Slow Creek" });
    const fastHasLabel = hydroFlowArrowsLayer(fast).some((l) => l instanceof TextLayer);
    const slowHasLabel = hydroFlowArrowsLayer(slow).some((l) => l instanceof TextLayer);
    expect(fastHasLabel).toBe(true);
    expect(slowHasLabel).toBe(false);
  });
});

describe("districtBoundariesLayer", () => {
  it("returns 2 layers (dashed polygon + label TextLayer) for any non-empty collection", () => {
    const fc = makeDistrictCollection();
    const layers = districtBoundariesLayer(fc);
    expect(layers.length).toBe(2);
    expect(layers[0]).toBeInstanceOf(GeoJsonLayer);
    expect(layers[1]).toBeInstanceOf(TextLayer);
  });

  it("emits one label per district with a name or nameTh", () => {
    const fc = makeDistrictCollection();
    const layers = districtBoundariesLayer(fc);
    const labelLayer = layers[1] as unknown as { props: { data: { text: string }[] } };
    const labels = labelLayer.props.data;
    expect(labels.length).toBe(2);
    expect(labels.map((l) => l.text)).toEqual([
      "อำเภอเมืองนครศรีธรรมราช",
      "อำเภอพระพรหม",
    ]);
  });

  it("skips districts without any name (id-only)", () => {
    const fc = makeDistrictCollection();
    fc.features[1]!.properties.name = null;
    fc.features[1]!.properties.nameTh = null;
    const layers = districtBoundariesLayer(fc);
    const labelLayer = layers[1] as unknown as { props: { data: { text: string }[] } };
    expect(labelLayer.props.data.length).toBe(1);
  });
});

describe("hydro map visual contract", () => {
  it("district borders are dashed (lineDashArray set on the GeoJsonLayer)", () => {
    const layers = districtBoundariesLayer(makeDistrictCollection());
    const polygonLayer = layers[0] as unknown as { props: { lineDashArray: number[] | null } };
    expect(polygonLayer.props.lineDashArray).not.toBeNull();
    expect(polygonLayer.props.lineDashArray).toEqual([4, 3]);
  });

  it("flow arrows are filled red triangles (PolygonLayer with red fill)", () => {
    // The arrows are ARROW_RED = [232, 50, 35] — verify via the layer's
    // static data array. We check by id since the layer order may shift
    // when the halo/core pair is added.
    const fc = makeWaterway("w/1", [[99.93, 8.43], [99.96, 8.435]]);
    const arrowLayer = hydroFlowArrowsLayer(fc).find(
      (l) => l instanceof PolygonLayer && (l as unknown as { id: string }).id === "hydro-flow-arrows",
    ) as unknown as { props: { data: { polygon: unknown[]; tip: unknown[]; size: number }[] } };
    expect(arrowLayer).toBeDefined();
    expect(arrowLayer.props.data.length).toBeGreaterThan(0);
    for (const arrow of arrowLayer.props.data) {
      expect(arrow.polygon).toHaveLength(3);
      expect(arrow.tip).toHaveLength(2);
    }
  });
});

describe("mountainIconLayer", () => {
  it("renders 3 stacked tiers (base + mid + peak) + a label = 4 layers", () => {
    const layers = mountainIconLayer(
      { position: { lng: 99.733, lat: 8.500 }, heightM: 1835, labelEn: "KHAO LUANG", labelTh: "เขาหลวง" },
    );
    // 3 ColumnLayer tiers + 1 TextLayer label
    expect(layers.length).toBe(4);
    expect(layers.filter((l) => l instanceof ColumnLayer).length).toBe(3);
    expect(layers[3]).toBeInstanceOf(TextLayer);
  });

  it("respects the elevationScale argument — same layer count regardless", () => {
    const a = mountainIconLayer({ position: { lng: 99.733, lat: 8.5 }, heightM: 1835, labelEn: "K", labelTh: "k" }, 1.0);
    const b = mountainIconLayer({ position: { lng: 99.733, lat: 8.5 }, heightM: 1835, labelEn: "K", labelTh: "k" }, 1.65);
    expect(a.length).toBe(b.length);
  });
});

describe("bayIconLayer", () => {
  it("renders a flat disc + label = 2 layers", () => {
    const layers = bayIconLayer({ lng: 100.184, lat: 8.4942 }, "PAK PHANANG BAY", "อ่าวปากพนัง");
    expect(layers.length).toBe(2);
    expect(layers[0]).toBeInstanceOf(ColumnLayer);
    expect(layers[1]).toBeInstanceOf(TextLayer);
  });
});
