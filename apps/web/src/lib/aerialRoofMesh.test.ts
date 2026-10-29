import { describe, expect, it } from "vitest";
import { indexAerialRoofs, roofTriangles, type RoofTileBounds } from "./aerialRoofMesh";
import type { BuildingFeature } from "./buildingAppearance";
import { aerialRoofsLayer } from "../map/aerialRoofsLayer";

const feature: BuildingFeature = { type: "Feature", properties: {
  id: "mesh-test", building: "yes", name: null, nameTh: null, nameEn: null, levels: null, height: 6, operator: null,
}, geometry: { type: "Polygon", coordinates: [
  [[99.96,8.42],[99.9604,8.42],[99.9604,8.4204],[99.96,8.4204],[99.96,8.42]],
  [[99.9601,8.4201],[99.9601,8.4203],[99.9603,8.4203],[99.9603,8.4201],[99.9601,8.4201]],
] } };
const area = (a: number[], b: number[], c: number[]) => Math.abs((b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!)) / 2;

describe("aerial roof projection", () => {
  it("does not cover courtyard holes or replace height with imagery", () => {
    const triangles = roofTriangles(feature);
    expect(triangles.reduce((sum, t) => sum + area(...t), 0)).toBeCloseTo(.0004 ** 2 - .0002 ** 2, 14);
    expect(triangles.flat().every(p => Math.abs(p[2]! - 6.03) < 1e-8)).toBe(true);
  });
  it("clips across tile seams without adding or losing roof area", () => {
    const index = indexAerialRoofs([feature]);
    const bounds: RoofTileBounds[] = [[99.959,8.419,99.9602,8.421],[99.9602,8.419,99.962,8.421]];
    let total = 0;
    for (const b of bounds) {
      const {mesh} = index(b), positions = mesh.attributes.POSITION.value, uv = mesh.attributes.TEXCOORD_0.value;
      expect([...positions, ...uv].every(Number.isFinite)).toBe(true);
      expect([...uv].every(x => x >= -1e-6 && x <= 1.000001)).toBe(true);
      for (let i = 0; i < positions.length; i += 9) total += area(Array.from(positions.slice(i,i+3)),Array.from(positions.slice(i+3,i+6)),Array.from(positions.slice(i+6,i+9)));
    }
    const expected = (.0004 ** 2 - .0002 ** 2) * 111320 * Math.cos(8.42 * Math.PI / 180) * 110574;
    expect(total).toBeCloseTo(expected, 1);
  });
  it("keeps neutral roofs when a tile finishes without image content", () => {
    const layer = aerialRoofsLayer([feature]);
    expect(layer.props.renderSubLayers!({data: undefined} as never)).toBeNull();
  });
});
