#!/usr/bin/env node
/**
 * Rebuild buildings.geojson with real OSM category tags + a civic-POI join, so
 * the 3D building models can be coloured by what they are (temple / school /
 * government / market / hospital …) instead of a single neutral slate.
 *
 * Run from apps/web/:  node scripts/enrich-nst-buildings.mjs
 *
 * Two evidence sources, combined:
 *   1. Overpass refetch of every building polygon in the municipality bbox WITH
 *      its own tags (amenity, building, shop, office, religion, tourism). Many
 *      temples/schools/markets ARE tagged on the polygon itself.
 *   2. Spatial join of civic-pois.geojson POINTS (585 school · 531 temple ·
 *      41 market · 39 government …) into the building that CONTAINS them —
 *      catches the many places OSM maps only as a node. That stamps `mnType`,
 *      which lib/building.ts classifyBuilding() honours as top priority.
 *
 * Height is deliberately NOT defaulted to a flat 6 m: leaving it null lets the
 * runtime buildingHeightMeters() give category heights (temple 28 m, government
 * 15 m …), so a coloured building also reads at a sensible height.
 *
 * classifyBuilding() runs at RUNTIME over these tags — this script only supplies
 * the evidence, it does not itself decide colours.
 */

import fs from "node:fs/promises";
import path from "node:path";
import osmtogeojson from "osmtogeojson";

// Municipality + a little margin (wider than the Old Town strip so we catch the
// suburban temples/schools too). [minlat, minlng, maxlat, maxlng].
const BBOX = [8.38, 99.90, 8.50, 100.03];
const OUT = path.resolve("public/geo/nst/buildings.geojson");
const CIVIC = path.resolve("public/geo/nst/civic-pois.geojson");
const OVERPASS_HOSTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

// civic-pois `kind` → { mnType (must match lib/building.ts KNOWN_KINDS),
// radiusM }. These institutions are COMPOUNDS — a temple or school is several
// buildings inside a walled ground, and OSM usually maps only a single node in
// that compound. So we colour every building within a type-sized radius of the
// POI, not just one that happens to contain the point. Radii are compound-scale,
// deliberately modest so neighbours aren't miscoloured; the tighter/rarer types
// (hospital, market) get priority so they win any overlap.
const KIND_MAP = {
  hospital:        { mnType: "hospital",   radiusM: 90, prio: 0 },
  market:          { mnType: "commercial", radiusM: 45, prio: 1 },
  government:      { mnType: "government",  radiusM: 55, prio: 2 },
  courthouse:      { mnType: "government",  radiusM: 55, prio: 2 },
  university:      { mnType: "university",  radiusM: 90, prio: 3 },
  police:          { mnType: "police",      radiusM: 50, prio: 3 },
  fire:            { mnType: "fire",         radiusM: 50, prio: 3 },
  mosque:          { mnType: "mosque",       radiusM: 45, prio: 4 },
  church:          { mnType: "church",       radiusM: 45, prio: 4 },
  "temple-buddhist": { mnType: "temple",     radiusM: 55, prio: 5 },
  school:          { mnType: "school",       radiusM: 70, prio: 6 },
  kindergarten:    { mnType: "school",       radiusM: 45, prio: 6 },
  clinic:          { mnType: "clinic",       radiusM: 35, prio: 7 },
  post:            { mnType: "government",   radiusM: 35, prio: 8 },
};
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 110_320;
function metersBetween(a, b) {
  const dLng = (a[0] - b[0]) * M_PER_DEG_LNG;
  const dLat = (a[1] - b[1]) * M_PER_DEG_LAT;
  return Math.hypot(dLng, dLat);
}

async function overpass(query) {
  let lastErr;
  for (let round = 0; round < 3; round++) {
    for (const host of OVERPASS_HOSTS) {
      try {
        const res = await fetch(host, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(180_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        lastErr = e;
        console.warn(`  overpass ${host.replace(/https:\/\//, "")} failed: ${e.message}`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    if (round < 2) {
      console.warn(`  all mirrors failed (round ${round + 1}) — waiting 20s before retry…`);
      await new Promise((r) => setTimeout(r, 20_000));
    }
  }
  throw lastErr;
}

// Ray-casting point-in-polygon over a GeoJSON Polygon/MultiPolygon (outer ring).
function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(pt, geom) {
  if (geom.type === "Polygon") return pointInRing(pt, geom.coordinates[0]);
  if (geom.type === "MultiPolygon") return geom.coordinates.some((poly) => pointInRing(pt, poly[0]));
  return false;
}

function centroid(geom) {
  const ring = geom.type === "Polygon" ? geom.coordinates[0] : geom.coordinates[0][0];
  let x = 0, y = 0;
  for (const [lng, lat] of ring) { x += lng; y += lat; }
  return [x / ring.length, y / ring.length];
}

function pickName(tags) {
  return { name: tags.name ?? tags["name:en"] ?? tags["name:th"] ?? null,
    nameEn: tags["name:en"] ?? null, nameTh: tags["name:th"] ?? null };
}

const bbox = BBOX.join(",");

async function main() {
  console.log("Fetching NST building polygons with tags from OSM…");
  const raw = await overpass(`
[out:json][timeout:180];
(
  way["building"](${bbox});
  relation["building"](${bbox});
);
out geom;
`);
  const gj = osmtogeojson(raw);
  const polys = gj.features.filter(
    (f) => (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"),
  );
  console.log(`  → ${polys.length} building polygons`);

  const features = polys.map((f) => {
    const t = f.properties || {};
    const nm = pickName(t);
    const levels = t["building:levels"] != null ? Number(t["building:levels"]) : null;
    const height = t.height != null ? Number(String(t.height).replace(/[^\d.]/g, "")) : null;
    return {
      type: "Feature",
      id: f.id,
      properties: {
        id: f.id,
        ...nm,
        building: t.building ?? "yes",
        levels: Number.isFinite(levels) ? levels : null,
        height: Number.isFinite(height) ? height : null, // null → runtime per-kind height
        amenity: t.amenity ?? null,
        religion: t.religion ?? null,
        shop: t.shop ?? null,
        office: t.office ?? null,
        tourism: t.tourism ?? null,
        mnType: null, // filled by the civic-POI join below
      },
      geometry: f.geometry,
    };
  });

  // Spatial join: a civic POI marks a COMPOUND, so colour every building near it
  // (within the kind's radius) — plus the containing polygon always. When radii
  // overlap, the higher-priority (lower prio number, tighter type) POI wins, so
  // a hospital inside a temple neighbourhood still reads as a hospital. We
  // precompute building centroids once.
  const civic = JSON.parse(await fs.readFile(CIVIC, "utf8"));
  const pois = civic.features
    .filter((f) => f.geometry?.type === "Point" && KIND_MAP[f.properties.kind])
    .map((f) => ({ pt: f.geometry.coordinates, ...KIND_MAP[f.properties.kind], props: f.properties }))
    .sort((a, b) => a.prio - b.prio); // tighter/rarer types first
  const cents = features.map((f) => centroid(f.geometry));

  // Track the best (lowest-prio) POI claim per building so priority wins overlaps.
  const claim = new Array(features.length).fill(null); // { prio, mnType, name… }
  for (const poi of pois) {
    for (let i = 0; i < features.length; i++) {
      const contains = pointInFeature(poi.pt, features[i].geometry);
      if (!contains && metersBetween(poi.pt, cents[i]) > poi.radiusM) continue;
      const cur = claim[i];
      if (!cur || poi.prio < cur.prio) {
        claim[i] = { prio: poi.prio, mnType: poi.mnType, name: poi.props.name,
          nameEn: poi.props["name:en"] ?? null, nameTh: poi.props["name:th"] ?? null, contains };
      }
    }
  }
  let joined = 0;
  claim.forEach((c, i) => {
    if (!c) return;
    features[i].properties.mnType = c.mnType;
    // Only borrow the POI's name for the building that actually contains it.
    if (c.contains && !features[i].properties.name && c.name) {
      features[i].properties.name = c.name;
      features[i].properties.nameEn = c.nameEn ?? features[i].properties.nameEn;
      features[i].properties.nameTh = c.nameTh ?? features[i].properties.nameTh;
    }
    joined++;
  });

  // Report classification coverage (mnType OR a usable OSM tag).
  const typed = features.filter(
    (f) => f.properties.mnType || f.properties.amenity || f.properties.religion ||
      f.properties.shop || f.properties.office ||
      ["temple", "church", "mosque", "school", "hospital", "government"].includes(f.properties.building),
  );
  const byType = {};
  for (const f of features) if (f.properties.mnType) byType[f.properties.mnType] = (byType[f.properties.mnType] || 0) + 1;

  const fc = { type: "FeatureCollection", features };
  await fs.writeFile(OUT, JSON.stringify(fc));
  console.log(`\nWrote ${features.length} buildings → ${OUT}`);
  console.log(`  civic POIs joined into a footprint: ${joined}/${pois.length}`);
  console.log(`  buildings with a classifiable signal: ${typed.length}`);
  console.log(`  mnType stamped: ${JSON.stringify(byType)}`);
}

main().catch((e) => {
  console.error("enrich-nst-buildings failed:", e);
  process.exit(1);
});
