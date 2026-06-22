#!/usr/bin/env node
/**
 * Dense building footprints for Yala City from Microsoft's Global ML Building
 * Footprints, merged with whatever OSM buildings we already extracted.
 *
 * Run from apps/web/:  node scripts/extract-ms-buildings.mjs
 *
 * WHY: OSM building coverage in Thailand's Deep South is sparse — the Overpass
 * extract (scripts/extract-yala-geo.mjs) only finds ~12 footprints for the whole
 * municipality, which leaves the headline "3D for EVERY building" requirement
 * empty. Microsoft's GlobalMLBuildingFootprints dataset has machine-learned
 * footprints for all of Thailand, tiled by Bing-style z9 quadkeys and served as
 * gzipped GeoJSONL (one Feature per line) from an Azure static site.
 *
 * Pipeline:
 *   1. Fetch the Thailand dataset-links CSV.
 *   2. Compute which z9 quadkey tile(s) intersect the Yala bbox.
 *   3. Stream + gunzip each matching tile, parse each line as a GeoJSON Feature.
 *   4. Keep only polygons whose centroid sits inside the bbox.
 *   5. Map MS props → the SAME schema buildings.geojson already uses (Polygon +
 *      `height`; MS height of -1 / 0 means "unknown" → default 6 m / 2 storeys).
 *   6. Merge with the existing OSM buildings, deduping by centroid proximity so
 *      the ~12 OSM footprints (which carry richer names/levels) win and we don't
 *      double-stack.
 *   7. Round coords to 6 decimals and write back to buildings.geojson.
 *
 * Reproducible + idempotent: re-running re-derives from the OSM file currently on
 * disk plus a fresh MS fetch. (If buildings.geojson has already been merged, the
 * MS-sourced features carry `source:"ms"` so a second run still dedupes cleanly.)
 *
 * Output: public/geo/yala/buildings.geojson
 */

import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

// Municipal bbox [minlat, minlng, maxlat, maxlng] — matches extract-yala-geo.mjs.
const BBOX = [6.515, 101.255, 6.572, 101.312];
const [MIN_LAT, MIN_LNG, MAX_LAT, MAX_LNG] = BBOX;

const OUT = path.resolve("public/geo/yala");
const BUILDINGS_FILE = path.join(OUT, "buildings.geojson");

const DATASET_LINKS_URL =
  "https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv";
const COUNTRY = "Thailand";
const QUADKEY_ZOOM = 9;

const DEFAULT_HEIGHT_M = 6; // 2 storeys — matches the OSM extractor default
const COORD_DECIMALS = 6;
// Dedupe radius: MS footprints whose centroid is within this of an OSM building
// centroid are treated as the same structure (OSM wins). ~12 m at this latitude.
const DEDUPE_DEG = 0.00012;

const USER_AGENT = "yala-control-tower-dashboard/1.0 (ms-buildings extract)";

// ── Quadkey math (Bing tile system) ────────────────────────────────────────

function lngLatToTileXY(lng, lat, z) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return [x, y];
}

function tileXYToQuadKey(x, y, z) {
  let qk = "";
  for (let i = z; i > 0; i--) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if ((x & mask) !== 0) digit += 1;
    if ((y & mask) !== 0) digit += 2;
    qk += String(digit);
  }
  return qk;
}

function quadkeysForBbox() {
  const [x0, y0] = lngLatToTileXY(MIN_LNG, MAX_LAT, QUADKEY_ZOOM);
  const [x1, y1] = lngLatToTileXY(MAX_LNG, MIN_LAT, QUADKEY_ZOOM);
  const qks = new Set();
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      qks.add(tileXYToQuadKey(x, y, QUADKEY_ZOOM));
    }
  }
  return qks;
}

// ── Geometry helpers ────────────────────────────────────────────────────────

function ringOf(geometry) {
  if (geometry?.type === "Polygon") return geometry.coordinates[0];
  if (geometry?.type === "MultiPolygon") return geometry.coordinates[0]?.[0];
  return null;
}

function centroidOf(geometry) {
  const ring = ringOf(geometry);
  if (!ring || !ring.length) return null;
  let cx = 0;
  let cy = 0;
  for (const [x, y] of ring) {
    cx += x;
    cy += y;
  }
  return [cx / ring.length, cy / ring.length];
}

function inBbox([lng, lat]) {
  return lng >= MIN_LNG && lng <= MAX_LNG && lat >= MIN_LAT && lat <= MAX_LAT;
}

const round = (n) => Number(n.toFixed(COORD_DECIMALS));

function roundGeometry(geometry) {
  const mapRing = (ring) => ring.map(([x, y]) => [round(x), round(y)]);
  if (geometry.type === "Polygon") {
    return { type: "Polygon", coordinates: geometry.coordinates.map(mapRing) };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((poly) => poly.map(mapRing)),
    };
  }
  return geometry;
}

// MS height: -1 or 0 means "unknown" → fall back to the 2-storey default.
function msHeight(props) {
  const h = Number(props?.height);
  if (Number.isFinite(h) && h > 0) return Math.round(h);
  return DEFAULT_HEIGHT_M;
}

// ── Spatial dedupe (grid bucket on the dedupe radius) ───────────────────────

function makeOsmCentroidIndex(osmFeatures) {
  const buckets = new Map();
  const key = (gx, gy) => `${gx}:${gy}`;
  for (const f of osmFeatures) {
    const c = centroidOf(f.geometry);
    if (!c) continue;
    const gx = Math.floor(c[0] / DEDUPE_DEG);
    const gy = Math.floor(c[1] / DEDUPE_DEG);
    const k = key(gx, gy);
    const arr = buckets.get(k) ?? [];
    arr.push(c);
    buckets.set(k, arr);
  }
  return {
    near(c) {
      const gx = Math.floor(c[0] / DEDUPE_DEG);
      const gy = Math.floor(c[1] / DEDUPE_DEG);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const arr = buckets.get(key(gx + dx, gy + dy));
          if (!arr) continue;
          for (const o of arr) {
            if (
              Math.abs(o[0] - c[0]) <= DEDUPE_DEG &&
              Math.abs(o[1] - c[1]) <= DEDUPE_DEG
            ) {
              return true;
            }
          }
        }
      }
      return false;
    },
  };
}

// ── MS fetch ─────────────────────────────────────────────────────────────────

async function fetchDatasetLinks() {
  const res = await fetch(DATASET_LINKS_URL, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`dataset-links HTTP ${res.status}`);
  const text = await res.text();
  const wanted = quadkeysForBbox();
  console.log(`  bbox covered by z${QUADKEY_ZOOM} quadkeys: ${[...wanted].join(", ")}`);
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith(`${COUNTRY},`)) continue;
    const [, quadkey, url] = line.split(",");
    if (wanted.has(quadkey)) rows.push({ quadkey, url });
  }
  if (!rows.length) {
    throw new Error(`no ${COUNTRY} tiles matched bbox quadkeys`);
  }
  return rows;
}

async function fetchTile(url) {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`tile HTTP ${res.status}`);
  const gz = Buffer.from(await res.arrayBuffer());
  const raw = zlib.gunzipSync(gz).toString("utf8");
  const out = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let feat;
    try {
      feat = JSON.parse(line);
    } catch {
      continue; // skip malformed lines rather than aborting the whole tile
    }
    const geom = feat.geometry;
    if (geom?.type !== "Polygon" && geom?.type !== "MultiPolygon") continue;
    const c = centroidOf(geom);
    if (!c || !inBbox(c)) continue;
    out.push({
      type: "Feature",
      id: `ms/${feat.properties?.height ?? "x"}/${round(c[0])}/${round(c[1])}`,
      properties: {
        id: null,
        name: null,
        nameEn: null,
        nameTh: null,
        building: "yes",
        levels: null,
        height: msHeight(feat.properties),
        amenity: null,
        religion: null,
        source: "ms",
      },
      geometry: roundGeometry(geom),
    });
  }
  return out;
}

// ── Existing OSM buildings ─────────────────────────────────────────────────

async function readOsmBuildings() {
  try {
    const txt = await fs.readFile(BUILDINGS_FILE, "utf8");
    const fc = JSON.parse(txt);
    // Keep only OSM-origin features (anything not tagged source:"ms"), so a
    // re-run doesn't compound previously-merged MS footprints.
    const osm = (fc.features ?? []).filter((f) => f.properties?.source !== "ms");
    return osm;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn("  (no existing buildings.geojson — MS only)");
      return [];
    }
    throw err;
  }
}

// ── Densify (callable from extract-yala-geo.mjs) ────────────────────────────

/**
 * Fetch Microsoft footprints for the Yala bbox, merge them into the OSM
 * buildings.geojson already on disk (deduping by centroid), and write back.
 * Throws if the MS dataset is unreachable so the caller can fall back.
 */
export async function densifyWithMsBuildings() {
  console.log("[ms-buildings] Microsoft Global ML Building Footprints");
  console.log("  bbox =", BBOX.join(","));

  const osm = await readOsmBuildings();
  console.log(`  OSM buildings on disk: ${osm.length}`);

  const links = await fetchDatasetLinks();
  console.log(`  matched ${links.length} MS tile(s)`);

  let msFeatures = [];
  for (const { quadkey, url } of links) {
    console.log(`  fetching tile ${quadkey}…`);
    const feats = await fetchTile(url);
    console.log(`    ${feats.length} footprints inside bbox`);
    msFeatures = msFeatures.concat(feats);
  }

  // Dedupe MS against OSM centroids — OSM features win (richer metadata).
  const index = makeOsmCentroidIndex(osm);
  let dropped = 0;
  const msKept = msFeatures.filter((f) => {
    const c = centroidOf(f.geometry);
    if (c && index.near(c)) {
      dropped++;
      return false;
    }
    return true;
  });
  console.log(`  MS footprints kept: ${msKept.length} (dropped ${dropped} near OSM)`);

  const merged = {
    type: "FeatureCollection",
    features: [...osm, ...msKept],
  };

  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(BUILDINGS_FILE, JSON.stringify(merged));
  const bytes = (await fs.stat(BUILDINGS_FILE)).size;
  console.log(
    `  → ${BUILDINGS_FILE} · ${merged.features.length} features · ${(bytes / 1e6).toFixed(2)} MB`,
  );
  console.log("[ms-buildings] done");
  return merged;
}

// ── Standalone entry point ──────────────────────────────────────────────────
// Only runs when invoked directly (node scripts/extract-ms-buildings.mjs); when
// imported by extract-yala-geo.mjs the densify function is called instead.
const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("extract-ms-buildings.mjs");

if (invokedDirectly) {
  densifyWithMsBuildings().catch((err) => {
    console.error("[extract-ms-buildings] FAILED:", err.message);
    console.error(
      "  Microsoft dataset may be unreachable — fall back to a denser Overpass\n" +
        "  query (building:part + relations) and report MS was unreachable.",
    );
    process.exit(1);
  });
}
