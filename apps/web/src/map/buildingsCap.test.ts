/**
 * capUntaggedFor3D — invariant tests.
 *
 * The 3D buildings layer drops most of the OSM "untagged" (`building=yes`
 * with no amenity / name / height) low-rise footprints so the deck.gl layer
 * stays performant. The cap used to be 30% — too aggressive, the city
 * rendered as "landmarks floating on a flat plain". Lifted to 70% so the
 * residential block pattern stays visible as texture under the landmarks.
 *
 * Landmarks (mnType), named, classified (residential/commercial/etc), and
 * ≥20 m buildings are NEVER dropped — only the anonymous untagged low-rise.
 */

import { describe, it, expect } from "vitest";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { capUntaggedFor3D } from "./layers";
import type { BuildingProperties } from "../lib/building";

function f(id: string, overrides: Partial<BuildingProperties> & { _elevM?: number } = {}): Feature<Polygon, BuildingProperties> {
  return {
    type: "Feature",
    id,
    properties: {
      id,
      name: null,
      nameEn: null,
      nameTh: null,
      building: "yes",
      levels: null,
      height: null,
      operator: null,
      amenity: null,
      tourism: null,
      religion: null,
      office: null,
      healthcare: null,
      shop: null,
      source: null,
      ...overrides,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[[0, 0], [0, 0.001], [0.001, 0.001], [0.001, 0], [0, 0]]],
    },
  };
}

describe("capUntaggedFor3D", () => {
  it("keeps every landmark (mnType set)", () => {
    const feats = [
      f("a", { mnType: "temple" }),
      f("b", { mnType: "hospital" }),
      f("c", { mnType: "school" }),
    ];
    expect(capUntaggedFor3D(feats).length).toBe(3);
  });

  it("keeps every named building", () => {
    const feats = [f("a", { name: "X" }), f("b", { name: "Y" })];
    expect(capUntaggedFor3D(feats).length).toBe(2);
  });

  it("keeps every ≥20 m building", () => {
    const feats = [
      f("a", { _elevM: 20 }),
      f("b", { _elevM: 25 }),
      f("c", { _elevM: 100 }),
    ];
    expect(capUntaggedFor3D(feats).length).toBe(3);
  });

  it("keeps every building classified by OSM tags (residential/commercial/etc)", () => {
    const feats = [
      f("a", { building: "residential" }),
      f("b", { building: "house" }),
      f("c", { building: "commercial" }),
      f("d", { building: "retail" }),
      // The Mahatat chedi is hand-tagged mnType:temple — kept via the landmark
      // branch above, not here. But we also test that hand-tagged building=temple
      // gets kept via the classifier.
      f("e", { building: "temple" }),
    ];
    expect(capUntaggedFor3D(feats).length).toBe(5);
  });

  it("keeps 70% of anonymous untagged low-rise (was 30%, lifted for fabric visibility)", () => {
    const feats = Array.from({ length: 1000 }, (_, i) => f(`untagged-${i.toString().padStart(5, "0")}`));
    const survivors = capUntaggedFor3D(feats);
    expect(survivors.length).toBe(700); // floor(1000 * 0.7)
  });

  it("drops are by stable alphabetical id order (deterministic across runs)", () => {
    const feats = Array.from({ length: 100 }, (_, i) => f(`id-${i.toString().padStart(3, "0")}`));
    const a = capUntaggedFor3D(feats).map((f) => f.properties.id);
    const b = capUntaggedFor3D(feats).map((f) => f.properties.id);
    expect(a).toEqual(b);
    // The first 70 are the alphabetical prefix
    expect(a[0]).toBe("id-000");
    expect(a[69]).toBe("id-069");
  });

  it("never drops a landmark even if it sits in the cap range", () => {
    // 100 untagged + 1 landmark scattered through the id-space.
    const feats: Feature<Polygon, BuildingProperties>[] = [];
    for (let i = 0; i < 50; i++) feats.push(f(`untagged-${i.toString().padStart(3, "0")}`));
    feats.push(f("landmark-XYZ", { mnType: "temple" }));
    for (let i = 50; i < 100; i++) feats.push(f(`untagged-${i.toString().padStart(3, "0")}`));
    const survivors = capUntaggedFor3D(feats);
    expect(survivors.find((s) => s.properties.id === "landmark-XYZ")).toBeDefined();
  });
});

// Silence "unused type import" — FeatureCollection is referenced by JSDoc.
export type _Unused = FeatureCollection;
