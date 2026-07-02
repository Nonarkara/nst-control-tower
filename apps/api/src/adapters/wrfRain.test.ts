import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseAscWindow, windowStats } from "./wrfRain";

/**
 * WRF-ROMS rain adapter contract tests.
 *
 * parseAscWindow / windowStats are exercised directly with a synthetic ESRI
 * ASCII grid whose geometry mirrors the real d03 grid (cell 0.0271°, origin
 * 95.48E 3.64N) but tiny — the row/col window math is identical, so an
 * off-by-one here is an off-by-one against the real feed.
 *
 * fetchWrfRainOutlook is tested via mocked fetch: run discovery must walk
 * candidate run folders (today 12UTC → today 00UTC → yesterday…), and total
 * API failure must yield the unavailable tier, not a throw.
 */

// A grid whose rows we can reason about by hand. We place it so its cells
// straddle the NST province window (99.3–100.35E, 7.8–9.45N) with origins
// deliberately OFF the window boundaries (the real d03 grid never aligns
// exactly either, and exact-boundary floors are float-noise lotteries):
// 6 cols from 98.95E, 8 rows from 7.45N, cell 0.3° (north-first rows).
// → kept cols 1..4 (99.25–100.45), kept rows 1..6 (7.75–9.55).
function syntheticAsc(valueAt: (row: number, col: number) => number): string {
  const ncols = 6;
  const nrows = 8;
  const lines = [
    `NCOLS ${ncols}`,
    `NROWS ${nrows}`,
    "XLLCORNER 98.95",
    "YLLCORNER 7.45",
    "CELLSIZE 0.3",
    "NODATA_value -9999",
  ];
  for (let r = 0; r < nrows; r++) {
    lines.push(Array.from({ length: ncols }, (_, c) => valueAt(r, c)).join(" "));
  }
  return lines.join("\n");
}

describe("parseAscWindow", () => {
  it("clips to the province window and preserves north-first row order", () => {
    // Encode position into value: r*10 + c — lets us assert exactly which
    // cells got kept.
    const w = parseAscWindow(syntheticAsc((r, c) => r * 10 + c));
    expect(w).not.toBeNull();
    // Cols: c0 = floor((99.3−98.95)/0.3) = 1, c1 = floor((100.35−98.95)/0.3) = 4.
    expect(w!.ncols).toBe(4);
    expect(w!.lngMin).toBeCloseTo(99.25, 6);
    // Rows (north-first): rTop = 8−1−floor((9.45−7.45)/0.3) = 1,
    // rBot = 8−1−floor((7.8−7.45)/0.3) = 6 → asc rows 1..6 (6 rows).
    expect(w!.nrows).toBe(6);
    expect(w!.latMax).toBeCloseTo(9.55, 6);
    // First kept value = asc row 1, col 1 → 11.
    expect(w!.valuesMm[0]).toBe(11);
    // Last kept value = asc row 6, col 4 → 64.
    expect(w!.valuesMm[w!.valuesMm.length - 1]).toBe(64);
  });

  it("maps NODATA cells to −1", () => {
    const w = parseAscWindow(syntheticAsc((r, c) => (r === 2 && c === 2 ? -9999 : 1)));
    expect(w!.valuesMm).toContain(-1);
    expect(w!.valuesMm.filter((v) => v === -1)).toHaveLength(1);
  });

  it("returns null for malformed/headerless input", () => {
    expect(parseAscWindow("not a grid")).toBeNull();
    expect(parseAscWindow("")).toBeNull();
  });
});

describe("windowStats", () => {
  it("computes mean/max over a box, excluding NODATA", () => {
    const w = parseAscWindow(syntheticAsc((r, c) => (r === 3 ? (c === 3 ? -9999 : 10) : 2)))!;
    // Whole retained window:
    const all = windowStats(w, { lngMin: 99.2, lngMax: 100.8, latMin: 7.7, latMax: 9.6 });
    expect(all.maxMm).toBe(10);
    expect(all.meanMm).toBeGreaterThan(2);
    expect(all.meanMm).toBeLessThan(10);
  });

  it("returns zeros for a box with no cells", () => {
    const w = parseAscWindow(syntheticAsc(() => 5))!;
    const empty = windowStats(w, { lngMin: 0, lngMax: 1, latMin: 0, latMax: 1 });
    expect(empty).toEqual({ meanMm: 0, maxMm: 0 });
  });
});

describe("fetchWrfRainOutlook — run discovery + degradation (isolated)", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-07-02T10:00:00Z"));
  });

  it("falls back through run candidates until one serves day1", async () => {
    vi.resetModules();
    const requested: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      requested.push(u);
      // Only yesterday's 12UTC run exists (the observed real-world lag).
      if (u.includes("2026-07-01_12UTC")) {
        return Promise.resolve(new Response(syntheticAsc(() => 4), { status: 200 }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchWrfRainOutlook: fresh } = await import("./wrfRain");
    const feed = await fresh();

    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.meta.note).toContain("2026-07-01_12UTC");
    expect(feed.features).toHaveLength(3);
    expect(feed.features[0].day).toBe(1);
    // Discovery walked today's runs first.
    expect(requested.some((u) => u.includes("2026-07-02_12UTC"))).toBe(true);
    // Uniform 4 mm grid → catchment mean 4.
    expect(feed.features[0].catchmentMeanMm).toBe(4);
    expect(feed.features[1].validDate).toBe("2026-07-02");
    vi.restoreAllMocks();
  });

  it("returns unavailable tier when no run candidate responds", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));
    const { fetchWrfRainOutlook: fresh } = await import("./wrfRain");
    const feed = await fresh();
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });
});

describe("fetchWrfRainGrid (isolated)", () => {
  it("returns a compact grid whose dims match the parse window", async () => {
    vi.resetModules();
    vi.setSystemTime(new Date("2026-07-02T10:00:00Z"));
    vi.spyOn(globalThis, "fetch").mockImplementation((url) =>
      Promise.resolve(
        String(url).includes("2026-07-02_12UTC")
          ? new Response(syntheticAsc((r, c) => r + c), { status: 200 })
          : new Response(null, { status: 404 }),
      ),
    );
    const { fetchWrfRainGrid: fresh } = await import("./wrfRain");
    const feed = await fresh(2);
    expect(feed.meta.fallbackTier).toBe("live");
    const g = feed.features[0];
    expect(g.day).toBe(2);
    expect(g.valuesMm).toHaveLength(g.ncols * g.nrows);
    expect(g.ncols).toBe(4);
    expect(g.nrows).toBe(6);
    vi.restoreAllMocks();
  });
});
