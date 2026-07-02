import { describe, test, expect } from "vitest";
import { buildScenarioIndex, floodScenarioStats } from "./floodScenario";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { FloodMarkProps, RoadLevelProps } from "../map/layers";

/** ~2.5 m apart along a parallel of latitude near NST (1e-5 deg lng ≈ 1.1 m). */
function roadPoint(lng: number, z: number, route = 1): Feature<Point, RoadLevelProps> {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, 8.43] },
    properties: { z, route },
  };
}

function mark(z: number, set: FloodMarkProps["set"] = "normal"): Feature<Point, FloodMarkProps> {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [100.02, 8.44] },
    properties: { set, z },
  };
}

function fc(features: Feature<Point, RoadLevelProps>[]): FeatureCollection<Point, RoadLevelProps> {
  return { type: "FeatureCollection", features };
}

describe("buildScenarioIndex", () => {
  test("measures segment length from same-route neighbours", () => {
    // 3 points 2.2 m apart (2e-5 deg lng at lat 8.43 → ~2.19 m).
    const idx = buildScenarioIndex(fc([
      roadPoint(100.0, 1.0),
      roadPoint(100.00002, 1.2),
      roadPoint(100.00004, 1.4),
    ]));
    expect(idx.points).toHaveLength(3);
    expect(idx.points[0].segM).toBe(0); // no predecessor
    expect(idx.points[1].segM).toBeGreaterThan(1.5);
    expect(idx.points[1].segM).toBeLessThan(3);
    expect(idx.totalKm).toBeCloseTo((idx.points[1].segM + idx.points[2].segM) / 1000, 6);
  });

  test("route changes and long gaps contribute no length", () => {
    const idx = buildScenarioIndex(fc([
      roadPoint(100.0, 1.0, 1),
      roadPoint(100.00002, 1.0, 2),   // route change → 0
      roadPoint(100.01, 1.0, 2),      // ~1.1 km jump → capped out → 0
    ]));
    expect(idx.totalKm).toBe(0);
  });
});

describe("floodScenarioStats", () => {
  const idx = buildScenarioIndex(fc([
    roadPoint(100.0, 1.0),
    roadPoint(100.00002, 1.5),
    roadPoint(100.00004, 2.0),
    roadPoint(100.00006, 2.5),
  ]));
  const marks = [mark(1.2), mark(1.7, "pabuk"), mark(2.1, "pabuk")];

  test("counts points strictly below the level as wet", () => {
    const s = floodScenarioStats(idx, marks, 1.5);
    expect(s.wetCount).toBe(1); // only z=1.0 (z=1.5 is not below 1.5)
    expect(s.totalCount).toBe(4);
    expect(s.wetShare).toBeCloseTo(0.25, 6);
  });

  test("deepest submergence = level − lowest surveyed z", () => {
    const s = floodScenarioStats(idx, marks, 2.12);
    expect(s.deepestM).toBeCloseTo(1.12, 6);
  });

  test("marks exceeded counts marks at or below the level", () => {
    expect(floodScenarioStats(idx, marks, 1.2).marksExceeded).toBe(1);
    expect(floodScenarioStats(idx, marks, 1.7).marksExceeded).toBe(2);
    expect(floodScenarioStats(idx, marks, 3.0).marksExceeded).toBe(3);
    expect(floodScenarioStats(idx, marks, 1.0).marksExceeded).toBe(0);
  });

  test("a level above every point floods the whole network", () => {
    const s = floodScenarioStats(idx, marks, 3.0);
    expect(s.wetCount).toBe(4);
    expect(s.wetShare).toBe(1);
    expect(s.wetKm).toBeCloseTo(s.totalKm, 6);
  });
});
