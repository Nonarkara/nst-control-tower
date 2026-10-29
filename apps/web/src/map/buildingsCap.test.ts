import { describe, it, expect } from "vitest";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { buildingPopulation } from "./layers";
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

describe("buildingPopulation", () => {
  it("keeps every landmark (mnType set)", () => {
    const feats = [
      f("a", { mnType: "temple" }),
      f("b", { mnType: "hospital" }),
      f("c", { mnType: "school" }),
    ];
    expect(buildingPopulation(feats).length).toBe(3);
  });

  it("keeps every named building", () => {
    const feats = [f("a", { name: "X" }), f("b", { name: "Y" })];
    expect(buildingPopulation(feats).length).toBe(2);
  });

  it("keeps every ≥20 m building", () => {
    const feats = [
      f("a", { _elevM: 20 }),
      f("b", { _elevM: 25 }),
      f("c", { _elevM: 100 }),
    ];
    expect(buildingPopulation(feats).length).toBe(3);
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
    expect(buildingPopulation(feats).length).toBe(5);
  });

  it("keeps every anonymous low-rise at city scale instead of removing blocks", () => {
    const feats = Array.from({ length: 1000 }, (_, i) => f(`untagged-${i.toString().padStart(5, "0")}`));
    const survivors = buildingPopulation(feats);
    expect(survivors.length).toBe(1000);
  });

  it("retains the input population and order across repeat renders", () => {
    const feats = Array.from({ length: 100 }, (_, i) => f(`id-${i.toString().padStart(3, "0")}`));
    const a = buildingPopulation(feats).map((f) => f.properties.id);
    const b = buildingPopulation(feats).map((f) => f.properties.id);
    expect(a).toEqual(b);
    // Preserve source order; never drop anonymous blocks by alphabetical ID.
    expect(a[0]).toBe("id-000");
    expect(a[69]).toBe("id-069");
  });

  it("keeps a landmark among anonymous source footprints", () => {
    // 100 untagged + 1 landmark scattered through the id-space.
    const feats: Feature<Polygon, BuildingProperties>[] = [];
    for (let i = 0; i < 50; i++) feats.push(f(`untagged-${i.toString().padStart(3, "0")}`));
    feats.push(f("landmark-XYZ", { mnType: "temple" }));
    for (let i = 50; i < 100; i++) feats.push(f(`untagged-${i.toString().padStart(3, "0")}`));
    const survivors = buildingPopulation(feats);
    expect(survivors.find((s) => s.properties.id === "landmark-XYZ")).toBeDefined();
  });
});

// Silence "unused type import" — FeatureCollection is referenced by JSDoc.
export type _Unused = FeatureCollection;

// Province LOD is deliberate subpixel culling; both physical surfaces must agree.
it("only thins anonymous buildings at province scale", () => {
  const feats = [f("home"), f("infill", {source: "ms-footprints"}), f("named", {name: "Landmark"})];
  expect(buildingPopulation(feats, 0).map(x => x.properties.id)).toEqual(["named"]);
  expect(buildingPopulation(feats, 1)).toEqual(feats);
  expect(buildingPopulation(feats, 2)).toEqual(feats);
});
