/**
 * mahatat3d — invariant tests.
 *
 * The 3D model of Wat Phra Mahathat is parametric (deck.gl stacked primitives,
 * no GLTF). These tests guard the geometry so the temple stays recognisable
 * on the live map. We test the EXPORTED behaviour of `mahatat3DLayer()`
 * rather than re-parsing the source file — that way a future tweak to the
 * model is allowed, but the architectural invariants hold.
 */

import { describe, it, expect } from "vitest";
import { ColumnLayer, PolygonLayer } from "@deck.gl/layers";
import { mahatat3DLayer, MAHATAT_CENTER } from "./mahatat3d";

describe("MAHATAT_CENTER", () => {
  it("is in NST Old Town (≈ 99.9638°E, 8.4367°N)", () => {
    expect(MAHATAT_CENTER.lng).toBeCloseTo(99.9638, 4);
    expect(MAHATAT_CENTER.lat).toBeCloseTo(8.4367, 4);
  });
});

describe("mahatat3DLayer() — disabled short-circuit", () => {
  it("returns [] when disabled (cheap render-skip)", () => {
    expect(mahatat3DLayer(false)).toEqual([]);
  });
});

describe("mahatat3DLayer() — enabled layer inventory", () => {
  const layers = mahatat3DLayer(true);
  const columns = layers.filter((l) => l instanceof ColumnLayer);
  const polygons = layers.filter((l) => l instanceof PolygonLayer);

  it("renders only the13dimensioned central chedi sections", () => {
    expect(layers.length).toBe(13);
    expect(columns.length).toBe(9);
    expect(polygons.length).toBe(4);
    expect(layers.every(l => l.id.startsWith("mahatat-chedi-"))).toBe(true);
  });

  it("every layer is either a ColumnLayer or a PolygonLayer (no leaked primitives)", () => {
    for (const l of layers) {
      expect(l instanceof ColumnLayer || l instanceof PolygonLayer).toBe(true);
    }
  });
});

describe("mahatat3DLayer() — layer ids", () => {
  const layers = mahatat3DLayer(true);

  it("every layer id starts with 'mahatat-' so it namespaces cleanly in the deck.gl layer tree", () => {
    for (const l of layers) {
      expect((l as { id?: string }).id?.startsWith("mahatat-")).toBe(true);
    }
  });

  it("the chedi stack has 13 unique base elevations (no two segments share a base)", () => {
    const chediIds = layers
      .map((l) => (l as { id?: string }).id ?? "")
      .filter((id) => id.startsWith("mahatat-chedi-"));
    expect(chediIds.length).toBe(13);
    expect(new Set(chediIds).size).toBe(13);
  });

  it("does not invent surrounding halls or satellite placements", () => {
    expect(layers.some(l => /mahatat-(sat|hall|prang)-/.test(l.id))).toBe(false);
  });
});

describe("mahatat3DLayer() — elevationScale", () => {
  it("returns the same total layer count regardless of scale", () => {
    // Scale only affects rendered height, not the layer list.
    expect(mahatat3DLayer(true, 1.0).length).toBe(mahatat3DLayer(true, 1.65).length);
    expect(mahatat3DLayer(true, 2.5).length).toBe(mahatat3DLayer(true, 1.0).length);
  });
});

describe("rendered segment bases, not just authored totals", () => {
  type Datum = { pos: number[]; ring: number[][]; h: number };
  for (const scale of [1, 1.65]) {
    it(`places the chedi's actual rendered summit at56m times${scale}`, () => {
      const segments = mahatat3DLayer(true, scale);
      const bounds = segments.map(layer => {
        const p = layer.props as unknown as { data: Datum[]; getPosition?: (d: Datum) => number[]; getPolygon?: (d: Datum) => number[][]; getElevation: (d: Datum) => number; elevationScale: number };
        const d = p.data[0]!;
        const base = p.getPosition ? p.getPosition(d)[2]! : p.getPolygon!(d)[0]![2]!;
        return { base, top: base + p.getElevation(d) * p.elevationScale };
      });
      expect(bounds).toHaveLength(13);
      expect(new Set(bounds.map(x => x.base)).size).toBe(13);
      expect(Math.max(...bounds.map(x => x.top))).toBeCloseTo(56 * scale, 5);
      for (let i = 1; i < bounds.length; i++) expect(bounds[i]!.base).toBeCloseTo(bounds[i - 1]!.top, 5);
    });
  }
});
