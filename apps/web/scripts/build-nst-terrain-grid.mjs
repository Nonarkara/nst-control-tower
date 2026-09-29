#!/usr/bin/env node
/**
 * Build a province elevation grid for a true-3D extruded terrain layer.
 *
 * Run from apps/web/:  node scripts/build-nst-terrain-grid.mjs
 *
 * deck.gl's TerrainLayer does not render in this app's DeckGL-as-camera /
 * MapLibre-basemap setup, but deck's EXTRUDED layers do (the 3D buildings prove
 * it). So instead of a DEM mesh we sample a regular grid of ground elevations
 * (Open-Meteo elevation API — free, no key, ~90 m DEM) and render it as an
 * extruded GridCellLayer: real Khao Luang relief you can pitch around, using a
 * primitive that is known to work here.
 *
 * ## Why the grid is sampled at ~700 m, not at the province envelope
 *
 * The first build ran at 46×60 (~2.9 km cells). That is coarser than the CITY:
 * the 2,459 mapped buildings span 12×13 km, so four coarse cells covered the
 * entire urban area and the old town sat inside a single 2.9 km block. Relief
 * read as a voxel plateau rather than a landscape.
 *
 * The source is a ~90 m DEM behind a free API, so there is no reason to
 * undersample it. CELL_M=700 gives ~250×150 cells — an order of magnitude of
 * extra real detail for ~7 minutes of requests, and a cell that is small
 * relative to a city block.
 *
 * ## Why sea samples are skipped
 *
 * 29.7% of the province rectangle is the Gulf. Open-Meteo returns 0 for those,
 * and a 0 m cell is invisible in an extruded layer — but it still costs a
 * request. Sub-cells whose COARSE parent is already at sea level are therefore
 * never fetched and are emitted as 0 so the coastline stays consistent with the
 * previous build.
 *
 * ## Output
 * public/geo/nst/terrain-grid.json
 *   { cellDeg, cols, rows, lngMin, latMin, latMax, lngMax, cells: [...] }
 *
 * `latMax`/`lngMax` are new and explicit: the resampler needs the true extent
 * and no longer has to infer it from the cell count.
 *
 * Writes are staged to a `.next.json` file and renamed into place, so an
 * interrupted or failed run leaves the previous grid intact and a second run
 * does not mistake the refined grid for its own coarse parent.
 */

import fs from "node:fs/promises";
import path from "node:path";

// The refinement reads the CURRENT grid and replaces it, so the two paths must
// differ: stage the new grid, then swap it in. Overwriting in place would make
// a second run treat the refined grid as its own "coarse" parent.
const OUT = path.resolve("public/geo/nst/terrain-grid.next.json");
const PARTIAL = path.resolve("public/geo/nst/terrain-grid.partial.json");
const FINAL = path.resolve("public/geo/nst/terrain-grid.json");
const COARSE = FINAL;
const ELEV_URL = "https://api.open-meteo.com/v1/elevation";
const BATCH = 100;

// Province envelope (Khao Luang → Gulf). [latMin, lngMin, latMax, lngMax].
const LAT_MIN = 7.85, LNG_MIN = 99.35, LAT_MAX = 9.4, LNG_MAX = 100.3;

// Target cell size in METRES, not in columns. deck.gl's GridCellLayer takes a
// single scalar cellSize and therefore draws square cells; if the sample
// spacing is not square in metres, either the surface gaps or it overlaps.
// Deriving the counts from a metric target (and a mid-latitude cosine) makes
// the grid square by construction, which removes the old "overlap slightly so
// the relief reads as continuous" hack — that hack was papering over a grid
// that was 26% wider in longitude than in latitude.
const CELL_M = Number(process.env.CELL_M ?? 700);
const M_PER_DEG_LAT = 110_800;
const M_PER_DEG_LNG_AT_EQ = 111_320;
const MID_LAT = (LAT_MIN + LAT_MAX) / 2;
const mPerDegLng = M_PER_DEG_LNG_AT_EQ * Math.cos((MID_LAT * Math.PI) / 180);

const ROWS = Math.round(((LAT_MAX - LAT_MIN) * M_PER_DEG_LAT) / CELL_M);
const COLS = Math.round(((LNG_MAX - LNG_MIN) * mPerDegLng) / CELL_M);

/** The pre-refinement grid, used only to decide which points are worth asking for. */
async function loadCoarse() {
  try {
    return JSON.parse(await fs.readFile(COARSE, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Fetch elevations for `points`, resuming from a partial file if one exists.
 *
 * The elevation endpoint rate-limits aggressively: a naive 1.2 s-paced run of
 * 25,661 points died on a 429 at 4,900. So:
 *   - a 429 honours the server's Retry-After (seconds or HTTP-date) instead of
 *     guessing with a fixed backoff, and is allowed far more attempts than a
 *     network error;
 *   - every batch is appended to `partialPath` before the next request is made,
 *     so a killed run resumes instead of re-paying for what it already fetched.
 */
async function fetchElevations(points, partialPath) {
  const have = new Map();
  try {
    for (const c of JSON.parse(await fs.readFile(partialPath, "utf8"))) have.set(`${c.x},${c.y}`, c);
  } catch { /* no partial yet */ }

  const todo = points.filter((p) => !have.has(`${p.x},${p.y}`));
  if (have.size) console.log(`  resuming: ${have.size} samples already paid for, ${todo.length} to go`);
  const out = [...have.values()];

  const save = () => fs.writeFile(partialPath, JSON.stringify(out));

  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    const lat = chunk.map((p) => p.lat.toFixed(4)).join(",");
    const lng = chunk.map((p) => p.lng.toFixed(4)).join(",");
    let elevations = null;
    // A 429 is a pacing signal, not a failure: keep trying it far longer.
    const maxAttempts = 40;
    for (let attempt = 0; attempt < maxAttempts && !elevations; attempt++) {
      let retryAfterMs = 0;
      try {
        const res = await fetch(`${ELEV_URL}?latitude=${lat}&longitude=${lng}`, { signal: AbortSignal.timeout(30_000) });
        if (res.status === 429) {
          // The free tier also has a DAILY request cap, and it answers 429
          // with a reason that no amount of waiting will clear. Retrying that
          // 40 times just burns twenty minutes to arrive at the same answer.
          const body = await res.text();
          if (/daily|limit exceeded|try again tomorrow/i.test(body)) {
            // Marked fatal so the catch below rethrows instead of retrying.
            const err = new Error(
              `Open-Meteo daily request limit reached — re-run tomorrow; the partial file keeps whatever was already fetched.\n  ${body.trim()}`,
            );
            err.fatal = true;
            throw err;
          }
          const ra = Number(res.headers.get("Retry-After"));
          retryAfterMs = (Number.isFinite(ra) && ra > 0 ? ra * 1000 : 0) || 30_000 * (attempt + 1);
          await new Promise((r) => setTimeout(r, retryAfterMs));
          continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        elevations = (await res.json()).elevation;
      } catch (e) {
        if (e.fatal) throw e;
        if (attempt === maxAttempts - 1) throw e;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    if (!elevations) throw new Error("exhausted retries on a batch");
    chunk.forEach((p, j) => out.push({ ...p, elevM: Math.round(elevations[j]) }));
    process.stdout.write(`  elevation ${i + chunk.length}/${todo.length} (+${have.size} resumed)\r`);
    await save();
    await new Promise((r) => setTimeout(r, 1500));
  }
  process.stdout.write("\n");
  return out;
}

async function main() {
  const cellLng = (LNG_MAX - LNG_MIN) / COLS;
  const cellLat = (LAT_MAX - LAT_MIN) / ROWS;

  const coarse = await loadCoarse();
  // Without the old grid we simply ask about every point.
  const isSea = (lng, lat) => {
    if (!coarse?.cells?.length) return false;
    const x = Math.floor((lng - coarse.lngMin) / coarse.cellLng);
    const y = Math.floor((lat - coarse.latMin) / coarse.cellLat);
    if (x < 0 || y < 0 || x >= coarse.cols || y >= coarse.rows) return false;
    return coarse.cells[y * coarse.cols + x]?.elevM <= 0;
  };

  const pts = [];
  let skipped = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const lng = LNG_MIN + (x + 0.5) * cellLng;
      const lat = LAT_MIN + (y + 0.5) * cellLat;
      if (isSea(lng, lat)) {
        // Emit as sea rather than dropping it: the grid stays a complete,
        // rectangular sample of the envelope, and the renderer skips 0 m.
        pts.push({ x, y, lng, lat, elevM: 0, sea: true });
        skipped++;
      } else {
        pts.push({ x, y, lng, lat });
      }
    }
  }
  const toFetch = pts.filter((p) => !p.sea);
  console.log(
    `Sampling ${toFetch.length} elevation points (${COLS}×${ROWS} grid, ~${Math.round(cellLat * 110800)} m cells); ` +
    `${skipped} sea points skipped from the coarse grid…`,
  );

  const fetched = await fetchElevations(toFetch, PARTIAL);
  const byKey = new Map(fetched.map((p) => [`${p.x},${p.y}`, p]));
  const cells = pts.map((p) => {
    const hit = byKey.get(`${p.x},${p.y}`);
    return { x: p.x, y: p.y, lng: round(p.lng), lat: round(p.lat), elevM: hit ? hit.elevM : 0 };
  });

  const elevs = cells.map((c) => c.elevM);
  const grid = {
    cellDeg: cellLat,
    cellLng,
    cellLat,
    // Metric cell size, so the renderer can build square cells without
    // re-deriving the cosine. cellLng * mPerDegLng === cellLat * M_PER_DEG_LAT
    // to within the rounding of COLS/ROWS.
    cellM: Math.round(((LAT_MAX - LAT_MIN) * M_PER_DEG_LAT) / ROWS),
    cols: COLS,
    rows: ROWS,
    lngMin: LNG_MIN,
    latMin: LAT_MIN,
    latMax: LAT_MAX,
    lngMax: LNG_MAX,
    cells,
  };
  await fs.writeFile(OUT, JSON.stringify(grid));
  await fs.rename(OUT, FINAL);
  // The whole envelope is now sampled, so the resume file has done its job.
  await fs.rm(PARTIAL, { force: true });
  console.log(`Wrote ${cells.length} cells → ${FINAL}`);
  console.log(`  elevation range: ${Math.min(...elevs)} – ${Math.max(...elevs)} m`);
  console.log(`  above sea level: ${cells.filter((c) => c.elevM > 0).length}`);
}

const round = (n) => Number(n.toFixed(6));

main().catch((e) => { console.error("build-nst-terrain-grid failed:", e); process.exit(1); });
