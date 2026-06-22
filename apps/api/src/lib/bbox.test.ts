import { describe, it, expect } from "vitest";
import { FEED_BBOX, OUTER_BBOX, inBbox, inMunicipality } from "./bbox";

/**
 * Bbox utility tests — boundary conditions, corners, and clear in/out cases.
 * These functions filter every single adapter feed; getting them wrong silently
 * removes real incidents from the dashboard or leaks noise in.
 */

describe("FEED_BBOX constants", () => {
  it("has correct Nakhon Si Thammarat province bounds", () => {
    expect(FEED_BBOX.minLng).toBe(99.30);
    expect(FEED_BBOX.minLat).toBe(7.80);
    expect(FEED_BBOX.maxLng).toBe(100.35);
    expect(FEED_BBOX.maxLat).toBe(9.45);
  });

  it("is wider than OUTER_BBOX (feeds cover more than just the municipality)", () => {
    expect(FEED_BBOX.minLng).toBeLessThan(OUTER_BBOX.minLng);
    expect(FEED_BBOX.minLat).toBeLessThan(OUTER_BBOX.minLat);
    expect(FEED_BBOX.maxLng).toBeGreaterThan(OUTER_BBOX.maxLng);
    expect(FEED_BBOX.maxLat).toBeGreaterThan(OUTER_BBOX.maxLat);
  });
});

describe("inBbox", () => {
  // Nakhon Si Thammarat City Municipality center (Old Town / Wat Phra Mahathat axis)
  const NST_LNG = 99.9631;
  const NST_LAT = 8.4364;

  it("returns true for NST city center", () => {
    expect(inBbox(NST_LNG, NST_LAT)).toBe(true);
  });

  it("returns true for Pak Phanang (south-east of the city, inside the province)", () => {
    // Pak Phanang town: ~100.20°E, 8.35°N — inside the province bbox
    expect(inBbox(100.20, 8.35)).toBe(true);
  });

  it("returns true for Thung Song (south-west district)", () => {
    // Thung Song: ~99.6804°E, 8.1622°N
    expect(inBbox(99.6804, 8.1622)).toBe(true);
  });

  it("returns false for Bangkok city center (north of bbox)", () => {
    // Bangkok Silom: ~100.527°E, 13.724°N — far north of NST
    expect(inBbox(100.527, 13.724)).toBe(false);
  });

  it("returns false for Myanmar (west of bbox)", () => {
    expect(inBbox(97.0, 16.0)).toBe(false);
  });

  it("returns false for Vietnam (east of bbox)", () => {
    expect(inBbox(106.0, 11.0)).toBe(false);
  });

  it("returns false for the open sea (far south of bbox)", () => {
    expect(inBbox(100.0, 4.0)).toBe(false);
  });

  it("returns true at exact minLng boundary (inclusive)", () => {
    expect(inBbox(FEED_BBOX.minLng, NST_LAT)).toBe(true);
  });

  it("returns true at exact maxLng boundary (inclusive)", () => {
    expect(inBbox(FEED_BBOX.maxLng, NST_LAT)).toBe(true);
  });

  it("returns true at exact minLat boundary (inclusive)", () => {
    expect(inBbox(NST_LNG, FEED_BBOX.minLat)).toBe(true);
  });

  it("returns true at exact maxLat boundary (inclusive)", () => {
    expect(inBbox(NST_LNG, FEED_BBOX.maxLat)).toBe(true);
  });

  it("returns false just outside minLng", () => {
    expect(inBbox(FEED_BBOX.minLng - 0.001, NST_LAT)).toBe(false);
  });

  it("returns false just outside maxLat", () => {
    expect(inBbox(NST_LNG, FEED_BBOX.maxLat + 0.001)).toBe(false);
  });
});

describe("inMunicipality (map-coverage clamp = whole province)", () => {
  // The map now covers the whole province, so OUTER_BBOX is province-scale.
  // NST.center = [99.9631, 8.4364]; outerBounds SW = [99.33, 7.83].
  const NST_LNG = 99.9631;
  const NST_LAT = 8.4364;

  it("returns true for NST city center", () => {
    expect(inMunicipality(NST_LNG, NST_LAT)).toBe(true);
  });

  it("returns true for Pak Phanang (within the provincial map coverage)", () => {
    // Pak Phanang: 100.20°E, 8.35°N — inside the province-scale OUTER_BBOX
    expect(inMunicipality(100.20, 8.35)).toBe(true);
  });

  it("returns false for Bangkok (outside the province)", () => {
    expect(inMunicipality(100.527, 13.724)).toBe(false);
  });
});
