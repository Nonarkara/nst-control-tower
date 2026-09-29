import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { resampleTerrain, normalizeTerrainSource, type TerrainSource } from "./terrainSurface";

/**
 * These tests are about geometry, not appearance. The claim under test is
 * "the relief is a smooth surface, not a staircase of flat-topped boxes", and
 * the way to check that without a GPU is to measure the second difference of
 * the elevation field: a staircase has a large one at every cell boundary.
 */

/** A DEM of `cols`×`rows` samples whose elevation is `fn(x, y)`. */
function field(cols: number, rows: number, fn: (x: number, y: number) => number, cellDeg = 0.01): TerrainSource {
  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({ x, y, lng: 99 + (x + 0.5) * cellDeg, lat: 8 + (y + 0.5) * cellDeg, elevM: fn(x, y) });
    }
  }
  return { cellLng: cellDeg, cellLat: cellDeg, rows, cols, lngMin: 99, latMin: 8, cells };
}

/** Largest |Δ| between horizontally adjacent cells, per row, over the whole grid. */
function maxAdjacentStep(surface: { cells: Array<{ elevM: number }> }, cols: number): number {
  let worst = 0;
  for (let i = 0; i + 1 < surface.cells.length; i += 1) {
    if ((i + 1) % cols === 0) continue;
    worst = Math.max(worst, Math.abs(surface.cells[i + 1].elevM - surface.cells[i].elevM));
  }
  return worst;
}

describe("resampleTerrain passes a fine grid through untouched", () => {
  const fine = field(40, 40, (x, y) => x + y, 0.005);

  it("does not inflate a grid that is already at the target", () => {
    const s = resampleTerrain(fine, 700);
    expect(s.passthrough).toBe(true);
    expect(s.cells).toHaveLength(fine.cells.length);
  });

  it("keeps the source cell size when passing through", () => {
    expect(resampleTerrain(fine, 700).cellM).toBe(Math.round(0.005 * 110_800));
  });
});

describe("resampleTerrain upsamples a coarse grid", () => {
  const coarse = field(10, 10, (x, y) => 100 * Math.sin(x / 3) * Math.cos(y / 3), 0.026);

  it("produces more, smaller cells", () => {
    const s = resampleTerrain(coarse, 700);
    expect(s.passthrough).toBe(false);
    expect(s.cells.length).toBeGreaterThan(coarse.cells.length * 4);
    expect(s.cellM).toBeLessThan(1000);
  });

  it("reports a cell size that matches the spacing it actually emitted", () => {
    // Guards against a cellM that disagrees with the geometry — the renderer
    // builds square cells from cellM, so a wrong value gaps or overlaps.
    const s = resampleTerrain(coarse, 700);
    // Across a row is a longitude step; down a column is a latitude step.
    const east = s.cells[1];
    const north = s.cells[s.cols];
    const dLngM = (east.lng - s.cells[0].lng) * 111_320 * Math.cos((s.cells[0].lat * Math.PI) / 180);
    const dLatM = (north.lat - s.cells[0].lat) * 110_800;
    expect(Math.abs(dLngM - s.cellM) / s.cellM).toBeLessThan(0.05);
    expect(Math.abs(dLatM - s.cellM) / s.cellM).toBeLessThan(0.05);
  });

  it("holds the envelope it was given", () => {
    const s = resampleTerrain(coarse, 700);
    const src = normalizeTerrainSource(coarse);
    expect(Math.min(...s.cells.map((c) => c.lng))).toBeGreaterThanOrEqual(src.lngMin);
    expect(Math.max(...s.cells.map((c) => c.lat))).toBeLessThanOrEqual(
      src.latMin + src.rows * src.cellLat,
    );
  });

  it("is deterministic", () => {
    expect(resampleTerrain(coarse, 700)).toEqual(resampleTerrain(coarse, 700));
  });
});

describe("resampleTerrain removes the staircase", () => {
  const coarse = field(12, 12, (x, y) => 900 * Math.exp(-(((x - 6) ** 2 + (y - 6) ** 2) / 18)), 0.026);

  it("cuts the largest step between neighbours by roughly the refinement factor", () => {
    // The thing being fixed: one flat-topped box per SAMPLE means the height
    // jumps the full step at every boundary. Spreading the same information
    // over more cells turns each jump into a ramp.
    const s = resampleTerrain(coarse, 700);
    const before = maxAdjacentStep(coarse, coarse.cols);
    const after = maxAdjacentStep(s, s.cols);
    expect(after).toBeLessThan(before / 2.5);
  });

  it("leaves no interior cell that is a flat plateau the neighbours are not", () => {
    // A staircase is exactly "many consecutive cells at identical elevation".
    // A smooth surface has almost none.
    const s = resampleTerrain(coarse, 700);
    let plateaus = 0;
    for (let i = 1; i < s.cells.length - 1; i += 1) {
      if (s.cells[i].elevM === s.cells[i - 1].elevM && s.cells[i].elevM === s.cells[i + 1].elevM) plateaus++;
    }
    expect(plateaus).toBeLessThan(s.cells.length * 0.02);
  });
});

describe("resampleTerrain is a faithful interpolant, not an invention", () => {
  it("reproduces a plane exactly", () => {
    // Catmull-Rom reproduces linear fields exactly, so a tilted plane must come
    // back as exact arithmetic progressions. If this drifts, the resampler is
    // fabricating or flattening relief.
    //
    // Tolerance is one output quantum, not zero: elevations are written to
    // 0.1 m (10 cm, far finer than a ~90 m DEM supports, and it halves the
    // size of a 36,000-cell grid), and quantising a straight line can put up to
    // one quantum of error in a second difference. The slack absorbs the binary
    // floating-point residue that makes the bound come out as 0.10000000000000142.
    const QUANTUM_M = 0.1;
    const plane = field(8, 8, (x, y) => 12 * x + 7 * y + 30, 0.026);
    const s = resampleTerrain(plane, 700);
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c + 2 < s.cols; c++) {
        const a = s.cells[r * s.cols + c].elevM;
        const b = s.cells[r * s.cols + c + 1].elevM;
        const d = s.cells[r * s.cols + c + 2].elevM;
        expect(Math.abs(d - 2 * b + a), `row ${r} col ${c} is not linear`)
          .toBeLessThanOrEqual(QUANTUM_M * 1.000001);
      }
    }
  });

  it("never exceeds the source range by more than Catmull-Rom overshoot allows", () => {
    // Offset off the floor so the sea-level clamp is not what is being tested.
    const src = field(14, 14, (x, y) => 50 + 1200 * Math.exp(-(((x - 7) ** 2 + (y - 7) ** 2) / 10)), 0.026);
    const lo = Math.min(...src.cells.map((c) => c.elevM));
    const hi = Math.max(...src.cells.map((c) => c.elevM));
    for (const c of resampleTerrain(src, 700, 0).cells) {
      expect(c.elevM).toBeLessThanOrEqual(hi * 1.05);
      expect(c.elevM).toBeGreaterThanOrEqual(lo * 0.95);
    }
  });

  it("clamps overshoot at the shoreline to sea level", () => {
    // Catmull-Rom can dip below zero just offshore. A negative cell would be
    // drawn as a pit, or slip past the sea-level filter.
    const src = field(10, 10, (x, y) => (x < 5 ? 0 : (x - 4) * 40), 0.026);
    for (const c of resampleTerrain(src, 700, 0).cells) {
      expect(c.elevM).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("normalizeTerrainSource recovers what a grid file omitted", () => {
  it("derives rows, cols and the envelope origin from the samples", () => {
    const bare = { cellLng: 0.01, cellLat: 0.01, cells: field(5, 3, () => 10, 0.01).cells };
    const n = normalizeTerrainSource(bare);
    expect(n.rows).toBe(3);
    expect(n.cols).toBe(5);
    expect(n.lngMin).toBeCloseTo(99, 6);
    expect(n.latMin).toBeCloseTo(8, 6);
  });

  it("resamples a grid that declares nothing but cells", () => {
    const bare = { cellLng: 0.026, cellLat: 0.026, cells: field(6, 6, (x) => x * 20, 0.026).cells };
    const s = resampleTerrain(bare, 700);
    expect(s.passthrough).toBe(false);
    expect(s.cells.length).toBeGreaterThan(36);
  });
});

describe("the shipped DEM survives resampling", () => {
  const file = path.resolve(__dirname, "../../public/geo/nst/terrain-grid.json");
  const grid = JSON.parse(fs.readFileSync(file, "utf8")) as TerrainSource;
  const s = resampleTerrain(grid, 700, 2);

  it("agrees with itself on the grid dimensions", () => {
    expect(grid.cells).toHaveLength(grid.rows * grid.cols);
  });

  it("renders at a display cell size small enough to carry a city", () => {
    // 2,876 m source cells were coarser than the 12 km city — four of them
    // covered the whole urban area, and the old town sat inside a single block.
    expect(s.cellM).toBeLessThanOrEqual(1000);
  });

  it("actually subdivides whatever the file contains", () => {
    expect(s.passthrough).toBe(false);
    expect(s.cells.length).toBeGreaterThan(grid.cells.length * 3);
  });

  it("keeps the highest peak of the province", () => {
    const srcMax = Math.max(...grid.cells.map((c) => c.elevM));
    const outMax = Math.max(...s.cells.map((c) => c.elevM));
    expect(outMax).toBeGreaterThan(srcMax * 0.95);
  });

  it("resamples the whole province in well under a frame", () => {
    const t0 = performance.now();
    resampleTerrain(grid, 700, 2);
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
