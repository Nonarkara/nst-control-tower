#!/usr/bin/env node
/**
 * Build a coarse province elevation grid for a true-3D extruded terrain layer.
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
 * Output: public/geo/nst/terrain-grid.json
 *   { cellDeg, cols, rows, lngMin, latMin, cells: [{ x, y, lng, lat, elevM }] }
 * Coarse by design (~3 km cells) — this is province relief context, not a DEM.
 */

import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/geo/nst/terrain-grid.json");
const ELEV_URL = "https://api.open-meteo.com/v1/elevation";
const BATCH = 100;

// Province envelope (Khao Luang → Gulf). [latMin, lngMin, latMax, lngMax].
const LAT_MIN = 7.85, LNG_MIN = 99.35, LAT_MAX = 9.4, LNG_MAX = 100.3;
const COLS = 46; // ~ (100.3-99.35)/46 ≈ 0.0207° ≈ 2.3 km
const ROWS = 60; // ~ (9.4-7.85)/60 ≈ 0.0258° ≈ 2.9 km

async function fetchElevations(points) {
  const out = [];
  for (let i = 0; i < points.length; i += BATCH) {
    const chunk = points.slice(i, i + BATCH);
    const lat = chunk.map((p) => p.lat.toFixed(4)).join(",");
    const lng = chunk.map((p) => p.lng.toFixed(4)).join(",");
    let elevations = null;
    for (let attempt = 0; attempt < 5 && !elevations; attempt++) {
      try {
        const res = await fetch(`${ELEV_URL}?latitude=${lat}&longitude=${lng}`, { signal: AbortSignal.timeout(30_000) });
        if (res.status === 429) throw new Error("429");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        elevations = (await res.json()).elevation;
      } catch (e) {
        if (attempt === 4) throw e;
        await new Promise((r) => setTimeout(r, (String(e.message).includes("429") ? 8000 : 1500) * (attempt + 1)));
      }
    }
    chunk.forEach((p, j) => out.push({ ...p, elevM: Math.round(elevations[j]) }));
    process.stdout.write(`  elevation ${Math.min(i + BATCH, points.length)}/${points.length}\r`);
    await new Promise((r) => setTimeout(r, 1200));
  }
  process.stdout.write("\n");
  return out;
}

async function main() {
  const cellLng = (LNG_MAX - LNG_MIN) / COLS;
  const cellLat = (LAT_MAX - LAT_MIN) / ROWS;
  const pts = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      pts.push({ x, y, lng: LNG_MIN + (x + 0.5) * cellLng, lat: LAT_MIN + (y + 0.5) * cellLat });
    }
  }
  console.log(`Sampling ${pts.length} elevation points (${COLS}×${ROWS} grid)…`);
  const cells = await fetchElevations(pts);

  const elevs = cells.map((c) => c.elevM);
  const grid = {
    cellDeg: cellLat, // rows drive the cell size for the square GridCellLayer
    cellLng,
    cellLat,
    cols: COLS,
    rows: ROWS,
    lngMin: LNG_MIN,
    latMin: LAT_MIN,
    cells,
  };
  await fs.writeFile(OUT, JSON.stringify(grid));
  console.log(`Wrote ${cells.length} cells → ${OUT}`);
  console.log(`  elevation range: ${Math.min(...elevs)} – ${Math.max(...elevs)} m`);
}

main().catch((e) => { console.error("build-nst-terrain-grid failed:", e); process.exit(1); });
