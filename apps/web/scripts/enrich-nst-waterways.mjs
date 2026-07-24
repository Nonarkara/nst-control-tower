#!/usr/bin/env node
/**
 * Enrich waterways.geojson with elevation-derived flow direction + speed.
 *
 * Run from apps/web/:  node scripts/enrich-nst-waterways.mjs
 *
 * The map's flow animation needs, per waterway: (1) which way water actually
 * goes, and (2) how fast. OSM gives us neither — a LineString's node order is
 * only a digitizing convention, and there is no velocity field anywhere. But
 * water runs downhill, and steeper channels run faster, so a DEM gives us both
 * honestly:
 *
 *   - Query the ground elevation at each waterway's two endpoints (Open-Meteo
 *     elevation API — free, no key, batched 100/call, ~90 m SRTM/Copernicus DEM).
 *   - Orient the coordinate array so it runs from the HIGHER endpoint to the
 *     LOWER one (reverse if OSM digitized it uphill).
 *   - slopePct = drop / horizontal length. flowClass from slope × channel type.
 *
 * `downhillConfident` is false when the endpoint drop is within DEM noise (~3 m)
 * — there the direction is a guess and the runtime labels it as such. Live-gauged
 * trunk reaches (Tha Dee) are overridden by real discharge at runtime; this
 * script only seeds the ungauged majority.
 *
 * Idempotent: re-running reproduces the same output (rounded), modulo the DEM
 * service. Reads AND writes public/geo/nst/waterways.geojson in place.
 */

import fs from "node:fs/promises";
import path from "node:path";

const FILE = path.resolve("public/geo/nst/waterways.geojson");
const ELEV_URL = "https://api.open-meteo.com/v1/elevation";
const BATCH = 100; // Open-Meteo elevation cap per request
const DEM_NOISE_M = 3; // below this endpoint drop, direction is not confident

// Metres per degree at NST latitude (~8.4°N) — good enough for slope %.
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 110_320; // cos(8.4°) ≈ 0.989 → 111320·0.989

function horizontalMeters(coords) {
  let m = 0;
  for (let i = 1; i < coords.length; i++) {
    const dLng = (coords[i][0] - coords[i - 1][0]) * M_PER_DEG_LNG;
    const dLat = (coords[i][1] - coords[i - 1][1]) * M_PER_DEG_LAT;
    m += Math.hypot(dLng, dLat);
  }
  return m;
}

// Slope × channel type → nominal flow class. Steeper + bigger channel = faster.
function flowClass(slopePct, waterway, confident) {
  if (!confident) {
    // Flat / DEM-noise: fall back to channel type alone.
    if (waterway === "river") return "medium";
    if (waterway === "canal") return "slow";
    if (waterway === "stream") return "medium";
    return "slow"; // drain / ditch
  }
  const s = Math.abs(slopePct);
  const typeBoost = waterway === "river" ? 1 : waterway === "stream" ? 0.5 : 0;
  const score = s + typeBoost * 0.25;
  if (score >= 1.0) return "fast";
  if (score >= 0.25) return "medium";
  return "slow";
}

async function fetchElevations(points) {
  // points: [[lng,lat], ...]. Returns Map keyed by "lng,lat" (rounded) → metres.
  const out = new Map();
  for (let i = 0; i < points.length; i += BATCH) {
    const chunk = points.slice(i, i + BATCH);
    const lat = chunk.map((p) => p[1]).join(",");
    const lng = chunk.map((p) => p[0]).join(",");
    const url = `${ELEV_URL}?latitude=${lat}&longitude=${lng}`;
    let elevations = null;
    for (let attempt = 0; attempt < 5 && !elevations; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (res.status === 429) throw new Error("HTTP 429"); // rate limited — back off longer
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        elevations = json.elevation;
      } catch (e) {
        if (attempt === 4) throw e;
        const is429 = String(e.message).includes("429");
        await new Promise((r) => setTimeout(r, (is429 ? 8000 : 1500) * (attempt + 1)));
      }
    }
    chunk.forEach((p, j) => out.set(key(p), elevations[j]));
    process.stdout.write(`  elevation ${Math.min(i + BATCH, points.length)}/${points.length}\r`);
    await new Promise((r) => setTimeout(r, 1200)); // throttle: stay under the minute cap
  }
  process.stdout.write("\n");
  return out;
}

const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;

async function main() {
  const fc = JSON.parse(await fs.readFile(FILE, "utf8"));
  const feats = fc.features.filter((f) => f.geometry?.type === "LineString" && f.geometry.coordinates.length >= 2);
  console.log(`Loaded ${fc.features.length} features (${feats.length} usable LineStrings)`);

  // Collect unique endpoints (many ways share nodes) → minimise elevation calls.
  const endpointSet = new Map();
  for (const f of feats) {
    const c = f.geometry.coordinates;
    for (const p of [c[0], c[c.length - 1]]) {
      const k = key(p);
      if (!endpointSet.has(k)) endpointSet.set(k, [p[0], p[1]]);
    }
  }
  const points = [...endpointSet.values()];
  console.log(`Querying elevation for ${points.length} unique endpoints…`);
  const elev = await fetchElevations(points);

  const classCount = { slow: 0, medium: 0, fast: 0 };
  let reversed = 0;
  let confidentCount = 0;
  const elevValues = [];

  for (const f of feats) {
    const c = f.geometry.coordinates;
    const eStart = elev.get(key(c[0]));
    const eEnd = elev.get(key(c[c.length - 1]));
    const lenM = horizontalMeters(c);
    if (eStart != null) elevValues.push(eStart);
    if (eEnd != null) elevValues.push(eEnd);

    let elevStart = eStart;
    let elevEnd = eEnd;
    let confident = false;

    if (eStart != null && eEnd != null && Number.isFinite(eStart) && Number.isFinite(eEnd)) {
      const drop = Math.abs(eStart - eEnd);
      confident = drop > DEM_NOISE_M;
      // Orient downhill: coordinates should run high → low.
      if (eStart < eEnd) {
        f.geometry.coordinates = c.slice().reverse();
        elevStart = eEnd;
        elevEnd = eStart;
        reversed++;
      }
    }
    if (confident) confidentCount++;

    const drop = elevStart != null && elevEnd != null ? Math.max(0, elevStart - elevEnd) : 0;
    const slopePct = lenM > 0 ? (drop / lenM) * 100 : 0;
    const fclass = flowClass(slopePct, f.properties.waterway, confident);
    classCount[fclass]++;

    f.properties.elevStart = elevStart != null ? Math.round(elevStart * 10) / 10 : null;
    f.properties.elevEnd = elevEnd != null ? Math.round(elevEnd * 10) / 10 : null;
    f.properties.slopePct = Math.round(slopePct * 1000) / 1000;
    f.properties.lengthM = Math.round(lenM);
    f.properties.flowClass = fclass;
    f.properties.downhillConfident = confident;
  }

  await fs.writeFile(FILE, JSON.stringify(fc));
  const elevMin = Math.min(...elevValues);
  const elevMax = Math.max(...elevValues);
  console.log(`\nEnriched ${feats.length} waterways → ${FILE}`);
  console.log(`  elevation range: ${elevMin.toFixed(1)} – ${elevMax.toFixed(1)} m`);
  console.log(`  downhill-confident: ${confidentCount}/${feats.length}  ·  reversed uphill→downhill: ${reversed}`);
  console.log(`  flowClass: slow ${classCount.slow} · medium ${classCount.medium} · fast ${classCount.fast}`);
}

main().catch((e) => {
  console.error("enrich-nst-waterways failed:", e);
  process.exit(1);
});
