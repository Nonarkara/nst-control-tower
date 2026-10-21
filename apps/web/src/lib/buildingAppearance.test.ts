import { describe, expect, it } from "vitest";
import type { BuildingFeature } from "./buildingAppearance";
import { buildingModel, buildingRoofFaces } from "./buildingAppearance";
import { polygonAreaM2 } from "./building";
import { buildingsLayer, buildingRoofsLayer } from "../map/layers";

const hall: BuildingFeature = { type: "Feature", properties: {
  id: "hall", building: "yes", mnType: "temple", name: "Hall", nameTh: null,
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
    expect((walls.props.getElevation as (f: BuildingFeature) => number)(hall)).toBe(model.eaves);
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
