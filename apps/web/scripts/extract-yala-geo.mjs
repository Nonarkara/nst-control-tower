#!/usr/bin/env node
/**
 * Extract Yala City Municipality static GeoJSON from OSM Overpass.
 *
 * Run from apps/web/:  node scripts/extract-yala-geo.mjs
 *
 * Yala City Municipality (เทศบาลนครยะลา) — Thailand's only planned
 * concentric-circular city. Centre / "Kilometre Zero" = lng 101.2831, lat 6.5425.
 * The Pattani River runs along the western edge of the core.
 *
 * Output files in public/geo/yala/:
 *   buildings.geojson    — every building footprint, height from levels×3m or 6m default
 *   boundary.geojson     — municipal admin boundary (bbox fallback if not found)
 *   ring-roads.geojson   — Wongwian ring roads + radial spokes near the centre
 *   waterways.geojson     — Pattani River + canals/streams/drains
 *   river-buffer.geojson — ~200 m buffer corridor around the river centreline
 *   civic-pois.geojson   — hospitals/clinics/schools/police/fire/gov/worship/markets
 *   landmarks.geojson    — named landmarks actually present in OSM
 *   flood-risk.geojson   — hand-authored flood-prone riverside polygons
 *
 * Reuses the FeatureCollection conventions of the existing Chonburi layers:
 *   civic features carry a normalised `kind` matching CIVIC_PALETTE
 *   waterways carry `waterway`, buildings carry `height`/`levels`
 *   flood-risk carries `severity`/`type`/`households`
 */

import fs from "node:fs/promises";
import path from "node:path";
import osmtogeojson from "osmtogeojson";
import { densifyWithMsBuildings } from "./extract-ms-buildings.mjs";

// Municipal bbox [minlat, minlng, maxlat, maxlng] — matches the brief.
const BBOX = [6.515, 101.255, 6.572, 101.312];
const CENTER = { lng: 101.2831, lat: 6.5425 };
const RING_RADIUS_KM = 1.2; // radial/ring road capture radius from centre

// Two public Overpass mirrors — try the primary, fall back on failure.
const OVERPASS_HOSTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OUT = path.resolve("public/geo/yala");

const bbox = BBOX.join(",");

const USER_AGENT = "yala-control-tower-dashboard/1.0 (geodata extract script)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query) {
  let lastErr;
  for (const host of OVERPASS_HOSTS) {
    // Up to 2 attempts per host with backoff — handles transient 429 rate-limits.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(host, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            accept: "application/json",
            // overpass-api.de returns HTTP 406 without a User-Agent (Node fetch omits it).
            "user-agent": USER_AGENT,
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(180_000),
        });
        if (res.status === 429) throw new Error(`HTTP 429 (${host})`);
        if (!res.ok) throw new Error(`HTTP ${res.status} (${host})`);
        return await res.json();
      } catch (err) {
        lastErr = err;
        console.error(`  … ${host} attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt === 0) await sleep(5000);
      }
    }
  }
  throw lastErr ?? new Error("all Overpass hosts failed");
}

async function writeGeoJson(name, fc) {
  await fs.mkdir(OUT, { recursive: true });
  const file = path.join(OUT, name);
  await fs.writeFile(file, JSON.stringify(fc));
  console.log(`  → ${file} · ${fc.features.length} features`);
  return fc;
}

// ── Geometry helpers ──────────────────────────────────────────────────────

function haversineKm(aLng, aLat, bLng, bLat) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function firstCoord(geometry) {
  switch (geometry?.type) {
    case "Point":
      return geometry.coordinates;
    case "LineString":
      return geometry.coordinates[0];
    case "Polygon":
      return geometry.coordinates[0]?.[0];
    case "MultiPolygon":
      return geometry.coordinates[0]?.[0]?.[0];
    case "MultiLineString":
      return geometry.coordinates[0]?.[0];
    default:
      return null;
  }
}

function centroidOf(geometry) {
  if (geometry?.type === "Point") return geometry.coordinates;
  const ring =
    geometry?.type === "Polygon"
      ? geometry.coordinates[0]
      : geometry?.type === "MultiPolygon"
        ? geometry.coordinates[0]?.[0]
        : geometry?.type === "LineString"
          ? geometry.coordinates
          : null;
  if (!ring || !ring.length) return firstCoord(geometry);
  let cx = 0;
  let cy = 0;
  for (const [x, y] of ring) {
    cx += x;
    cy += y;
  }
  return [cx / ring.length, cy / ring.length];
}

// ── Building height: building:levels × 3 m, else 6 m default ───────────────
function buildingHeight(props) {
  const raw = props["height"];
  if (raw != null) {
    const h = parseFloat(String(raw));
    if (Number.isFinite(h) && h > 0) return Math.round(h);
  }
  const levels = props["building:levels"];
  if (levels != null) {
    const n = parseFloat(String(levels));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 3);
  }
  return 6; // sensible 2-storey default
}

// ── Civic kind normalisation — matches CIVIC_PALETTE in map/layers.ts ──────
function civicKind(p) {
  const a = p.amenity || "";
  const h = p.healthcare || "";
  const e = p.emergency || "";
  const m = p["man_made"] || "";
  if (a === "hospital" || h === "hospital") return "hospital";
  if (a === "clinic" || h === "clinic" || h === "doctor" || h === "centre" || a === "doctors")
    return "clinic";
  if (a === "pharmacy" || h === "pharmacy") return "pharmacy";
  if (a === "school") return "school";
  if (a === "university" || a === "college") return "university";
  if (a === "kindergarten") return "kindergarten";
  if (a === "police") return "police";
  if (a === "fire_station" || e === "fire_station") return "fire";
  if (a === "townhall" || p.office === "government") return "government";
  if (a === "courthouse") return "courthouse";
  if (a === "post_office") return "post";
  if (a === "place_of_worship") {
    const r = p.religion || "";
    if (r === "muslim") return "mosque";
    if (r === "christian") return "church";
    return "temple-buddhist";
  }
  if (a === "marketplace") return "market";
  if (a === "bus_station") return "bus-station";
  if (a === "ferry_terminal") return "ferry";
  if (p.power === "substation") return "power-substation";
  if (m === "water_works" || m === "reservoir_covered") return "water-works";
  if (m === "wastewater_plant") return "wastewater";
  return "other";
}

// ── Queries ────────────────────────────────────────────────────────────────

const buildingsQuery = `
[out:json][timeout:120];
(
  way["building"](${bbox});
  relation["building"](${bbox});
);
out geom;
`;

// Only municipal-scale relations (admin_level 7/8). NOTE: as of 2026, OSM has
// no such relation for Yala City Municipality — the only thing that overlaps the
// bbox is the admin_level-4 PROVINCE, which we explicitly must not use. So this
// query usually returns nothing and we fall back to the marked bbox polygon.
const boundaryQuery = `
[out:json][timeout:60];
relation["boundary"="administrative"]["admin_level"~"^(7|8)$"](6.50,101.24,6.59,101.34);
out geom;
`;

const roadsQuery = `
[out:json][timeout:90];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street)$"](${bbox});
);
out geom;
`;

const waterwaysQuery = `
[out:json][timeout:90];
(
  way["waterway"~"^(river|canal|stream|drain|ditch)$"](${bbox});
  relation["waterway"~"^(river|canal)$"](${bbox});
);
(._;>;);
out geom;
`;

const civicQuery = `
[out:json][timeout:120];
(
  node["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](${bbox});
  way["amenity"~"^(hospital|clinic)$"](${bbox});
  node["healthcare"~"^(hospital|clinic|doctor|pharmacy|centre)$"](${bbox});
  way["healthcare"~"^(hospital|clinic|centre)$"](${bbox});
  node["amenity"~"^(school|university|college|kindergarten)$"](${bbox});
  way["amenity"~"^(school|university|college|kindergarten)$"](${bbox});
  node["amenity"="police"](${bbox});
  way["amenity"="police"](${bbox});
  node["amenity"="fire_station"](${bbox});
  way["amenity"="fire_station"](${bbox});
  node["amenity"~"^(townhall|courthouse|post_office)$"](${bbox});
  way["amenity"~"^(townhall|courthouse|post_office)$"](${bbox});
  node["office"="government"](${bbox});
  way["office"="government"](${bbox});
  node["amenity"="place_of_worship"](${bbox});
  way["amenity"="place_of_worship"](${bbox});
  node["amenity"="marketplace"](${bbox});
  way["amenity"="marketplace"](${bbox});
  node["amenity"~"^(bus_station|ferry_terminal)$"](${bbox});
  way["amenity"="bus_station"](${bbox});
  node["public_transport"="station"](${bbox});
  node["power"="substation"](${bbox});
  way["power"="substation"](${bbox});
  way["man_made"~"^(water_works|reservoir_covered|wastewater_plant)$"](${bbox});
);
out center;
`;

// Named landmarks — railway station, hospital, mosque, city hall, university, etc.
const landmarksQuery = `
[out:json][timeout:90];
(
  node["railway"="station"](${bbox});
  way["railway"="station"](${bbox});
  node["amenity"="hospital"]["name"](${bbox});
  way["amenity"="hospital"]["name"](${bbox});
  node["amenity"="place_of_worship"]["name"](${bbox});
  way["amenity"="place_of_worship"]["name"](${bbox});
  node["amenity"="townhall"]["name"](${bbox});
  way["amenity"="townhall"]["name"](${bbox});
  node["office"="government"]["name"](${bbox});
  way["office"="government"]["name"](${bbox});
  node["amenity"="university"]["name"](${bbox});
  way["amenity"="university"]["name"](${bbox});
  node["tourism"~"^(attraction|museum)$"]["name"](${bbox});
  way["tourism"~"^(attraction|museum)$"]["name"](${bbox});
  node["historic"]["name"](${bbox});
  way["historic"]["name"](${bbox});
  way["leisure"="park"]["name"](${bbox});
  node["highway"="mini_roundabout"](${bbox});
);
out center;
`;

// ── Extract steps ────────────────────────────────────────────────────────

async function pointify(fc, rawOsm) {
  return fc.features
    .map((f) => {
      if (f.geometry?.type === "Point") return f;
      const raw = rawOsm.elements?.find((e) => String(e.id) === String(f.id?.split("/")[1]));
      if (raw?.center) {
        return { ...f, geometry: { type: "Point", coordinates: [raw.center.lon, raw.center.lat] } };
      }
      const c = centroidOf(f.geometry);
      if (c) return { ...f, geometry: { type: "Point", coordinates: c } };
      return null;
    })
    .filter(Boolean);
}

async function extractBuildings() {
  console.log("\nfetching buildings…");
  const osm = await overpass(buildingsQuery);
  const fc = osmtogeojson(osm);
  fc.features = fc.features
    .filter((f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
    .map((f) => {
      const p = f.properties || {};
      const height = buildingHeight(p);
      const levels = p["building:levels"] != null ? parseFloat(String(p["building:levels"])) : null;
      return {
        type: "Feature",
        id: f.id,
        properties: {
          id: f.id,
          name: p.name ?? null,
          nameEn: p["name:en"] ?? null,
          nameTh: p["name:th"] ?? null,
          building: p.building ?? "yes",
          levels: Number.isFinite(levels) ? levels : null,
          height,
          amenity: p.amenity ?? null,
          religion: p.religion ?? null,
        },
        geometry: f.geometry,
      };
    });
  await writeGeoJson("buildings.geojson", fc);

  // OSM building coverage in the Deep South is sparse (~12 footprints for the
  // whole municipality). Densify with Microsoft's Global ML Building Footprints
  // so the "3D for EVERY building" requirement actually fills the city. This
  // reads the buildings.geojson we just wrote, merges thousands of MS footprints
  // (deduping near the OSM ones), and writes the merged result back.
  // See scripts/extract-ms-buildings.mjs for the full pipeline.
  console.log("\ndensifying buildings with Microsoft ML footprints…");
  await densifyWithMsBuildings();
}

async function extractBoundary() {
  console.log("\nfetching municipal boundary…");
  let found = null;
  try {
    const osm = await overpass(boundaryQuery);
    const fc = osmtogeojson(osm);
    const polys = fc.features.filter(
      (f) =>
        (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon") &&
        // Hard-exclude province / region scale — we only want the municipality.
        String(f.properties?.admin_level ?? "") !== "4" &&
        String(f.properties?.admin_level ?? "") !== "5" &&
        String(f.properties?.admin_level ?? "") !== "6",
    );
    const named = polys.find((f) => /ยะลา|yala/i.test(f.properties?.name ?? f.properties?.["name:en"] ?? ""));
    found = named ?? polys[0] ?? null;
  } catch (err) {
    console.error("  ✕ boundary query failed:", err.message);
  }

  let fc;
  if (found) {
    fc = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: found.id ?? "yala-boundary",
            name: found.properties?.["name:en"] ?? "Yala City Municipality",
            nameTh: found.properties?.name ?? "เทศบาลนครยะลา",
            source: "osm",
            fallback: false,
          },
          geometry: found.geometry,
        },
      ],
    };
  } else {
    // bbox polygon fallback — clearly marked.
    const [minLat, minLng, maxLat, maxLng] = BBOX;
    fc = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "yala-boundary-bbox",
            name: "Yala City Municipality (bbox fallback)",
            nameTh: "เทศบาลนครยะลา",
            source: "bbox-fallback",
            fallback: true,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ],
          },
        },
      ],
    };
    console.log("  (used bbox fallback)");
  }
  await writeGeoJson("boundary.geojson", fc);
}

function roadPriority(highway) {
  switch (highway) {
    case "motorway":
    case "trunk":
      return 6;
    case "primary":
    case "secondary":
      return 5;
    case "tertiary":
      return 4;
    case "residential":
    case "living_street":
      return 3;
    default:
      return 2;
  }
}

async function extractRingRoads() {
  console.log("\nfetching ring + radial roads near the centre…");
  const osm = await overpass(roadsQuery);
  const fc = osmtogeojson(osm);
  // Keep ways whose centroid is within RING_RADIUS_KM of the central circle —
  // this is the concentric Wongwian signature.
  fc.features = fc.features
    .filter((f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString")
    .filter((f) => {
      const c = centroidOf(f.geometry);
      if (!c) return false;
      return haversineKm(CENTER.lng, CENTER.lat, c[0], c[1]) <= RING_RADIUS_KM;
    })
    .map((f) => {
      const p = f.properties || {};
      const name = p.name ?? p["name:en"] ?? null;
      const isRing = /wongwian|วงเวียน|ring/i.test(`${p.name ?? ""} ${p["name:en"] ?? ""}`);
      return {
        type: "Feature",
        id: f.id,
        properties: {
          id: f.id,
          name,
          nameEn: p["name:en"] ?? null,
          nameTh: p["name:th"] ?? null,
          highway: p.highway ?? "residential",
          priority: roadPriority(p.highway),
          ring: isRing,
        },
        geometry: f.geometry,
      };
    });
  await writeGeoJson("ring-roads.geojson", fc);
}

async function extractWaterways() {
  console.log("\nfetching waterways…");
  const osm = await overpass(waterwaysQuery);
  const fc = osmtogeojson(osm);
  fc.features = fc.features
    .filter((f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString")
    .map((f) => {
      const p = f.properties || {};
      return {
        type: "Feature",
        id: f.id,
        properties: {
          id: f.id,
          name: p.name ?? null,
          nameEn: p["name:en"] ?? null,
          nameTh: p["name:th"] ?? null,
          waterway: p.waterway ?? "stream",
        },
        geometry: f.geometry,
      };
    });
  await writeGeoJson("waterways.geojson", fc);
  return fc;
}

// Build a crude ~bufferM corridor polygon around the longest river centreline.
// Uses a planar offset (degrees) — fine at this latitude for a flood corridor.
function buildRiverBuffer(waterFc, bufferM = 200) {
  // Pick river features (the Pattani River); fall back to longest line.
  const rivers = waterFc.features.filter((f) => f.properties.waterway === "river");
  const lines = (rivers.length ? rivers : waterFc.features)
    .filter((f) => f.geometry?.type === "LineString")
    .map((f) => f.geometry.coordinates)
    .sort((a, b) => b.length - a.length);
  if (!lines.length) return null;

  // metres → degrees (latitude ~6.54°)
  const dLat = bufferM / 111_320;
  const dLng = bufferM / (111_320 * Math.cos((CENTER.lat * Math.PI) / 180));

  const features = [];
  // Buffer the top few longest lines (covers the river + main feeder canal).
  for (const coords of lines.slice(0, 3)) {
    if (coords.length < 2) continue;
    const left = [];
    const right = [];
    for (let i = 0; i < coords.length; i++) {
      const [x, y] = coords[i];
      const [px, py] = coords[Math.max(0, i - 1)];
      const [nx, ny] = coords[Math.min(coords.length - 1, i + 1)];
      // tangent direction
      let tx = nx - px;
      let ty = ny - py;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      // normal (perpendicular), scaled to buffer in deg
      const nlng = -ty * dLng;
      const nlat = tx * dLat;
      left.push([x + nlng, y + nlat]);
      right.push([x - nlng, y - nlat]);
    }
    const ring = [...left, ...right.reverse()];
    ring.push(ring[0]);
    features.push({
      type: "Feature",
      properties: { id: "pattani-river-buffer", name: "Pattani River flood corridor", bufferM },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
  }
  if (!features.length) return null;
  return { type: "FeatureCollection", features };
}

async function extractRiverBuffer(waterFc) {
  console.log("\nbuilding river buffer corridor…");
  const fc = buildRiverBuffer(waterFc, 220);
  if (!fc) {
    console.log("  (no river centreline found — skipping)");
    return;
  }
  await writeGeoJson("river-buffer.geojson", fc);
}

async function extractCivic() {
  console.log("\nfetching civic POIs…");
  const osm = await overpass(civicQuery);
  const fcRaw = osmtogeojson(osm);
  const points = await pointify(fcRaw, osm);
  const features = points.map((f) => {
    const p = f.properties || {};
    return {
      type: "Feature",
      id: f.id,
      properties: {
        id: f.id,
        kind: civicKind(p),
        name: p.name ?? null,
        "name:en": p["name:en"] ?? null,
        "name:th": p["name:th"] ?? null,
        amenity: p.amenity ?? null,
        religion: p.religion ?? null,
        operator: p.operator ?? null,
      },
      geometry: f.geometry,
    };
  });
  const fc = { type: "FeatureCollection", features };
  await writeGeoJson("civic-pois.geojson", fc);
  const counts = {};
  for (const f of fc.features) counts[f.properties.kind] = (counts[f.properties.kind] || 0) + 1;
  console.log("  by kind:", JSON.stringify(counts));
}

async function extractLandmarks() {
  console.log("\nfetching named landmarks…");
  const osm = await overpass(landmarksQuery);
  const fcRaw = osmtogeojson(osm);
  const points = await pointify(fcRaw, osm);
  const features = points
    .filter((f) => {
      const p = f.properties || {};
      // landmarks must be named (except the central roundabout)
      return p.name || p["name:en"] || p.highway === "mini_roundabout";
    })
    .map((f) => {
      const p = f.properties || {};
      let kind = "landmark";
      if (p.railway === "station") kind = "railway-station";
      else if (p.amenity === "hospital") kind = "hospital";
      else if (p.amenity === "place_of_worship")
        kind = p.religion === "muslim" ? "mosque" : "temple";
      else if (p.amenity === "townhall" || p.office === "government") kind = "government";
      else if (p.amenity === "university") kind = "university";
      else if (p.historic) kind = "historic";
      else if (p.leisure === "park") kind = "park";
      else if (p.highway === "mini_roundabout") kind = "roundabout";
      else if (p.tourism) kind = "attraction";
      return {
        type: "Feature",
        id: f.id,
        properties: {
          id: f.id,
          kind,
          name: p.name ?? p["name:en"] ?? "Central circle",
          nameEn: p["name:en"] ?? null,
          nameTh: p["name:th"] ?? null,
        },
        geometry: f.geometry,
      };
    });
  const fc = { type: "FeatureCollection", features };
  await writeGeoJson("landmarks.geojson", fc);
  const names = features.slice(0, 30).map((f) => f.properties.nameEn ?? f.properties.name);
  console.log("  names:", JSON.stringify(names));
}

// Hand-authored flood-prone polygons — low-lying riverside neighbourhoods along
// the Pattani River western edge of the circular core. Schema matches the
// existing chonburi-flood-risk.geojson (severity / type / households).
async function writeFloodRisk() {
  console.log("\nwriting hand-authored flood-risk polygons…");
  const fc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          id: "sateng-riverside",
          name: "Sateng riverside low-lying zone",
          nameTh: "พื้นที่ลุ่มริมแม่น้ำ สะเตง",
          severity: "high",
          type: "river-overflow",
          describe:
            "Low-lying neighbourhood on the west bank of the Pattani River, directly below the circular core. First to inundate when Bang Lang Dam outflow rises during the NE monsoon (Nov–Jan).",
          households: 3600,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [101.2735, 6.5385],
              [101.2815, 6.5385],
              [101.2815, 6.5475],
              [101.2735, 6.5475],
              [101.2735, 6.5385],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: {
          id: "pattani-river-north",
          name: "Northern riverbank flats",
          nameTh: "ที่ราบริมฝั่งแม่น้ำตอนเหนือ",
          severity: "medium",
          type: "river-overflow",
          describe:
            "Riverbank flats north of the railway crossing. Backflow flooding during sustained upstream rainfall; drains slowly because the corridor is pinched by the embankment.",
          households: 1900,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [101.2745, 6.5475],
              [101.2825, 6.5475],
              [101.2825, 6.5555],
              [101.2745, 6.5555],
              [101.2745, 6.5475],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: {
          id: "south-station-lowland",
          name: "Station-south drainage sink",
          nameTh: "พื้นที่ลุ่มใต้สถานีรถไฟ",
          severity: "medium",
          type: "drainage-backflow",
          describe:
            "Low ground south-west of Yala railway station where storm drainage backs up during intense convective rain. Standing water on the radial approach roads.",
          households: 2400,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [101.2775, 6.5305],
              [101.2855, 6.5305],
              [101.2855, 6.5385],
              [101.2775, 6.5385],
              [101.2775, 6.5305],
            ],
          ],
        },
      },
    ],
  };
  await writeGeoJson("flood-risk.geojson", fc);
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("[extract-yala-geo] bbox =", bbox);
  await fs.mkdir(OUT, { recursive: true });

  const steps = [
    extractBuildings,
    extractBoundary,
    extractRingRoads,
    extractCivic,
    extractLandmarks,
    writeFloodRisk,
  ];
  for (const step of steps) {
    try {
      await step();
    } catch (err) {
      console.error(`  ✕ ${step.name} failed:`, err.message);
    }
    await sleep(2500); // be polite to public Overpass mirrors
  }
  // waterways + river buffer are coupled (buffer derives from the river lines).
  try {
    const waterFc = await extractWaterways();
    await extractRiverBuffer(waterFc);
  } catch (err) {
    console.error("  ✕ waterways/river-buffer failed:", err.message);
  }

  console.log("\n[extract-yala-geo] done");
}

main();
