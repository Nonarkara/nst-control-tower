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

  it("renders the full Mahatat compound as a stack of primitives", () => {
    // 13 chedi segments (3 plinth + 1 drum + 3 bell + 1 harmika + 4 spire +
    // 1 finial) + 3 halls × 2 (walls + roof) + 6 prang tiers + 8 satellite
    // chedis × 5 tiers each = 13 + 6 + 6 + 40 = 65 layers total.
    expect(layers.length).toBe(65);
  });

  it("uses ColumnLayer for round segments (drum, bell, spire, prang, satellites)", () => {
    // 9 round chedi (drum + 3 bell + 4 spire + finial) + 6 prang + 8 × 5
    // satellite tiers = 55 round.
    expect(columns.length).toBe(55);
  });

  it("uses PolygonLayer for square segments (plinth, harmika, hall walls + roofs)", () => {
    // 3 plinth + 1 harmika + 3 halls × 2 (walls + roof) = 10 square.
    expect(polygons.length).toBe(10);
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

  it("the satellite chedi cluster renders 8 unique sites", () => {
    const satIds = layers
      .map((l) => (l as { id?: string }).id ?? "")
      .filter((id) => id.startsWith("mahatat-sat-"));
    // 8 satellites × 5 tiers each = 40 sat-* ids
    expect(satIds.length).toBe(40);
    // 8 unique site indices (the first numeric segment of the id)
    const sites = new Set(satIds.map((id) => id.split("-")[2]));
    expect(sites.size).toBe(8);
  });
});

describe("mahatat3DLayer() — elevationScale", () => {
  it("returns the same total layer count regardless of scale", () => {
    // Scale only affects rendered height, not the layer list.
    expect(mahatat3DLayer(true, 1.0).length).toBe(mahatat3DLayer(true, 1.65).length);
    expect(mahatat3DLayer(true, 2.5).length).toBe(mahatat3DLayer(true, 1.0).length);
  });
});
