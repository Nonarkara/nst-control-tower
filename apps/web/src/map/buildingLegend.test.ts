import { describe, it, expect } from "vitest";
import { BUILDING_LEGEND, UNTYPED_COLOR, LANDMARK_COLOR } from "./layers";

/**
 * BUILDING_LEGEND is the on-map key for the building type → colour scheme.
 * If a row drifts from the actual fill palette, the legend silently lies to the
 * operator reading the map. These invariants keep it honest.
 */
describe("BUILDING_LEGEND", () => {
  it("is non-empty and every row has a label + RGB triple", () => {
    expect(BUILDING_LEGEND.length).toBeGreaterThan(0);
    for (const row of BUILDING_LEGEND) {
      expect(typeof row.label).toBe("string");
      expect(row.label.length).toBeGreaterThan(0);
      expect(row.color).toHaveLength(3);
      for (const ch of row.color) {
        expect(Number.isInteger(ch)).toBe(true);
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });

  it("has unique labels", () => {
    const labels = BUILDING_LEGEND.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes an Unclassified row mapped to the neutral untyped colour", () => {
    const row = BUILDING_LEGEND.find((r) => r.label === "Unclassified");
    expect(row).toBeDefined();
    expect(row!.color).toEqual(UNTYPED_COLOR);
  });

  it("named-type rows match the canonical landmark palette", () => {
    const residential = BUILDING_LEGEND.find((r) => r.label === "Residential");
    expect(residential!.color).toEqual(LANDMARK_COLOR.residential);
    const hospital = BUILDING_LEGEND.find((r) => r.label === "Hospital");
    expect(hospital!.color).toEqual(LANDMARK_COLOR.hospital);
  });
});
