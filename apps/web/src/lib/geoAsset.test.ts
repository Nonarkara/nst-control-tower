import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validGeoAsset } from "./geoAsset";
const load = (name: string) => JSON.parse(readFileSync(new URL(`../../public/geo/nst/${name}`, import.meta.url), "utf8"));
describe("operational map assets", () => {
  it("rejects missing, empty and malformed critical observations", () => {
    for (const payload of [null, {}, { type: "FeatureCollection", features: [] }, {type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"Point",coordinates:[100,8]},properties:{z:null,route:"x"}}]}]) {
      expect(validGeoAsset(payload, "/hii/road-levels.geojson")).toBe(false);
    }
  });
  it("validates the shipped survey and unique infill without invented heights or roofs", () => {
    expect(validGeoAsset(load("hii/road-levels.geojson"), "/hii/road-levels.geojson")).toBe(true);
    const infill = load("buildings-infill.geojson");
    expect(validGeoAsset(infill, "/buildings-infill.geojson")).toBe(true);
    expect(infill.features).toHaveLength(load("building-coverage.json").addedFootprints ?? 15463);
    const ids = infill.features.map((f: {properties: {id:string}}) => f.properties.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(infill.features.every((f: {properties: Record<string, unknown>}) => f.properties.height === null && f.properties["roof:shape"] === undefined)).toBe(true);
  });
});
