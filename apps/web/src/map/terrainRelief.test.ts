import { describe, test, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as L from "./layers";
import type { TerrainCell, TerrainGrid } from "./layers";

/**
 * Regression guards for the 3D relief layer.
 *
 * Every test here corresponds to a defect that was LIVE on the map and that
 * only the geometry makes obvious. None of them are style preferences: each one
 * fails on the old implementation, and each was measured rather than eyeballed.
 */

/** 2×2 fixture: a sea cell, a coastal cell and two upland cells. */
const GRID: TerrainGrid = {
  cellLng: 0.0063,
  cellLat: 0.0063,
  cellM: 700,
  rows: 2,
  cols: 2,
  lngMin: 99.40,
  latMin: 8.10,
  cells: [
    { x: 0, y: 0, lng: 99.40315, lat: 8.10315, elevM: 0 },
    { x: 1, y: 0, lng: 99.40945, lat: 8.10315, elevM: 3 },
    { x: 0, y: 1, lng: 99.40315, lat: 8.10945, elevM: 40 },
    { x: 1, y: 1, lng: 99.40945, lat: 8.10945, elevM: 900 },
  ],
};

const props = (layer: unknown) => (layer as unknown as { props: Record<string, unknown> }).props;

describe("terrain relief: the sea is not drawn", () => {
  const landOnly = (g: TerrainGrid) =>
    (props(L.terrain3dLayer(g)).data as Array<{ elevM: number }>).map((c) => c.elevM);

  it("drops cells at or below sea level", () => {
    // 29.7% of the province rectangle is the Gulf. A 0 m cell extrudes to no
    // height but is STILL a filled tile, so every one of them laid a flat
    // opaque rectangle over the ocean and the coastal plain.
    const data = landOnly(GRID);
    expect(data).not.toContain(0);
    expect(data.every((e) => e > L.SEA_LEVEL_M)).toBe(true);
  });

  it("keeps a cell sitting exactly on the sea-level threshold out", () => {
    const atThreshold: TerrainGrid = {
      ...GRID,
      cells: [{ x: 0, y: 0, lng: 99.40315, lat: 8.10315, elevM: L.SEA_LEVEL_M }],
    };
    expect(landOnly(atThreshold)).toHaveLength(0);
  });

  it("keeps the cell immediately above the threshold", () => {
    const justAbove: TerrainGrid = {
      ...GRID,
      cells: [{ x: 0, y: 0, lng: 99.40315, lat: 8.10315, elevM: L.SEA_LEVEL_M + 1 }],
    };
    expect(landOnly(justAbove)).toHaveLength(1);
  });
});

describe("terrain relief: cells are centre-anchored", () => {
  it("positions a cell on its own sample, with no half-cell offset", () => {
    // GridCellLayer builds a ColumnLayer with `radius: cellSize / 2`, so a cell
    // is CENTRED on getPosition. The old code subtracted half a cell on both
    // axes, sliding the whole massif ~1.4 km south and ~1.1 km west of the
    // city it was supposed to be sitting under.
    const getPosition = props(L.terrain3dLayer(GRID)).getPosition as (c: TerrainCell) => [number, number];
    // Half a cell is 0.00315°; a half-cell shift is ~350 m — a quarter of the
    // old cell's 1.4 km error, but the same class of bug.
    expect(getPosition({ x: 0, y: 0, lng: 99.40315, lat: 8.10315, elevM: 900 })).toEqual([99.40315, 8.10315]);
  });

  it("keeps a cell's own sample coordinates, not a shifted neighbour's", () => {
    // A half-cell offset lands exactly on the midpoint between two samples, so
    // the bug is invisible unless the test uses a coordinate that is not itself
    // a midpoint.
    const odd: TerrainGrid = {
      ...GRID,
      cells: [{ x: 0, y: 0, lng: 99.40777, lat: 8.10431, elevM: 500 }],
    };
    const getPosition = props(L.terrain3dLayer(odd)).getPosition as (c: TerrainCell) => [number, number];
    const [lng, lat] = getPosition(odd.cells[0]);
    expect(lng).toBe(99.40777);
    expect(lat).toBe(8.10431);
  });
});

describe("terrain relief: the city is not buried", () => {
  it("defaults to true scale", () => {
    // The city sits on a 5 m sample. At the old 6× exaggeration that cell's
    // floor was lifted to 30 m, above the median 13 m building (8 m × 1.65) —
    // so the plain floated over the city and buildings poked out of a slab.
    expect(props(L.terrain3dLayer(GRID)).elevationScale).toBe(1);
  });

  it("never lets terrain exceed the tallest building on the same ground", () => {
    // The invariant, stated as arithmetic rather than as a magic number: with
    // terrain at 1× the ground never rises above the modelled 78 m maximum
    // building, so occlusion between the two is physically possible instead of
    // guaranteed.
    const citySample = 5; // m, measured at 8.12 N 99.94 E
    const tallestBuilding = 78; // m, max of the modelled NST heights
    expect(citySample * (props(L.terrain3dLayer(GRID)).elevationScale as number)).toBeLessThan(tallestBuilding);
  });
});

describe("terrain relief: cell geometry", () => {
  it("draws square cells, not a longitude-wide overlap", () => {
    // GridCellLayer takes one scalar cellSize and draws square cells. The old
    // code derived it from the LATITUDE spacing alone, so in a grid whose
    // longitude spacing is 1.1% shorter, every cell was 26% wider than the gap
    // between its neighbours and the surface overlapped itself.
    expect(props(L.terrain3dLayer(GRID)).cellSize).toBe(700);
  });

  it("keeps a fine source grid at its own cell size", () => {
    const fine: TerrainGrid = { ...GRID, cellM: 400, cellLng: 0.0036, cellLat: 0.0036 };
    expect(props(L.terrain3dLayer(fine)).cellSize).toBe(400);
  });
});

describe("terrain relief: the ramp reads as relief, not as a slab", () => {
  const luminance = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

  it("rises monotonically in luminance, so relief reads in greyscale", () => {
    for (let e = L.SEA_LEVEL_M; e < 2000; e += 5) {
      const here = luminance(L.terrainRGBA(e).slice(0, 3) as number[]);
      const next = luminance(L.terrainRGBA(e + 5).slice(0, 3) as number[]);
      expect(next, `luminance fell between ${e} m and ${e + 5} m`).toBeGreaterThanOrEqual(here - 1);
    }
  });

  it("rises monotonically in alpha, so the coastal plain recedes", () => {
    for (let e = L.SEA_LEVEL_M; e < 2000; e += 5) {
      expect(L.terrainRGBA(e + 5)[3], `alpha fell between ${e} m and ${e + 5} m`)
        .toBeGreaterThanOrEqual(L.terrainRGBA(e)[3] - 1);
    }
  });

  it("is fully transparent at sea level and solid on the high ridges", () => {
    expect(L.terrainRGBA(L.SEA_LEVEL_M)[3]).toBe(0);
    expect(L.terrainRGBA(1500)[3]).toBeGreaterThanOrEqual(235);
  });

  it("is lighter than the old slab everywhere on land", () => {
    // The previous ramp bottomed out at rgb(40,72,52) — luminance 65, darker
    // than the basemap it was covering. Nothing on land may be that dark again.
    for (const e of [L.SEA_LEVEL_M + 1, 20, 100, 500, 1200, 1800]) {
      expect(luminance(L.terrainRGBA(e).slice(0, 3) as number[]), `${e} m is too dark`).toBeGreaterThan(100);
    }
  });

  it("keeps the city readable rather than painting it over", () => {
    // The city sample is 5 m; the whole point of the alpha ramp is that the
    // plain under the city lets the basemap, streets and waterways through.
    expect(L.terrainRGBA(5)[3]).toBeLessThan(150);
  });
});

describe("3D buildings are lit", () => {
  const emptyFc = { type: "FeatureCollection", features: [] } as never;

  it("uses Phong material when extruded", () => {
    // `material` was an option that no caller ever passed, so every 3D
    // building shipped with `material: false` — no lighting at all. An
    // extruded box with no light has identical top and side faces: 2,459
    // buildings rendered as flat cardboard cut-outs.
    const material = props(L.buildingsLayer(emptyFc, { extruded: true })).material;
    expect(material).not.toBe(false);
    expect(material).toMatchObject({ ambient: expect.any(Number), diffuse: expect.any(Number) });
  });

  it("keeps the lighting ratio high enough to show form", () => {
    // A lit face gets ambient + diffuse, an unlit face only ambient. If the
    // ratio collapses toward 1:1 the boxes go flat again — the bug.
    const m = props(L.buildingsLayer(emptyFc, { extruded: true })).material as {
      ambient: number; diffuse: number; specularColor: number[];
    };
    const ratio = (m.ambient + m.diffuse) / m.ambient;
    expect(ratio).toBeGreaterThan(1.8);
  });

  it("uses a neutral, dim specular rather than a warm gloss", () => {
    const m = props(L.buildingsLayer(emptyFc, { extruded: true })).material as { specularColor: number[] };
    const [r, g, b] = m.specularColor;
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(r).toBeLessThan(100);
  });

  it("stays unlit in 2D, where extrusion does not apply", () => {
    expect(props(L.buildingsLayer(emptyFc, { extruded: false })).material).toBe(false);
  });

  it("strokes extruded buildings so blocks do not fuse into one mass", () => {
    expect(props(L.buildingsLayer(emptyFc, { extruded: true })).stroked).toBe(true);
  });
});

describe("the shipped elevation grid renders as a surface, not a plateau", () => {
  const file = path.resolve(__dirname, "../../public/geo/nst/terrain-grid.json");
  const grid = JSON.parse(fs.readFileSync(file, "utf8")) as TerrainGrid;
  const data = props(L.terrain3dLayer(grid)).data as Array<{ elevM: number }>;

  it("renders at a display cell size small enough to carry a city", () => {
    // The DEM on disk is 2,876 m samples — coarser than the 12 km city, so
    // four of them covered the whole urban area. Display resolution is
    // therefore decoupled from sample resolution (lib/terrainSurface.ts) and
    // the relief is subdivided before it is drawn.
    expect(props(L.terrain3dLayer(grid)).cellSize as number).toBeLessThanOrEqual(1000);
  });

  it("draws many more cells than the file contains samples", () => {
    expect(data.length).toBeGreaterThan(grid.cells.length);
  });

  it("draws no sea", () => {
    expect(data.every((c) => c.elevM > L.SEA_LEVEL_M)).toBe(true);
  });
});
