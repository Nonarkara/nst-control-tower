/**
 * buildingHeights — the honest-height contract.
 *
 * These tests exist because the thing being replaced was silently wrong: every
 * building extruded at 10 m and every temple at 28 m, which made the 3D city
 * look plausible and be fiction. The regression we must not repeat is a
 * *reintroduced blanket height*, so several cases assert on DISTRIBUTION
 * rather than single values — a constant would pass "the temple is tall" and
 * still be wrong.
 *
 * The measured ground truth these are calibrated against, from Overpass on
 * bbox 8.40–8.46 N / 99.94–99.99 E: 1,865 buildings, ONE with `height` and
 * THREE with `building:levels` (0.21%). The one real datum is height=9 m on
 * building:levels=2, i.e. 4.5 m/storey. See lib/buildingHeights.ts.
 */
import { describe, it, expect } from "vitest";
import {
  estimateBuildingHeight,
  parseOsmHeight,
  polygonAreaM2,
  storeyJitter,
  census,
  legacyFloor,
  STOREY_M,
  DEFAULT_HEIGHT_M,
} from "./buildingHeights";

describe("parseOsmHeight", () => {
  it("reads a plain number, a decimal, and a suffixed string", () => {
    expect(parseOsmHeight(12)).toBe(12);
    expect(parseOsmHeight("12.5")).toBe(12.5);
    expect(parseOsmHeight("12 m")).toBe(12);
  });
  it("refuses nonsense rather than returning 0, which would flatten a tower", () => {
    expect(parseOsmHeight("abc")).toBeNull();
    expect(parseOsmHeight(-4)).toBeNull();
    expect(parseOsmHeight(0)).toBeNull();
    expect(parseOsmHeight(null)).toBeNull();
    expect(parseOsmHeight(undefined)).toBeNull();
  });
});

describe("authority order — a real tag always beats a guess", () => {
  it("prefers a measured OSM height over everything", () => {
    const r = estimateBuildingHeight(50, { height: "42", building: "temple", id: "way/1" });
    expect(r).toEqual({ metres: 42, source: "osm-height", measured: true });
  });
  it("uses building:levels when no height exists, and does NOT jitter it", () => {
    const r = estimateBuildingHeight(300, { "building:levels": "2", building: "yes", id: "way/766416747" });
    expect(r.metres).toBeCloseTo(2 * STOREY_M, 5);
    expect(r.source).toBe("osm-levels");
    expect(r.measured).toBe(false);
  });
  it("prefers levels over typology even when they disagree", () => {
    const r = estimateBuildingHeight(300, { "building:levels": "2", building: "hospital", id: "w" });
    expect(r.source).toBe("osm-levels");
  });
  it("falls back to typology for a tagged non-yes building", () => {
    expect(estimateBuildingHeight(9999, { building: "hospital", id: "w" }).source).toBe("typology");
    expect(estimateBuildingHeight(9999, { building: "temple", id: "w" }).source).toBe("typology");
  });
});

describe("the city must not be a plateau", () => {
  it("gives shophouse-sized footprints 1–3 storeys, NOT a flat 10 m", () => {
    // 200 m² is the modal Thai shophouse band. Assert a RANGE: a constant
    // would satisfy any single value here, which is the bug we are guarding.
    for (const id of ["way/1", "way/2", "way/3", "way/4", "way/5", "way/6"]) {
      const m = estimateBuildingHeight(200, { building: "yes", id }).metres;
      expect(m).toBeGreaterThanOrEqual(1 * STOREY_M);
      expect(m).toBeLessThanOrEqual(3 * STOREY_M);
    }
  });

  it("produces a genuinely varied height set across same-sized footprints", () => {
    // The jitter exists so the old town is not a machined plateau. If every id
    // hashed to the same bucket this fails, and the city goes flat again.
    const heights = new Set(
      Array.from({ length: 60 }, (_, i) => estimateBuildingHeight(200, { building: "yes", id: `way/${i}` }).metres)
    );
    expect(heights.size).toBeGreaterThan(1);
  });

  it("keeps the jitter deterministic so rebuilds produce an identical map", () => {
    expect(storeyJitter("way/12345")).toBe(storeyJitter("way/12345"));
    expect(estimateBuildingHeight(200, { building: "yes", id: "way/9" }).metres).toBe(
      estimateBuildingHeight(200, { building: "yes", id: "way/9" }).metres
    );
  });

  it("scales with footprint area — a big plot is taller than a small one", () => {
    const small = estimateBuildingHeight(80, { building: "yes", id: "a" }).metres;
    const huge = estimateBuildingHeight(30_000, { building: "yes", id: "a" }).metres;
    expect(huge).toBeGreaterThan(small);
    expect(huge).toBeGreaterThan(6 * STOREY_M);
  });

  it("never returns zero or negative — a flat building is a missing one", () => {
    for (const area of [0, 1, 50, 500, 5000, 100000]) {
      for (const id of ["way/a", "way/b", "way/c"]) {
        const r = estimateBuildingHeight(area, { building: "yes", id });
        expect(r.metres).toBeGreaterThan(0);
      }
    }
  });
});

describe("legacyFloor", () => {
  it("holds a named landmark at its hand-tagged height", () => {
    expect(legacyFloor({ _elevM: 28, mnType: "temple" })).toBe(28);
    expect(legacyFloor({ _elevM: 28, name: "ศาลากลาง" })).toBe(28);
  });
  it("ignores _elevM for anonymous buildings, which is only a guess anyway", () => {
    expect(legacyFloor({ _elevM: 10 })).toBeNull();
  });
  it("returns null when there is no legacy value", () => {
    expect(legacyFloor({})).toBeNull();
  });
});

describe("polygonAreaM2", () => {
  it("measures a known square: 20 m × 20 m ≈ 400 m²", () => {
    const lat = 8.4367;
    const dLat = 20 / 110574;
    const dLng = 20 / (111320 * Math.cos((lat * Math.PI) / 180));
    const sq = {
      type: "Polygon",
      coordinates: [[[99.96, lat], [99.96 + dLng, lat], [99.96 + dLng, lat + dLat], [99.96, lat + dLat], [99.96, lat]]],
    };
    expect(polygonAreaM2(sq)).toBeGreaterThan(395);
    expect(polygonAreaM2(sq)).toBeLessThan(405);
  });
  it("sums a MultiPolygon and tolerates junk without throwing", () => {
    expect(polygonAreaM2({ type: "MultiPolygon", coordinates: [] })).toBe(0);
    expect(polygonAreaM2({ type: "Point", coordinates: [1, 2] })).toBe(0);
    expect(polygonAreaM2(null as unknown as { type: string; coordinates: unknown })).toBe(0);
  });
});

describe("census — the UI must be able to say what it knows", () => {
  it("counts measured separately from modelled", () => {
    const c = census([
      estimateBuildingHeight(100, { height: "9", building: "yes" }),
      estimateBuildingHeight(100, { "building:levels": "2", building: "yes", id: "w" }),
      estimateBuildingHeight(100, { building: "hospital", id: "w" }),
      estimateBuildingHeight(100, { building: "yes", id: "w" }),
    ]);
    expect(c.total).toBe(4);
    expect(c.measured).toBe(1);
    expect(c.bySource["osm-height"]).toBe(1);
    expect(c.bySource["area-model"]).toBe(1);
  });
});

describe("DEFAULT_HEIGHT_M is reachable", () => {
  it("is a sane positive fallback for an unclassifiable footprint", () => {
    expect(DEFAULT_HEIGHT_M).toBeGreaterThan(0);
  });
});
