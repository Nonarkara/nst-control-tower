/**
 * Terrain surface resampling.
 *
 * The DEM grid is a *sample* field, not a display mesh. Those are different
 * resolutions and conflating them is what made the relief read as a voxel
 * plateau: an extruded GridCellLayer draws one flat-topped box per SAMPLE, so a
 * 2.9 km sample becomes a 2.9 km cube with a 1,426 m mountain on it, and the
 * silhouette against the sky is a staircase of plateaus.
 *
 * Terrain is a smooth field — the truth is between the samples. So the renderer
 * resamples to a finer display grid with a C1 interpolant (Catmull-Rom), which
 * removes the staircase without inventing relief that the DEM does not support.
 * Separable Catmull-Rom is used rather than bilinear because bilinear is only C0:
 * it leaves a visible crease at every cell boundary, which just trades one
 * faceted surface for a finer faceted one.
 *
 * The grid file itself is never inflated — a future finer survey can replace it
 * wholesale and this keeps working.
 */

export interface TerrainSample {
  x: number;
  y: number;
  lng: number;
  lat: number;
  elevM: number;
}

export interface TerrainSource {
  cellLng: number;
  cellLat: number;
  cellM?: number;
  rows: number;
  cols: number;
  lngMin: number;
  latMin: number;
  cells: TerrainSample[];
}

export interface ResampledCell {
  lng: number;
  lat: number;
  elevM: number;
}

export interface ResampledSurface {
  /** Metric cell size of the returned grid. */
  cellM: number;
  cellLng: number;
  cellLat: number;
  rows: number;
  cols: number;
  /** Row-major, y ascending, cols per row. */
  cells: ResampledCell[];
  /** True when the source was already at or below the target and passed through. */
  passthrough: boolean;
}

const M_PER_DEG_LAT = 110_800;
const M_PER_DEG_LNG_AT_EQ = 111_320;

const metresPerDegLng = (lat: number) =>
  M_PER_DEG_LNG_AT_EQ * Math.cos((lat * Math.PI) / 180);

/** Catmull-Rom basis weights for t in [0,1) over p1..p2. */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Samples one past the edge are linearly EXTRAPOLATED, not clamped or mirrored.
 *
 * Catmull-Rom reproduces a linear field exactly only if its four-point
 * neighbourhood is itself linear. Clamping (P(-1)=P(0)) and mirroring
 * (P(-1)=P(1)) both break that: they fold the field back on itself, so the
 * first interval comes out with a kink, and a straight ramp stops being straight
 * along the envelope. Extrapolating P(-1) = 2·P(0) − P(1) keeps the
 * neighbourhood linear, so the surface has no false step at the border.
 *
 * Because the output grid is anchored to the source sample centres (see below),
 * extrapolation is only ever evaluated within half an output cell of the edge —
 * it smooths the seam rather than inventing distant terrain.
 */
function makeSampler(field: Float64Array, rows: number, cols: number) {
  return (xi: number, yi: number): number => {
    if (xi >= 0 && xi <= cols - 1 && yi >= 0 && yi <= rows - 1) return field[yi * cols + xi];
    if (cols < 2 || rows < 2) {
      const cx = xi < 0 ? 0 : xi >= cols ? cols - 1 : xi;
      const cy = yi < 0 ? 0 : yi >= rows ? rows - 1 : yi;
      return field[cy * cols + cx];
    }
    // Anchor on the nearest in-range cell, then step OUTWARD along whichever
    // axis is out of range — backwards means subtracting the step, forwards
    // means adding it. Both axes can be out at once (a corner neighbourhood),
    // and extrapolating both is the consistent bilinear answer.
    const cx = xi < 0 ? 0 : xi > cols - 1 ? cols - 1 : xi;
    const cy = yi < 0 ? 0 : yi > rows - 1 ? rows - 1 : yi;
    const base = field[cy * cols + cx];
    const stepX =
      xi < 0
        ? field[cy * cols] - field[cy * cols + 1] // Δ backwards = −(P1 − P0)
        : xi > cols - 1
          ? field[cy * cols + cols - 1] - field[cy * cols + cols - 2]
          : 0;
    const stepY =
      yi < 0
        ? field[cx] - field[cols + cx]
        : yi > rows - 1
          ? field[(rows - 1) * cols + cx] - field[(rows - 2) * cols + cx]
          : 0;
    return base + stepX + stepY;
  };
}

/**
 * What a grid file has to provide. Everything else is recovered by
 * `normalizeTerrainSource`, so an older file that omits `rows`/`cols`/the
 * envelope origin is accepted as-is.
 */
export type TerrainInput = Pick<TerrainSource, "cellLng" | "cellLat" | "cells"> & Partial<TerrainSource>;

/**
 * Fill in whatever a grid file did not declare.
 *
 * The index fields (`x`, `y`) are always present in the sample records, so the
 * raster dimensions can be recovered from them, and the envelope origin from the
 * samples minus half a cell. Callers should never have to special-case an older
 * grid file's shape.
 */
export function normalizeTerrainSource(grid: TerrainInput): TerrainSource {
  const { cells, cellLng, cellLat } = grid;
  let maxX = 0;
  let maxY = 0;
  let minLng = Infinity;
  let minLat = Infinity;
  for (const c of cells) {
    if (c.x > maxX) maxX = c.x;
    if (c.y > maxY) maxY = c.y;
    if (c.lng < minLng) minLng = c.lng;
    if (c.lat < minLat) minLat = c.lat;
  }
  return {
    cellLng,
    cellLat,
    cellM: grid.cellM,
    // Sample centres sit half a cell in from the envelope's SW corner.
    lngMin: grid.lngMin ?? minLng - cellLng / 2,
    latMin: grid.latMin ?? minLat - cellLat / 2,
    rows: grid.rows ?? maxY + 1,
    cols: grid.cols ?? maxX + 1,
    cells,
  };
}

/**
 * Resample a DEM grid to `targetCellM` square cells, or return it untouched if
 * it is already that fine or finer.
 */
export function resampleTerrain(
  srcIn: TerrainInput,
  targetCellM: number,
  seaLevelM = 0,
): ResampledSurface {
  const src = normalizeTerrainSource(srcIn);
  const sourceCellM = src.cellM ?? Math.round(src.cellLat * M_PER_DEG_LAT);
  const cellLng = src.cellLng;
  const cellLat = src.cellLat;

  // Already fine enough — inflating it would fabricate detail that isn't there.
  if (sourceCellM <= targetCellM) {
    const { rows, cols } = normalizeTerrainSource(src);
    return {
      cellM: sourceCellM,
      cellLng,
      cellLat,
      rows,
      cols,
      cells: src.cells.map((c) => ({ lng: c.lng, lat: c.lat, elevM: c.elevM })),
      passthrough: true,
    };
  }

  // Rasterise the samples into a dense field, row-major, y ascending. Sample
  // indices are already in range, so they are written directly; `mirror` is
  // only for the interpolation neighbourhood, which reaches past the edge.
  const { rows, cols } = src;
  const field = new Float64Array(rows * cols);
  for (const c of src.cells) {
    if (c.x < 0 || c.y < 0 || c.x >= cols || c.y >= rows) continue;
    field[c.y * cols + c.x] = c.elevM;
  }
  const at = makeSampler(field, rows, cols);

  // Source sample pitch in metres, per axis. These differ: at 8.6° N a degree
  // of longitude is 1.1% shorter than a degree of latitude.
  const srcMlng = cellLng * metresPerDegLng((src.latMin + (rows * cellLat) / 2));
  const srcMlat = cellLat * M_PER_DEG_LAT;

  // The output grid is anchored to the SOURCE SAMPLE CENTRES, not to the source
  // cell envelope. Sample 0 sits half a cell in from the envelope's edge, so a
  // grid that preserved the envelope would place its first cell centre *outside*
  // the outermost sample — the interpolation then has to extrapolate through a
  // degenerate mirrored neighbourhood and the surface develops a false step at
  // the border. Anchoring to the samples costs half a source cell of extent at
  // each edge (invisible on a 170 km province) and keeps every output cell inside
  // the convex hull of real data.
  const outRows = Math.max(2, Math.round(((rows - 1) * srcMlat) / targetCellM) + 1);
  const outCols = Math.max(2, Math.round(((cols - 1) * srcMlng) / targetCellM) + 1);
  const outCellM = Math.round(((rows - 1) * srcMlat) / (outRows - 1));

  const cells: ResampledCell[] = [];
  for (let r = 0; r < outRows; r++) {
    // Output row centre → fractional source row, landing exactly on sample 0
    // and on the last sample at the far edge.
    const fy = (r * (rows - 1)) / (outRows - 1);
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    for (let c = 0; c < outCols; c++) {
      const fx = (c * (cols - 1)) / (outCols - 1);
      const x0 = Math.floor(fx);
      const tx = fx - x0;

      // Separable: interpolate down each of the 4 surrounding columns in y,
      // then across them in x.
      const col: number[] = [];
      for (let k = -1; k <= 2; k++) {
        col.push(
          catmullRom(
            at(x0 + k, y0 - 1),
            at(x0 + k, y0),
            at(x0 + k, y0 + 1),
            at(x0 + k, y0 + 2),
            ty,
          ),
        );
      }
      const elevM = catmullRom(col[0], col[1], col[2], col[3], tx);

      cells.push({
        // Position follows the same mapping the interpolation used, so the
        // drawn cell sits on the value it carries.
        lng: src.lngMin + (fx + 0.5) * cellLng,
        lat: src.latMin + (fy + 0.5) * cellLat,
        // A Catmull-Rom overshoot can dip slightly below zero at a shoreline.
        // Clamp to the sea so the renderer still drops it rather than drawing a
        // pit in the water.
        elevM: elevM <= seaLevelM ? seaLevelM : Math.round(elevM * 10) / 10,
      });
    }
  }

  return {
    cellM: outCellM,
    cellLng: ((cols - 1) * cellLng) / (outCols - 1),
    cellLat: ((rows - 1) * cellLat) / (outRows - 1),
    rows: outRows,
    cols: outCols,
    cells,
    passthrough: false,
  };
}
