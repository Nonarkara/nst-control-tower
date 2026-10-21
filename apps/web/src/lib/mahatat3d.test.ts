import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { PolygonLayer } from "@deck.gl/layers";
import { mahatat3DLayer, MAHATAT_CENTER, CHEDI_HEIGHT_M, CHEDI_WIDTH_M } from "./mahatat3d";
import { BELL_PROFILE, SPIRE_PROFILE, latheMesh } from "./templeMesh";

describe("mapped Wat Mahathat reconstruction", () => {
  it("aligns to the aerial-checked chedi footprint rather than the nomination site reference", () => {
    expect(MAHATAT_CENTER.lat).toBeCloseTo(8.4109925, 6);
    expect(MAHATAT_CENTER.lng).toBeCloseTo(99.96619375, 6);
    const fc = JSON.parse(readFileSync(new URL("../../public/geo/nst/buildings.geojson", import.meta.url), "utf8"));
    const mapped = fc.features.find((f: { properties: { id: string } }) => f.properties.id === "way/774945305").geometry.coordinates[0].slice(0, -1) as number[][];
    expect(mapped.reduce((sum, p) => sum + p[1]!, 0) / mapped.length).toBeCloseTo(MAHATAT_CENTER.lat, 6);
    const b = fc.features.find((f: { properties: { id: string } }) => f.properties.id === "hand/mahatat-chedi").properties._bbox;
    expect((b[0] + b[2]) / 2).toBeCloseTo(MAHATAT_CENTER.lng, 6);
    expect((b[1] + b[3]) / 2).toBeCloseTo(MAHATAT_CENTER.lat, 6);
  });
  it("keeps the sourced56m height and28m plinth without invented outbuildings", () => {
    expect(CHEDI_HEIGHT_M).toBe(56); expect(CHEDI_WIDTH_M).toBe(28);
    const layers = mahatat3DLayer(true);
    expect(layers.filter(l => l instanceof SimpleMeshLayer)).toHaveLength(2);
    expect(layers.filter(l => l instanceof PolygonLayer)).toHaveLength(4);
    expect(layers.some(l => /mahatat-(hall|sat|prang)/.test(l.id))).toBe(false);
    expect(mahatat3DLayer(false)).toEqual([]);
  });
  it.each([{ profile: BELL_PROFILE }, { profile: SPIRE_PROFILE }])("creates finite, smoothly shaded, bounded geometry", ({ profile }) => {
    const mesh = latheMesh(profile);
    const pos = mesh.attributes.POSITION.value, normals = mesh.attributes.NORMAL.value;
    expect(pos.length).toBe(normals.length);
    expect(pos.length).toBeLessThan(20_000);
    expect(Array.from(pos).every(Number.isFinite)).toBe(true);
    expect(Math.max(...mesh.indices.value)).toBeLessThan(pos.length / 3);
    for (let i = 0; i < normals.length; i += 3) expect(Math.hypot(normals[i]!, normals[i + 1]!, normals[i + 2]!)).toBeCloseTo(1, 5);
  });
  it.each([1, 1.65])("applies vertical scale exactly once (%s)", scale => {
    const spire = mahatat3DLayer(true, scale).find(l => l.id === "mahatat-chedi-spire")!;
    const p = spire.props as unknown as { mesh: ReturnType<typeof latheMesh>; getScale: number[] };
    const positions = p.mesh.attributes.POSITION.value;
    const max = Math.max(...Array.from(positions).filter((_, i) => i % 3 === 2));
    expect(max * p.getScale[2]!).toBeCloseTo(56 * scale);
  });
});
