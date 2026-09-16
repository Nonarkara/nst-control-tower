/**
 * metroLines — pure helpers + invariant tests for the watershed-as-subway
 * infographic. The infographic itself is verified at the visual layer by
 * Playwright; here we lock down the data-shape plumbing.
 */

import { describe, it, expect } from "vitest";
import {
  buildCascadeLine,
  buildLineGeometry,
  METRO,
  type MetroStation,
} from "./metroLines";
import type { ZoneSummary } from "../lib/watershed";

function sum(over: Partial<ZoneSummary>): ZoneSummary {
  return {
    zone: {
      key: "khiri-wong",
      th: "คีรีวง",
      en: "Khiri Wong",
      role: "Tha Dee source",
      river: "คลองท่าดี",
      lat: 8.4338,
      lng: 99.7833,
      amphoe: ["ลานสกา"],
      basinId: "city_tha_dee",
    },
    status: "normal",
    situation: 3,
    levelMsl: 43.1,
    diffFromBank: -0.5,
    rain24h: 5,
    soil: 60,
    ewsStatus: 0,
    rising: false,
    gaugeCount: 1,
    topStation: "Khiri Wong",
    modelled: false,
    ...over,
  };
}

describe("buildCascadeLine", () => {
  it("always emits 5 stations: source → KW → LS → City → Bay", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.4338, lng: 99.7833 } }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.4012, lng: 99.802 } }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.4364, lng: 99.9631, isCity: true } }),
    ]);
    expect(line.stations.map((s) => s.id)).toEqual([
      "khao-luang",
      "khiri-wong",
      "lan-saka",
      "city",
      "pak-phanang-bay",
    ]);
  });

  it("anchors every station at a real lng/lat (KW/LS/City from WATERSHED_FORECAST_POINTS, Bay from PAK_PHANANG_BAY_CENTROID)", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.4338, lng: 99.7833 } }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.4012, lng: 99.802 } }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.4364, lng: 99.9631, isCity: true } }),
    ]);
    const kw = line.stations.find((s) => s.id === "khiri-wong")!;
    expect(kw.lng).toBeCloseTo(99.7833, 4);
    expect(kw.lat).toBeCloseTo(8.4338, 4);
    const bay = line.stations.find((s) => s.id === "pak-phanang-bay")!;
    // Bay must be east + downstream of city (real geography, not a
    // made-up terminus somewhere on top of the city marker).
    expect(bay.lng).toBeGreaterThan(kw.lng);
  });

  it("exposes overallStatus = worst across the cascade", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.43, lng: 99.78 }, status: "flood", situation: 5 }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.40, lng: 99.80 }, status: "normal" }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.43, lng: 99.96, isCity: true }, status: "watch" }),
    ]);
    expect(line.overallStatus).toBe("critical");
  });

  it("marks KW + LS status from the live ZoneSummary.status", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.43, lng: 99.78 }, status: "high" }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.40, lng: 99.80 }, status: "flood" }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.43, lng: 99.96, isCity: true }, status: "normal" }),
    ]);
    expect(line.stations.find((s) => s.id === "khiri-wong")!.status).toBe("prepare");
    expect(line.stations.find((s) => s.id === "lan-saka")!.status).toBe("critical");
  });

  it("labels terminus and transfer stations by lineage (source/bay = terminus, city = transfer)", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.43, lng: 99.78 } }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.40, lng: 99.80 } }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.43, lng: 99.96, isCity: true } }),
    ]);
    const source = line.stations.find((s) => s.id === "khao-luang")!;
    const city = line.stations.find((s) => s.id === "city")!;
    const bay = line.stations.find((s) => s.id === "pak-phanang-bay")!;
    expect(source.kind).toBe("terminus");
    expect(city.kind).toBe("transfer");
    expect(bay.kind).toBe("terminus");
  });

  it("carries live level + trend per station from the source summary", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.43, lng: 99.78 }, levelMsl: 43.10, rising: true }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.40, lng: 99.80 }, levelMsl: 25.30, rising: false }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.43, lng: 99.96, isCity: true } }),
    ]);
    const kw = line.stations.find((s) => s.id === "khiri-wong")!;
    expect(kw.levelM).toBeCloseTo(43.10, 2);
    expect(kw.trend).toBe("▲");
  });
});

describe("buildLineGeometry", () => {
  it("returns one tuple per stop when there are < 2 stops", () => {
    const only: MetroStation[] = [
      { id: "x", lng: 0, lat: 0, labelEn: "x", labelTh: "x", kind: "local", status: "normal", levelM: null, trend: "·", kmFromSource: 0, etaH: null, role: "" },
    ];
    expect(buildLineGeometry({
      id: "x",
      nameEn: "x",
      nameTh: "x",
      colour: [0,0,0],
      accent: [0,0,0],
      stations: only,
      overallStatus: "normal",
    })).toEqual([[0, 0]]);
  });

  it("starts at the upstream terminus lng/lat and ends at the downstream terminus", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.43, lng: 99.78 } }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.40, lng: 99.80 } }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.43, lng: 99.96, isCity: true } }),
    ]);
    const path = buildLineGeometry(line);
    const first = path[0]!;
    const last = path[path.length - 1]!;
    expect(first[0]).toBeCloseTo(line.stations[0]!.lng, 5);
    expect(first[1]).toBeCloseTo(line.stations[0]!.lat, 5);
    expect(last[0]).toBeCloseTo(line.stations.at(-1)!.lng, 5);
    expect(last[1]).toBeCloseTo(line.stations.at(-1)!.lat, 5);
  });

  it("interpolates with the requested sample count (>= source count + per-segment samples)", () => {
    const line = buildCascadeLine([
      sum({ zone: { ...sum({}).zone, key: "khiri-wong", lat: 8.43, lng: 99.78 } }),
      sum({ zone: { ...sum({}).zone, key: "lan-saka", lat: 8.40, lng: 99.80 } }),
      sum({ zone: { ...sum({}).zone, key: "city", lat: 8.43, lng: 99.96, isCity: true } }),
    ]);
    const p32 = buildLineGeometry(line, 32);
    const p8  = buildLineGeometry(line, 8);
    expect(p32.length).toBeGreaterThan(p8.length);
  });
});

describe("METRO constants", () => {
  it("exposes status → colour tokens (never an invented hue)", () => {
    const c = METRO.STATUS_COLOR;
    expect(c.normal).toBe("#4cc27a");
    expect(c.watch).toBe("#f0b429");
    expect(c.prepare).toBe("#ff9a3d");
    expect(c.critical).toBe("#ff6b5e");
    expect(c.unknown).toBe("#a6a6a6");
  });
});
