/**
 * floodRiskOverlay — pure helpers tests.
 */

import { describe, it, expect } from "vitest";
import type { FeatureCollection, LineString } from "geojson";
import {
  colorizeWaterways,
  dominantRisk,
  riskStatusToRgba,
  type WaterwayRiskStatus,
} from "./floodRiskOverlay";
import type { WaterGauge } from "@nst/shared";

function gauge(p: Partial<WaterGauge> & Pick<WaterGauge, "id">): WaterGauge {
  const { id, ...rest } = p;
  return {
    id,
    name: id,
    lat: rest.lat ?? 8.4,
    lng: rest.lng ?? 99.8,
    levelMsl: 1,
    levelPrev: 1,
    warningMsl: 2,
    criticalMsl: 3,
    diffFromBank: -0.5,
    situationLevel: 3,
    trend: "stable",
    riverName: "",
    amphoe: "",
    observedAt: "2026-01-01T00:00:00Z",
    isKeyStation: false,
    stationCode: null,
    bankMsl: 2,
    fullnessPct: 50,
    dischargeCms: null,
    qmaxCms: null,
    ...rest,
  };
}

function makeCollection(features: { lng: number; lat: number; waterway?: string }[]): FeatureCollection<LineString, Record<string, unknown>> {
  return {
    type: "FeatureCollection",
    features: features.map((f, i) => ({
      type: "Feature",
      id: i,
      properties: { waterway: f.waterway ?? "river" },
      geometry: {
        type: "LineString",
        coordinates: [[f.lng, f.lat], [f.lng + 0.01, f.lat + 0.005]],
      },
    })),
  };
}

describe("colorizeWaterways", () => {
  it("colors a river 'critical' when the nearest gauge is overbank (situation 5)", () => {
    const collection = makeCollection([{ lng: 99.78, lat: 8.43 }]);
    const gauges = [gauge({ id: "G1", lat: 8.43, lng: 99.78, situationLevel: 5 })];
    const result = colorizeWaterways(collection, gauges);
    expect(result.features[0]!.properties.riskStatus).toBe("critical");
    expect(result.features[0]!.properties.widthPx).toBe(12); // river critical
  });

  it("colors a canal 'warning' when situation level is 4 (high)", () => {
    const collection = makeCollection([{ lng: 99.78, lat: 8.43, waterway: "canal" }]);
    const gauges = [gauge({ id: "G1", lat: 8.43, lng: 99.78, situationLevel: 4 })];
    const result = colorizeWaterways(collection, gauges);
    expect(result.features[0]!.properties.riskStatus).toBe("warning");
    expect(result.features[0]!.properties.widthPx).toBe(6); // canal warning
  });

  it("returns 'normal' for a calm cascade (situation 3)", () => {
    const collection = makeCollection([{ lng: 99.78, lat: 8.43 }]);
    const gauges = [gauge({ id: "G1", lat: 8.43, lng: 99.78, situationLevel: 3 })];
    const result = colorizeWaterways(collection, gauges);
    expect(result.features[0]!.properties.riskStatus).toBe("normal");
    expect(result.features[0]!.properties.widthPx).toBe(4); // river normal
  });

  it("returns 'unknown' when no gauge is within 8 km", () => {
    const collection = makeCollection([{ lng: 99.78, lat: 8.43 }]);
    const gauges = [gauge({ id: "G1", lat: 8.43, lng: 99.78 + 0.5, situationLevel: 5 })]; // ~50 km away
    const result = colorizeWaterways(collection, gauges);
    expect(result.features[0]!.properties.riskStatus).toBe("unknown");
    expect(result.features[0]!.properties.nearestGaugeId).toBeUndefined();
  });

  it("finds the CLOSEST gauge when multiple are nearby", () => {
    const collection = makeCollection([{ lng: 99.78, lat: 8.43 }]);
    const gauges = [
      gauge({ id: "FAR", lat: 8.43, lng: 99.78 + 0.05, situationLevel: 5 }),  // ~5 km
      gauge({ id: "NEAR", lat: 8.43, lng: 99.78 + 0.001, situationLevel: 3 }), // ~100 m
    ];
    const result = colorizeWaterways(collection, gauges);
    expect(result.features[0]!.properties.nearestGaugeId).toBe("NEAR");
    expect(result.features[0]!.properties.riskStatus).toBe("normal");
  });

  it("preserves pass-through properties (waterway + flowClass)", () => {
    const collection = makeCollection([{ lng: 99.78, lat: 8.43, waterway: "river" }]);
    (collection.features[0]!.properties as Record<string, unknown>).flowClass = "fast";
    const gauges = [gauge({ id: "G1", lat: 8.43, lng: 99.78, situationLevel: 3 })];
    const result = colorizeWaterways(collection, gauges);
    expect(result.features[0]!.properties.flowClass).toBe("fast");
  });
});

describe("dominantRisk", () => {
  it("returns 'critical' when any gauge is overbank", () => {
    expect(dominantRisk([
      gauge({ id: "G1", situationLevel: 3 }),
      gauge({ id: "G2", situationLevel: 5 }),
    ])).toBe("critical");
  });
  it("returns 'warning' when max is 4", () => {
    expect(dominantRisk([
      gauge({ id: "G1", situationLevel: 3 }),
      gauge({ id: "G2", situationLevel: 4 }),
    ])).toBe("warning");
  });
  it("returns 'normal' when max ≤ 3", () => {
    expect(dominantRisk([
      gauge({ id: "G1", situationLevel: 3 }),
      gauge({ id: "G2", situationLevel: 2 }),
    ])).toBe("normal");
  });
  it("returns 'unknown' for an empty gauge list", () => {
    expect(dominantRisk([])).toBe("unknown");
  });
});

describe("riskStatusToRgba", () => {
  it("exposes the same status palette used by the rest of the dashboard", () => {
    // The danger axis is "more red / orange" as the level rises. Just
    // assert the channel ordering on G (green) which strictly drops
    // from calm (180) → critical (107): calm rivers are blue-ish,
    // flooded rivers are red/orange.
    expect(riskStatusToRgba("normal")[1]).toBeGreaterThan(riskStatusToRgba("warning")[1]);
    expect(riskStatusToRgba("warning")[1]).toBeGreaterThan(riskStatusToRgba("critical")[1]);
  });

  it("returns RGBA tuple for every status", () => {
    const statuses: WaterwayRiskStatus[] = ["normal", "watch", "warning", "critical", "unknown"];
    for (const s of statuses) {
      const c = riskStatusToRgba(s);
      expect(c).toHaveLength(4);
      expect(c[3]).toBeGreaterThanOrEqual(180); // alpha ≥ 180 so the line stays visible
    }
  });
});
