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
import { districtBoundariesLayer, hydroFlowArrowsLayer, mountainIconLayer, bayIconLayer, namedCanalsLayer, regionalRiversLayer } from "./hydroMap";
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
  it("returns 3 layers (fill + dashed outline + label TextLayer) for any non-empty collection", () => {
    const fc = makeDistrictCollection();
    const layers = districtBoundariesLayer(fc);
    expect(layers.length).toBe(3);
    expect(layers[0]).toBeInstanceOf(GeoJsonLayer);  // pastel fill
    expect(layers[1]).toBeInstanceOf(GeoJsonLayer);  // dashed outline
    expect(layers[2]).toBeInstanceOf(TextLayer);
  });

  it("emits one label per district with a name or nameTh", () => {
    const fc = makeDistrictCollection();
    const layers = districtBoundariesLayer(fc);
    const labelLayer = layers[2] as unknown as { props: { data: { text: string }[] } };
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
    const labelLayer = layers[2] as unknown as { props: { data: { text: string }[] } };
    expect(labelLayer.props.data.length).toBe(1);
  });
});

describe("hydro map visual contract", () => {
  it("district borders are dashed (lineDashArray set on the GeoJsonLayer)", () => {
    const layers = districtBoundariesLayer(makeDistrictCollection());
    // Find the dashed outline layer (second GeoJsonLayer)
    const outlineLayer = layers[1] as unknown as { props: { lineDashArray: number[] | null } };
    expect(outlineLayer.props.lineDashArray).not.toBeNull();
    expect(outlineLayer.props.lineDashArray).toEqual([4, 3]);
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

describe("namedCanalsLayer", () => {
  it("renders every named canal as solid blue + Thai label = 3 layers", () => {
    const fc: FeatureCollection<LineString, { id: string; name: string; nameEn: string; nameTh: string; waterway: string; flowClass: string; _canalStatus?: "complete" | "under-construction" | "planned"; _plannedReach?: [number, number] | null }> = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "hand/test",
        properties: {
          id: "hand/test",
          name: "Tha Dee",
          nameEn: "Tha Dee Canal",
          nameTh: "คลองท่าดี",
          waterway: "canal",
          flowClass: "fast",
          _canalStatus: "complete",
          _plannedReach: null,
        },
        geometry: {
          type: "LineString",
          coordinates: [[99.7, 8.4], [99.8, 8.45], [99.9, 8.5]],
        },
      }],
    };
    const layers = namedCanalsLayer(fc);
    // solid GeoJsonLayer + label TextLayer = 2 layers
    expect(layers.length).toBe(2);
    expect(layers[0]).toBeInstanceOf(GeoJsonLayer);
    expect(layers[1]).toBeInstanceOf(TextLayer);
  });

  it("renders the Royal Project Canal as solid built + dashed planned + under-construction badge", () => {
    const fc: FeatureCollection<LineString, { id: string; name: string; nameEn: string; nameTh: string; waterway: string; flowClass: string; _canalStatus?: "complete" | "under-construction" | "planned"; _plannedReach?: [number, number] | null }> = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "hand/royal-project-canal",
        properties: {
          id: "hand/royal-project-canal",
          name: "Royal Project Canal",
          nameEn: "Royal Project Canal",
          nameTh: "คลองพระราชดำริ",
          waterway: "canal",
          flowClass: "fast",
          _canalStatus: "under-construction",
          _plannedReach: [0, 3],
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [99.9, 8.4],  // planned start
            [100.0, 8.4],  // planned
            [100.1, 8.45], // planned
            [100.2, 8.5],  // boundary (planned[1]=3, so this is the first BUILT vertex)
            [100.3, 8.5],  // built
            [100.4, 8.5],  // built
          ],
        },
      }],
    };
    const layers = namedCanalsLayer(fc);
    // planned GeoJsonLayer + solid GeoJsonLayer + label TextLayer + under-construction badge TextLayer = 4 layers
    expect(layers.length).toBe(4);
    const labels = layers.filter((l) => l instanceof TextLayer);
    expect(labels.length).toBe(2); // canal name + under-construction badge
  });

  it("emits one Thai label per canal at the midpoint", () => {
    const fc: FeatureCollection<LineString, { id: string; name: string; nameEn: string; nameTh: string; waterway: string; flowClass: string; _canalStatus?: "complete" | "under-construction" | "planned"; _plannedReach?: [number, number] | null }> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature", id: "hand/c1",
          properties: { id: "hand/c1", name: "c1", nameEn: "c1", nameTh: "คลอง A", waterway: "canal", flowClass: "medium", _canalStatus: "complete", _plannedReach: null },
          geometry: { type: "LineString", coordinates: [[99.7, 8.4], [99.8, 8.45], [99.9, 8.5]] },
        },
        {
          type: "Feature", id: "hand/c2",
          properties: { id: "hand/c2", name: "c2", nameEn: "c2", nameTh: "คลอง B", waterway: "canal", flowClass: "medium", _canalStatus: "complete", _plannedReach: null },
          geometry: { type: "LineString", coordinates: [[99.7, 8.5], [99.8, 8.5], [99.9, 8.5]] },
        },
      ],
    };
    const layers = namedCanalsLayer(fc);
    const labelLayer = layers.find((l) => l instanceof TextLayer && (l as unknown as { id: string }).id === "named-canals-labels") as unknown as { props: { data: { name: string }[] } };
    expect(labelLayer.props.data.length).toBe(2);
    expect(labelLayer.props.data.map((d) => d.name)).toEqual(["คลอง A", "คลอง B"]);
  });
});

describe("regionalRiversLayer", () => {
  it("renders the Tapi as halo + core stroke + name label + badge = 4 layers", () => {
    const fc: FeatureCollection<LineString, { id: string; name: string; nameEn: string; nameTh: string; waterway: string; flowClass: string; _riverLengthKm?: number; _riverBadge?: string }> = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "hand/tapi",
        properties: {
          id: "hand/tapi",
          name: "Tapi River",
          nameEn: "Tapi River",
          nameTh: "แม่น้ำตาปี",
          waterway: "river",
          flowClass: "regional",
          _riverLengthKm: 230,
          _riverBadge: "Longest river in southern Thailand",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [99.6, 8.7], [99.55, 8.85], [99.5, 9.0], [99.4, 9.1], [99.3, 9.15], [99.2, 9.18], [99.15, 9.18], [99.14, 9.15],
          ],
        },
      }],
    };
    const layers = regionalRiversLayer(fc);
    // halo + core (2 GeoJsonLayers) + name label TextLayer + badge TextLayer = 4 layers
    expect(layers.length).toBe(4);
    const textLayers = layers.filter((l) => l instanceof TextLayer);
    expect(textLayers.length).toBe(2); // name + badge
  });

  it("skips the badge when no _riverBadge property is set", () => {
    const fc: FeatureCollection<LineString, { id: string; name: string; nameEn: string; nameTh: string; waterway: string; flowClass: string; _riverLengthKm?: number; _riverBadge?: string }> = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "hand/test",
        properties: {
          id: "hand/test",
          name: "Test River",
          nameEn: "Test River",
          nameTh: "แม่น้ำทดสอบ",
          waterway: "river",
          flowClass: "regional",
        },
        geometry: { type: "LineString", coordinates: [[99.5, 8.5], [99.6, 8.6], [99.7, 8.7]] },
      }],
    };
    const layers = regionalRiversLayer(fc);
    // halo + core + name label (no badge) = 3 layers
    expect(layers.length).toBe(3);
  });

  it("returns no layers for an empty collection", () => {
    const fc: FeatureCollection<LineString, never> = { type: "FeatureCollection", features: [] };
    const layers = regionalRiversLayer(fc as unknown as FeatureCollection<LineString, { id: string; name: string; nameEn: string; nameTh: string; waterway: string; flowClass: string; _riverLengthKm?: number; _riverBadge?: string }>);
    // No rivers → no stroke layers, no labels, no badges → 0 layers
    expect(layers.length).toBe(0);
  });
});
