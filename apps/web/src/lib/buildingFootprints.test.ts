import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { polygonAreaM2, estimateBuildingHeight } from "../lib/buildingHeights";
import { isGroundsCompound } from "../lib/building";
import type { Feature, FeatureCollection, Polygon } from "geojson";

/**
 * Guards against hand-authored geometry that is really a bounding box.
 *
 * Wat Mahathat's temple precinct shipped as `hand/mahatat-cloister`: a
 * five-point, axis-aligned rectangle 452 m × 401 m, labelled "กำแพงแก้ว"
 * (the cloister wall). It was not a traced wall — it was a box drawn around
 * the temple, 18.1 hectares of it, which on the 3D map rendered as a single
 * plate lying across the streets it was supposed to sit inside. The user
 * caught it: "no way the temple's base can go across the streets like that".
 *
 * The tell is structural, not visual: a real traced footprint is a polygon
 * with real vertices, and a person drawing a box produces exactly four corners
 * at right angles. A footprint over a few thousand square metres that is still
 * a perfect rectangle is a selection marquee, not a building.
 */

const file = new URL("../../public/geo/nst/buildings.geojson", import.meta.url);
const fc = JSON.parse(readFileSync(file, "utf8")) as FeatureCollection<Polygon, {
  id?: string; name?: string | null; nameTh?: string | null; nameEn?: string | null;
  building?: string | null; mnType?: string | null; source?: string; height?: number | null;
}>;

const M_PER_DEG_LAT = 110_800;
const mPerDegLng = 111_320 * Math.cos((8.4367 * Math.PI) / 180);

/** True for a closed 4-corner ring whose edges are axis-aligned. */
function isAxisAlignedBox(ring: number[][]): boolean {
  if (ring.length !== 5) return false;
  for (let i = 0; i < 4; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 4];
    const dx = Math.abs(a[0] - b[0]);
    const dy = Math.abs(a[1] - b[1]);
    // One coordinate must be shared; a diagonal edge fails both.
    if (dx > 1e-9 && dy > 1e-9) return false;
  }
  return true;
}

function extentM(ring: number[][]): { w: number; h: number } {
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return {
    w: (Math.max(...lngs) - Math.min(...lngs)) * mPerDegLng,
    h: (Math.max(...lats) - Math.min(...lats)) * M_PER_DEG_LAT,
  };
}

describe("no building footprint is really a bounding box", () => {
  it("no large footprint is a bare axis-aligned rectangle", () => {
    // Threshold: 1,000 m². Small sheds and shops genuinely are rectangles —
    // 35 of them in this file are, and they are fine. A half-hectare "wall"
    // is not.
    const offenders = fc.features
      .filter((f) => f.geometry.type === "Polygon" && isAxisAlignedBox(f.geometry.coordinates[0]))
      .map((f) => ({ f, a: polygonAreaM2(f.geometry as never) }))
      .filter((x) => x.a > 1000)
      .map((x) => `${x.f.id} ${Math.round(x.a)} m²`);

    expect(offenders, `axis-aligned rectangles over 1,000 m²: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("the fabricated cloister rectangle is gone", () => {
    // The specific feature. 452 m × 401 m of invented wall.
    expect(fc.features.find((f) => f.id === "hand/mahatat-cloister")).toBeUndefined();
  });
});

describe("the temple precinct is represented by traced geometry only", () => {
  const temples = fc.features.filter(
    (f) => f.properties.building === "temple" || f.properties.mnType === "temple",
  );

  it("still has temple buildings after the rectangle was removed", () => {
    // The fix must not simply delete the temple from the map.
    expect(temples.length).toBeGreaterThan(50);
  });

  it("the largest temple footprint is a real building, not the precinct", () => {
    const areas = temples.map((f) => polygonAreaM2(f.geometry as never));
    const biggest = Math.max(...areas);
    // Real viharns and chedis run to a few thousand m². The precinct was
    // 180,716 m² — two orders of magnitude larger than any real building here.
    expect(biggest).toBeLessThan(20_000);
  });

  it("has no feature classified as a temple compound grounds plate", () => {
    // isGroundsCompound() existed only to flatten that one rectangle. With it
    // gone, nothing should still be a compound, and if something large and
    // temple-shaped reappears it will be caught here rather than on screen.
    const compounds = fc.features.filter((f) =>
      isGroundsCompound(f.properties as never, polygonAreaM2(f.geometry as never)),
    );
    expect(compounds.map((f) => f.id)).toHaveLength(0);
  });
});

describe("the chedi footprint is consistent with the nomination", () => {
  it("is the hand-authored chedi, and it is 56 m tall", () => {
    const chedi = fc.features.find((f) => f.id === "hand/mahatat-chedi") as
      | Feature<Polygon, { height?: number; nameTh?: string }>
      | undefined;
    expect(chedi).toBeDefined();
    // The panel, the parametric map model and this footprint must all say 56.
    expect(chedi!.properties.height).toBe(56);
    expect(estimateBuildingHeight(polygonAreaM2(chedi!.geometry as never), chedi!.properties as never).metres)
      .toBe(56);
  });

  it("is small enough to be the chedi base, not its precinct", () => {
    const chedi = fc.features.find((f) => f.id === "hand/mahatat-chedi") as
      | Feature<Polygon, Record<string, never>>
      | undefined;
    const { w, h } = extentM(chedi!.geometry.coordinates[0]);
    // The nomination gives a 28 m width; a stepped base a little wider is
    // expected. The old cloister was 452 m wide.
    expect(Math.max(w, h)).toBeLessThan(60);
  });
});
