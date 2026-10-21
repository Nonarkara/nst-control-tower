import { describe, expect, it } from "vitest";
import type { BuildingFeature } from "./buildingAppearance";
import { buildingModel, buildingRoofFaces } from "./buildingAppearance";
import { polygonAreaM2 } from "./building";
import { buildingsLayer, buildingRoofsLayer } from "../map/layers";

const hall: BuildingFeature = { type: "Feature", properties: {
  id: "hall", "roof:shape": "gabled", building: "yes", mnType: "temple", name: "Hall", nameTh: null,
  nameEn: null, height: null, levels: null, operator: null, ...{ _elevM: 28 },
}, geometry: { type: "Polygon", coordinates: [[[99.96, 8.43], [99.9603, 8.43], [99.9603, 8.4301], [99.96, 8.4301], [99.96, 8.43]]] } };

describe("grounded schematic architecture", () => {
  it("ignores the obsolete28m blanket and preserves authoritative height/storeys", () => {
    expect(buildingModel(hall).total).toBe(9.6);
    expect(buildingModel({ ...hall, properties: { ...hall.properties, height: 9 } }).total).toBe(9);
    expect(buildingModel({ ...hall, properties: { ...hall.properties, levels: 2 } }).total).toBe(6.4);
  });
  it("attaches roof eaves to walls at1:1 scale and never extrudes a second prism", () => {
    const model = buildingModel(hall);
    const fc = { type: "FeatureCollection" as const, features: [hall] };
    const walls = buildingsLayer(fc, { extruded: true, zoomBucket: 2 });
    expect(walls.props.elevationScale).toBe(1);
    expect((walls.props.getElevation as unknown as (f: BuildingFeature) => number)(hall)).toBe(model.eaves);
    const roofs = buildingRoofsLayer(fc);
    expect(roofs.props.extruded).toBe(false);
    const coords = buildingRoofFaces(hall).flatMap(f => f.geometry.coordinates.flat());
    expect(Math.min(...coords.map(p => p[2]!))).toBeCloseTo(model.eaves);
    expect(Math.max(...coords.map(p => p[2]!))).toBeCloseTo(model.total);
  });
  it("covers the actual footprint with two pitched planes and closed gable ends", () => {
    const faces = buildingRoofFaces(hall);
    const planes = faces.filter(f => f.properties.roofBasis.includes("ridge"));
    expect(planes).toHaveLength(2);
    expect(faces.length).toBeGreaterThan(2);
    const area = planes.reduce((sum, f) => sum + polygonAreaM2(f.geometry), 0);
    expect(area).toBeCloseTo(polygonAreaM2(hall.geometry), 2);
    for (const p of faces.flatMap(f => f.geometry.coordinates.flat())) {
      expect(p[0]).toBeGreaterThanOrEqual(99.96);
      expect(p[0]).toBeLessThanOrEqual(99.9603);
      expect(p[1]).toBeGreaterThanOrEqual(8.43);
      expect(p[1]).toBeLessThanOrEqual(8.4301);
    }
  });
  it("preserves courtyard holes and refuses inferred pitched roofs on complex outlines", () => {
    const courtyard: BuildingFeature = { ...hall, geometry: { type: "Polygon", coordinates: [hall.geometry.coordinates[0] as number[][], [[99.9601,8.43002],[99.9602,8.43002],[99.9602,8.43008],[99.9601,8.43008],[99.9601,8.43002]]] } };
    const faces = buildingRoofFaces(courtyard);
    expect(buildingModel(courtyard).rise).toBe(0);
    expect(faces).toHaveLength(1);
    expect(faces[0]!.geometry.coordinates).toHaveLength(2);
  });
  it("does not turn a named chedi into a gabled hall", () => {
    expect(buildingModel({ ...hall, properties: { ...hall.properties, name: "Chedi", height: 56 } }).rise).toBe(0);
  });
});

it("does not infer a gable from proximity to a temple POI", () => {
  const properties = { ...hall.properties }; delete properties["roof:shape"];
  expect(buildingModel({ ...hall, properties }).shape).toBe("unknown");
  expect(buildingModel({ ...hall, properties }).rise).toBe(0);
});
it("hipped rectangular roofs retain a ridge instead of becoming pyramids", () => {
  const feature = { ...hall, properties: { ...hall.properties, "roof:shape": "hipped" } };
  const m = buildingModel(feature);
  const planes = buildingRoofFaces(feature).filter(f => f.properties.roofBasis.includes("ridge"));
  expect(planes).toHaveLength(4);
  expect(planes.reduce((sum, f) => sum + polygonAreaM2(f.geometry), 0)).toBeCloseTo(polygonAreaM2(feature.geometry), 2);
  const tops = planes.flatMap(f => f.geometry.coordinates.flat()).filter(p => Math.abs(p[2]! - m.total) < 1e-6);
  const longitudes = tops.map(p => p[0]!);
  expect(Math.max(...longitudes) - Math.min(...longitudes)).toBeGreaterThan(.0001);
});

import roofManifest from "../data/roofObservations.json";
import { hasReviewedRoof, roofObservation } from "./roofEvidence";
import { readFileSync } from "node:fs";
const mapped = JSON.parse(readFileSync(new URL("../../public/geo/nst/buildings.geojson", import.meta.url), "utf8")) as { features: BuildingFeature[] };
it("binds every aerial observation to a unique existing footprint with honest image dates", () => {
  expect(roofManifest.source.imageryCapturedAt).toBeNull();
  expect(new Set(roofManifest.observations.map(o => o.id)).size).toBe(roofManifest.observations.length);
  const ids = new Set(mapped.features.map(f => f.properties.id));
  for (const o of roofManifest.observations) expect(ids.has(o.id)).toBe(true);
});
it("keeps reviewed flat roofs flat even inside temple precincts, and unknown roofs unverified", () => {
  const flat = mapped.features.find(f => f.properties.id === "way/766207839")!;
  expect(flat.properties.mnType).toBe("temple");
  expect(buildingModel(flat).shape).toBe("flat");
  expect(buildingModel(flat).rise).toBe(0);
  expect(buildingRoofFaces(flat)[0]!.properties.roofBasis).toContain("aerial-reviewed flat");
  expect(roofObservation("way/765949357")!.shape).toBe("unknown");
  expect(hasReviewedRoof("way/765949357")).toBe(false);
  expect(buildingRoofFaces(mapped.features.find(f => f.properties.id === "way/765949357")!)[0]!.properties.roofBasis).toContain("unverified");
});
it("all reviewed roofs stay finite, footprint-constrained and cover exactly the mapped plan", () => {
  for (const feature of mapped.features.filter(f => hasReviewedRoof(f.properties.id))) {
    const model = buildingModel(feature), faces = buildingRoofFaces(feature);
    const surface = faces.filter(f => !f.properties.roofBasis.includes("closure"));
    expect(surface.reduce((sum, f) => sum + polygonAreaM2(f.geometry), 0), feature.properties.id).toBeCloseTo(polygonAreaM2(feature.geometry), 1);
    for (const p of faces.flatMap(f => f.geometry.coordinates.flat())) {
      expect(p.every(Number.isFinite)).toBe(true);
      expect(p[2]!).toBeGreaterThanOrEqual(model.eaves - 1e-6);
      expect(p[2]!).toBeLessThanOrEqual(model.total + .031);
    }
  }
});
it("the reviewed temple hall has stepped roof bands with closed joins and no added ornaments", () => {
  const feature = mapped.features.find(f => f.properties.id === "way/766207684")!;
  expect(buildingModel(feature).shape).toBe("temple-tiered");
  const faces = buildingRoofFaces(feature);
  expect(faces.filter(f => f.properties.roofBasis.includes("ridge"))).toHaveLength(8);
  expect(faces.some(f => f.properties.roofBasis.includes("closure"))).toBe(true);
});
it("keeps reviewed ordinary roofs in the same wall/roof population at province scale", () => {
  const feature = mapped.features.find(f => f.properties.id === "way/770813042")!;
  const fc = { type: "FeatureCollection" as const, features: [feature] };
  expect(buildingsLayer(fc, { extruded: true, zoomBucket: 0 }).props.data!.features).toHaveLength(1);
  expect(buildingRoofsLayer(fc, { zoomBucket: 0 }).props.data!.features.length).toBeGreaterThan(0);
});

it("an unresolved visual observation does not erase an explicit mapped roof tag", () => {
  const feature = { ...hall, properties: { ...hall.properties, id: "way/766207702", "roof:shape": "hipped" } };
  expect(roofObservation(feature.properties.id)!.shape).toBe("unknown");
  expect(buildingModel(feature).shape).toBe("hipped");
});
