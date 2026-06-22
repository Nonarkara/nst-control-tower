#!/usr/bin/env node
/**
 * Extract Nakhon Si Thammarat City static GeoJSON from OSM Overpass.
 *
 * Run from apps/web/:  node scripts/extract-nst-geo.mjs
 *
 * Nakhon Si Thammarat City Municipality (เทศบาลนครนครศรีธรรมราช) — a long, narrow
 * N–S historic city. Centre / Old Town axis ≈ lng 99.9631, lat 8.4364 (the medieval
 * city-wall spine along Ratchadamnoen Rd, anchored by Wat Phra Mahathat). The Khao
 * Luang massif (1,835 m) rises to the west and feeds the Tha Dee canal + the flash
 * floods; the Pak Phanang basin drains to the Gulf in the south-east.
 *
 * Output files in public/geo/nst/ (+ boundaries/ subdir):
 *   buildings.geojson    — building footprints, height from levels×3m or 6m default
 *   boundary.geojson     — city municipal admin boundary (bbox fallback if absent)
 *   roads.geojson        — full classified road network in the city bbox
 *   ring-roads.geojson   — the Old Town axis (roads near the centre; Ratchadamnoen spine)
 *   waterways.geojson    — Tha Dee + city canals/streams/drains
 *   river-buffer.geojson — ~220 m flood corridor around the main canal centrelines
 *   civic-pois.geojson   — hospitals/clinics/schools/police/fire/gov/worship/markets
 *   landmarks.geojson    — named landmarks present in OSM
 *   heritage.geojson     — Wat Phra Mahathat + historic / temple heritage sites
 *   transit-stations.geojson / transit-lines.geojson — SRT terminus, bus terminal, rail
 *   boundaries/provinces.geojson  — NST province (admin_level 4)
 *   boundaries/districts.geojson  — 23 districts (admin_level 6)
 *   flood-risk.geojson   — hand-authored Khao Luang-runoff / Old Town flood-prone polygons
 *   ports/ferries/nav-aids/fisheries.geojson + alphaearth/* — empty stubs (graceful)
 *
 * No-key, public Overpass. Each step is independent — failures don't abort the run.
 */

import fs from "node:fs/promises";
import path from "node:path";
import osmtogeojson from "osmtogeojson";

// City bbox [minlat, minlng, maxlat, maxlng] — Old Town strip + rail station + margin.
const BBOX = [8.40, 99.92, 8.48, 100.00];
const CENTER = { lng: 99.9631, lat: 8.4364 };
const OLD_TOWN_RADIUS_KM = 1.8; // capture radius for the Old Town axis roads
// Province bbox for admin boundaries (Khao Luang → Gulf, Khanom → Phatthalung border).
const PROVINCE_BBOX = [7.80, 99.30, 9.45, 100.35];

const OVERPASS_HOSTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OUT = path.resolve("public/geo/nst");

const bbox = BBOX.join(",");
const pbbox = PROVINCE_BBOX.join(",");
const USER_AGENT = "nst-control-tower-dashboard/1.0 (geodata extract script)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query) {
  let lastErr;
  for (const host of OVERPASS_HOSTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(host, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            accept: "application/json",
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
  const file = path.join(OUT, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(fc));
  console.log(`  → ${file} · ${fc.features.length} features`);
  return fc;
}

const emptyFc = () => ({ type: "FeatureCollection", features: [] });

// ── Geometry helpers ──────────────────────────────────────────────────────

function haversineKm(aLng, aLat, bLng, bLat) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function firstCoord(geometry) {
  switch (geometry?.type) {
    case "Point": return geometry.coordinates;
    case "LineString": return geometry.coordinates[0];
    case "Polygon": return geometry.coordinates[0]?.[0];
    case "MultiPolygon": return geometry.coordinates[0]?.[0]?.[0];
    case "MultiLineString": return geometry.coordinates[0]?.[0];
    default: return null;
  }
}

function centroidOf(geometry) {
  if (geometry?.type === "Point") return geometry.coordinates;
  const ring =
    geometry?.type === "Polygon" ? geometry.coordinates[0]
    : geometry?.type === "MultiPolygon" ? geometry.coordinates[0]?.[0]
    : geometry?.type === "LineString" ? geometry.coordinates
    : null;
  if (!ring || !ring.length) return firstCoord(geometry);
  let cx = 0, cy = 0;
  for (const [x, y] of ring) { cx += x; cy += y; }
  return [cx / ring.length, cy / ring.length];
}

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
  return 6;
}

// Civic kind normalisation — matches CIVIC_PALETTE in map/layers.ts.
function civicKind(p) {
  const a = p.amenity || "", h = p.healthcare || "", e = p.emergency || "", m = p["man_made"] || "";
  if (a === "hospital" || h === "hospital") return "hospital";
  if (a === "clinic" || h === "clinic" || h === "doctor" || h === "centre" || a === "doctors") return "clinic";
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
  if (p.power === "substation") return "power-substation";
  if (m === "water_works" || m === "reservoir_covered") return "water-works";
  if (m === "wastewater_plant") return "wastewater";
  return "other";
}

function roadPriority(highway) {
  switch (highway) {
    case "motorway": case "trunk": return 6;
    case "primary": case "secondary": return 5;
    case "tertiary": return 4;
    case "residential": case "living_street": return 3;
    default: return 2;
  }
}

async function pointify(fc, rawOsm) {
  return fc.features
    .map((f) => {
      if (f.geometry?.type === "Point") return f;
      const raw = rawOsm.elements?.find((el) => String(el.id) === String(f.id?.split("/")[1]));
      if (raw?.center) return { ...f, geometry: { type: "Point", coordinates: [raw.center.lon, raw.center.lat] } };
      const c = centroidOf(f.geometry);
      if (c) return { ...f, geometry: { type: "Point", coordinates: c } };
      return null;
    })
    .filter(Boolean);
}

// ── Queries ────────────────────────────────────────────────────────────────

const buildingsQuery = `[out:json][timeout:120];(way["building"](${bbox});relation["building"](${bbox}););out geom;`;

const boundaryQuery = `[out:json][timeout:60];relation["boundary"="administrative"]["admin_level"~"^(7|8)$"](${bbox});out geom;`;

// City detail: every road class inside the city bbox (the dense Old Town grid).
const roadsCityQuery = `
[out:json][timeout:120];
(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street)$"](${bbox}););
out geom;`;
// Province skeleton: only the arterial classes across the whole province, so the
// map covers NST province without dragging in every rural residential lane.
const roadsProvinceQuery = `
[out:json][timeout:180];
(way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](${pbbox}););
out geom;`;

// City detail: all hydrology inside the city. Province: the significant rivers +
// canals province-wide (Pak Phanang, Tha Dee, coastal canals).
const waterwaysCityQuery = `
[out:json][timeout:120];
(
  way["waterway"~"^(river|canal|stream|drain|ditch)$"](${bbox});
  relation["waterway"~"^(river|canal)$"](${bbox});
);
(._;>;);
out geom;`;
const waterwaysProvinceQuery = `
[out:json][timeout:180];
(
  way["waterway"~"^(river|canal)$"](${pbbox});
  relation["waterway"~"^(river|canal)$"](${pbbox});
);
(._;>;);
out geom;`;

// Civic POIs across the WHOLE PROVINCE (hospitals/schools/police/fire/gov/worship/markets).
const civicQuery = `
[out:json][timeout:180];
(
  node["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](${pbbox});
  way["amenity"~"^(hospital|clinic)$"](${pbbox});
  node["healthcare"~"^(hospital|clinic|doctor|pharmacy|centre)$"](${pbbox});
  way["healthcare"~"^(hospital|clinic|centre)$"](${pbbox});
  node["amenity"~"^(school|university|college|kindergarten)$"](${pbbox});
  way["amenity"~"^(school|university|college|kindergarten)$"](${pbbox});
  node["amenity"="police"](${pbbox});  way["amenity"="police"](${pbbox});
  node["amenity"="fire_station"](${pbbox});  way["amenity"="fire_station"](${pbbox});
  node["amenity"~"^(townhall|courthouse|post_office)$"](${pbbox});
  way["amenity"~"^(townhall|courthouse|post_office)$"](${pbbox});
  node["office"="government"](${pbbox});  way["office"="government"](${pbbox});
  node["amenity"="place_of_worship"](${pbbox});  way["amenity"="place_of_worship"](${pbbox});
  node["amenity"="marketplace"](${pbbox});  way["amenity"="marketplace"](${pbbox});
  node["amenity"="bus_station"](${pbbox});  way["amenity"="bus_station"](${pbbox});
  node["power"="substation"](${pbbox});  way["power"="substation"](${pbbox});
  way["man_made"~"^(water_works|reservoir_covered|wastewater_plant)$"](${pbbox});
);
out center;`;

const landmarksQuery = `
[out:json][timeout:120];
(
  node["railway"="station"](${pbbox});  way["railway"="station"](${pbbox});
  node["amenity"="hospital"]["name"](${pbbox});  way["amenity"="hospital"]["name"](${pbbox});
  node["amenity"="place_of_worship"]["name"](${pbbox});  way["amenity"="place_of_worship"]["name"](${pbbox});
  node["amenity"="townhall"]["name"](${pbbox});  way["amenity"="townhall"]["name"](${pbbox});
  node["office"="government"]["name"](${pbbox});  way["office"="government"]["name"](${pbbox});
  node["amenity"="university"]["name"](${pbbox});  way["amenity"="university"]["name"](${pbbox});
  node["tourism"~"^(attraction|museum)$"]["name"](${pbbox});  way["tourism"~"^(attraction|museum)$"]["name"](${pbbox});
  node["historic"]["name"](${pbbox});  way["historic"]["name"](${pbbox});
  node["natural"="peak"]["name"](${pbbox});
  way["leisure"="park"]["name"](${pbbox});
);
out center;`;

const heritageQuery = `
[out:json][timeout:120];
(
  node["historic"]["name"](${pbbox});  way["historic"]["name"](${pbbox}); relation["historic"]["name"](${pbbox});
  node["amenity"="place_of_worship"]["religion"="buddhist"]["name"](${pbbox});
  way["amenity"="place_of_worship"]["religion"="buddhist"]["name"](${pbbox});
  relation["amenity"="place_of_worship"]["religion"="buddhist"]["name"](${pbbox});
);
out center;`;

const transitStationsQuery = `
[out:json][timeout:90];
(
  node["railway"="station"](${pbbox});  way["railway"="station"](${pbbox});
  node["amenity"="bus_station"](${pbbox});  way["amenity"="bus_station"](${pbbox});
  node["aeroway"="aerodrome"](${pbbox});  way["aeroway"="aerodrome"](${pbbox});
);
out center;`;

const transitLinesQuery = `[out:json][timeout:120];(way["railway"~"^(rail|light_rail)$"](${pbbox}););out geom;`;

const provinceQuery = `
[out:json][timeout:120];
relation["boundary"="administrative"]["admin_level"="4"]["name"~"นครศรีธรรมราช|Nakhon Si Thammarat"];
out geom;`;

const districtsQuery = `
[out:json][timeout:180];
relation["boundary"="administrative"]["admin_level"="6"](${pbbox});
out geom;`;

// ── Extract steps ────────────────────────────────────────────────────────

async function extractBuildings() {
  console.log("\nfetching buildings…");
  const osm = await overpass(buildingsQuery);
  const fc = osmtogeojson(osm);
  fc.features = fc.features
    .filter((f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
    .map((f) => {
      const p = f.properties || {};
      const levels = p["building:levels"] != null ? parseFloat(String(p["building:levels"])) : null;
      return {
        type: "Feature", id: f.id,
        properties: {
          id: f.id, name: p.name ?? null, nameEn: p["name:en"] ?? null, nameTh: p["name:th"] ?? null,
          building: p.building ?? "yes", levels: Number.isFinite(levels) ? levels : null,
          height: buildingHeight(p), amenity: p.amenity ?? null, religion: p.religion ?? null,
        },
        geometry: f.geometry,
      };
    });
  await writeGeoJson("buildings.geojson", fc);
}

async function extractBoundary() {
  console.log("\nfetching city municipal boundary…");
  let found = null;
  try {
    const osm = await overpass(boundaryQuery);
    const fc = osmtogeojson(osm);
    const polys = fc.features.filter(
      (f) => (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon") &&
             !["4", "5", "6"].includes(String(f.properties?.admin_level ?? "")),
    );
    const named = polys.find((f) => /นครศรีธรรมราช|nakhon si thammarat/i.test(f.properties?.name ?? f.properties?.["name:en"] ?? ""));
    found = named ?? polys[0] ?? null;
  } catch (err) {
    console.error("  ✕ boundary query failed:", err.message);
  }
  let fc;
  if (found) {
    fc = { type: "FeatureCollection", features: [{
      type: "Feature",
      properties: {
        id: found.id ?? "nst-boundary",
        name: found.properties?.["name:en"] ?? "Nakhon Si Thammarat City Municipality",
        nameTh: found.properties?.name ?? "เทศบาลนครนครศรีธรรมราช",
        source: "osm", fallback: false,
      },
      geometry: found.geometry,
    }] };
  } else {
    const [minLat, minLng, maxLat, maxLng] = BBOX;
    fc = { type: "FeatureCollection", features: [{
      type: "Feature",
      properties: {
        id: "nst-boundary-bbox", name: "Nakhon Si Thammarat City Municipality (bbox fallback)",
        nameTh: "เทศบาลนครนครศรีธรรมราช", source: "bbox-fallback", fallback: true,
      },
      geometry: { type: "Polygon", coordinates: [[
        [minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat],
      ]] },
    }] };
    console.log("  (used bbox fallback)");
  }
  await writeGeoJson("boundary.geojson", fc);
}

function mapRoad(f) {
  const p = f.properties || {};
  return {
    type: "Feature", id: f.id,
    properties: {
      id: f.id, name: p.name ?? p["name:en"] ?? null, nameEn: p["name:en"] ?? null, nameTh: p["name:th"] ?? null,
      highway: p.highway ?? "residential", priority: roadPriority(p.highway), ref: p.ref ?? null,
    },
    geometry: f.geometry,
  };
}

// Merge two FeatureCollections, de-duping by feature id (first wins).
function mergeById(...fcs) {
  const seen = new Set();
  const features = [];
  for (const fc of fcs) {
    for (const f of fc.features) {
      const key = String(f.id ?? f.properties?.id ?? Math.random());
      if (seen.has(key)) continue;
      seen.add(key);
      features.push(f);
    }
  }
  return { type: "FeatureCollection", features };
}

async function extractRoads() {
  console.log("\nfetching road network (province skeleton + city detail)…");
  // City detail: every class inside the city; Province: arterials across NST.
  const cityOsm = await overpass(roadsCityQuery);
  await sleep(2500);
  const provOsm = await overpass(roadsProvinceQuery);
  const lineOf = (osm) => osmtogeojson(osm).features
    .filter((f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString");
  const cityLines = lineOf(cityOsm);
  const provLines = lineOf(provOsm);
  const merged = mergeById(
    { type: "FeatureCollection", features: cityLines.map(mapRoad) },
    { type: "FeatureCollection", features: provLines.map(mapRoad) },
  );
  await writeGeoJson("roads.geojson", merged);

  // Old Town axis — CITY roads within OLD_TOWN_RADIUS_KM of the centre; flag the
  // Ratchadamnoen spine. This stays a city-focus signature layer.
  const near = cityLines.filter((f) => {
    const c = centroidOf(f.geometry);
    return c && haversineKm(CENTER.lng, CENTER.lat, c[0], c[1]) <= OLD_TOWN_RADIUS_KM;
  }).map((f) => {
    const r = mapRoad(f);
    const txt = `${f.properties?.name ?? ""} ${f.properties?.["name:en"] ?? ""}`;
    r.properties.ring = /ratchadamnoen|ราชดำเนิน|si thammasok|ศรีธรรมโศก/i.test(txt);
    return r;
  });
  await writeGeoJson("ring-roads.geojson", { type: "FeatureCollection", features: near });
}

async function extractWaterways() {
  console.log("\nfetching waterways (province rivers/canals + city detail)…");
  const cityOsm = await overpass(waterwaysCityQuery);
  await sleep(2500);
  const provOsm = await overpass(waterwaysProvinceQuery);
  const mapWater = (osm) => osmtogeojson(osm).features
    .filter((f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString")
    .map((f) => {
      const p = f.properties || {};
      return {
        type: "Feature", id: f.id,
        properties: {
          id: f.id, name: p.name ?? null, nameEn: p["name:en"] ?? null, nameTh: p["name:th"] ?? null,
          waterway: p.waterway ?? "stream",
        },
        geometry: f.geometry,
      };
    });
  const fc = mergeById(
    { type: "FeatureCollection", features: mapWater(cityOsm) },
    { type: "FeatureCollection", features: mapWater(provOsm) },
  );
  await writeGeoJson("waterways.geojson", fc);
  return fc;
}

function buildRiverBuffer(waterFc, bufferM = 220) {
  const rivers = waterFc.features.filter((f) => f.properties.waterway === "river" || f.properties.waterway === "canal");
  const lines = (rivers.length ? rivers : waterFc.features)
    .filter((f) => f.geometry?.type === "LineString")
    .map((f) => f.geometry.coordinates)
    .sort((a, b) => b.length - a.length);
  if (!lines.length) return null;
  const dLat = bufferM / 111_320;
  const dLng = bufferM / (111_320 * Math.cos((CENTER.lat * Math.PI) / 180));
  const features = [];
  for (const coords of lines.slice(0, 3)) {
    if (coords.length < 2) continue;
    const left = [], right = [];
    for (let i = 0; i < coords.length; i++) {
      const [x, y] = coords[i];
      const [px, py] = coords[Math.max(0, i - 1)];
      const [nx, ny] = coords[Math.min(coords.length - 1, i + 1)];
      let tx = nx - px, ty = ny - py;
      const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
      const nlng = -ty * dLng, nlat = tx * dLat;
      left.push([x + nlng, y + nlat]); right.push([x - nlng, y - nlat]);
    }
    const ring = [...left, ...right.reverse()]; ring.push(ring[0]);
    features.push({
      type: "Feature",
      properties: { id: "nst-river-buffer", name: "Tha Dee / canal flood corridor", bufferM },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
  }
  return features.length ? { type: "FeatureCollection", features } : null;
}

async function extractRiverBuffer(waterFc) {
  console.log("\nbuilding river buffer corridor…");
  const fc = buildRiverBuffer(waterFc, 220);
  if (!fc) { console.log("  (no centreline — skipping)"); return; }
  await writeGeoJson("river-buffer.geojson", fc);
}

async function extractCivic() {
  console.log("\nfetching civic POIs…");
  const osm = await overpass(civicQuery);
  const points = await pointify(osmtogeojson(osm), osm);
  const features = points.map((f) => {
    const p = f.properties || {};
    return {
      type: "Feature", id: f.id,
      properties: {
        id: f.id, kind: civicKind(p), name: p.name ?? null,
        "name:en": p["name:en"] ?? null, "name:th": p["name:th"] ?? null,
        amenity: p.amenity ?? null, religion: p.religion ?? null, operator: p.operator ?? null,
      },
      geometry: f.geometry,
    };
  });
  await writeGeoJson("civic-pois.geojson", { type: "FeatureCollection", features });
  const counts = {};
  for (const f of features) counts[f.properties.kind] = (counts[f.properties.kind] || 0) + 1;
  console.log("  by kind:", JSON.stringify(counts));
}

async function extractLandmarks() {
  console.log("\nfetching named landmarks…");
  const osm = await overpass(landmarksQuery);
  const points = await pointify(osmtogeojson(osm), osm);
  const features = points.filter((f) => (f.properties?.name || f.properties?.["name:en"])).map((f) => {
    const p = f.properties || {};
    let kind = "landmark";
    if (p.railway === "station") kind = "railway-station";
    else if (p.amenity === "hospital") kind = "hospital";
    else if (p.amenity === "place_of_worship") kind = p.religion === "muslim" ? "mosque" : "temple";
    else if (p.amenity === "townhall" || p.office === "government") kind = "government";
    else if (p.amenity === "university") kind = "university";
    else if (p.historic) kind = "historic";
    else if (p.leisure === "park") kind = "park";
    else if (p.tourism) kind = "attraction";
    return {
      type: "Feature", id: f.id,
      properties: { id: f.id, kind, name: p.name ?? p["name:en"], nameEn: p["name:en"] ?? null, nameTh: p["name:th"] ?? null },
      geometry: f.geometry,
    };
  });
  await writeGeoJson("landmarks.geojson", { type: "FeatureCollection", features });
}

async function extractHeritage() {
  console.log("\nfetching heritage sites…");
  const osm = await overpass(heritageQuery);
  const points = await pointify(osmtogeojson(osm), osm);
  const features = points.filter((f) => f.properties?.name || f.properties?.["name:en"]).map((f) => {
    const p = f.properties || {};
    const kind = p.historic ? String(p.historic) : (p.amenity === "place_of_worship" ? "temple" : "heritage");
    return {
      type: "Feature", id: f.id,
      properties: {
        id: f.id, kind, name: p.name ?? p["name:en"],
        nameEn: p["name:en"] ?? null, nameTh: p["name:th"] ?? null,
        historic: p.historic ?? null, religion: p.religion ?? null,
        describe: p["description"] ?? null,
      },
      geometry: f.geometry,
    };
  });
  await writeGeoJson("heritage.geojson", { type: "FeatureCollection", features });
}

async function extractTransit() {
  console.log("\nfetching transit stations + lines…");
  try {
    const osm = await overpass(transitStationsQuery);
    const points = await pointify(osmtogeojson(osm), osm);
    const features = points.map((f) => {
      const p = f.properties || {};
      let kind = "bus";
      if (p.railway === "station") kind = "rail";
      else if (p.aeroway === "aerodrome") kind = "airport";
      return {
        type: "Feature", id: f.id,
        properties: { id: f.id, kind, name: p.name ?? p["name:en"] ?? "Station", nameEn: p["name:en"] ?? null, nameTh: p["name:th"] ?? null },
        geometry: f.geometry,
      };
    });
    await writeGeoJson("transit-stations.geojson", { type: "FeatureCollection", features });
  } catch (err) {
    console.error("  ✕ transit stations failed:", err.message);
    await writeGeoJson("transit-stations.geojson", emptyFc());
  }
  await sleep(2000);
  try {
    const osm = await overpass(transitLinesQuery);
    const fc = osmtogeojson(osm);
    const lines = fc.features.filter((f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString")
      .map((f) => ({ type: "Feature", id: f.id, properties: { id: f.id, name: f.properties?.name ?? "SRT Southern Line", railway: f.properties?.railway ?? "rail" }, geometry: f.geometry }));
    await writeGeoJson("transit-lines.geojson", { type: "FeatureCollection", features: lines });
  } catch (err) {
    console.error("  ✕ transit lines failed:", err.message);
    await writeGeoJson("transit-lines.geojson", emptyFc());
  }
}

async function extractAdminBoundaries() {
  console.log("\nfetching province + district boundaries…");
  try {
    const osm = await overpass(provinceQuery);
    const fc = osmtogeojson(osm);
    const polys = fc.features.filter((f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
      .map((f) => ({ type: "Feature", id: f.id, properties: { id: f.id, name: f.properties?.["name:en"] ?? "Nakhon Si Thammarat", nameTh: f.properties?.name ?? "นครศรีธรรมราช", admin_level: 4 }, geometry: f.geometry }));
    await writeGeoJson("boundaries/provinces.geojson", { type: "FeatureCollection", features: polys });
  } catch (err) {
    console.error("  ✕ province boundary failed:", err.message);
    await writeGeoJson("boundaries/provinces.geojson", emptyFc());
  }
  await sleep(3000);
  try {
    const osm = await overpass(districtsQuery);
    const fc = osmtogeojson(osm);
    const polys = fc.features.filter((f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
      .map((f) => ({ type: "Feature", id: f.id, properties: { id: f.id, name: f.properties?.["name:en"] ?? f.properties?.name ?? "District", nameTh: f.properties?.name ?? null, admin_level: 6 }, geometry: f.geometry }));
    await writeGeoJson("boundaries/districts.geojson", { type: "FeatureCollection", features: polys });
  } catch (err) {
    console.error("  ✕ district boundaries failed:", err.message);
    await writeGeoJson("boundaries/districts.geojson", emptyFc());
  }
}

// Hand-authored flood-prone polygons at PROVINCE scale — the Pak Phanang basin
// multi-hazard zones (NSO/academic: ~75% of the basin is flood-prone) plus the
// Khao Luang foothill flash-flood belt and the Old Town city sink. Schema matches
// chonburi-flood-risk (severity/type/households). Illustrative, basin-scale.
async function writeFloodRisk() {
  console.log("\nwriting hand-authored province-scale flood-risk polygons…");
  const fc = { type: "FeatureCollection", features: [
    {
      type: "Feature",
      properties: {
        id: "pak-phanang-basin", name: "Pak Phanang river basin lowlands", nameTh: "ที่ลุ่มลุ่มน้ำปากพนัง",
        severity: "high", type: "river-basin-flood",
        describe: "The Pak Phanang basin (~3,122 km²) — the dominant provincial flood zone. Low, flat lowlands draining to the Gulf; ~75% of the basin is flood-prone (high 11% / medium 63%). Hardest hit in Nov 2025 (Pak Phanang, Chian Yai, Chaloem Phra Kiat).",
        households: 120000,
      },
      geometry: { type: "Polygon", coordinates: [[
        [99.98, 8.00], [100.32, 8.00], [100.32, 8.55], [100.05, 8.60], [99.98, 8.30], [99.98, 8.00],
      ]] },
    },
    {
      type: "Feature",
      properties: {
        id: "khao-luang-foothills", name: "Khao Luang foothill flash-flood belt", nameTh: "แนวเชิงเขาหลวง",
        severity: "high", type: "flash-flood",
        describe: "The western foothill belt of the Khao Luang massif (Lan Saka, Phrom Khiri, Nopphitam, Phipun) where monsoon runoff concentrates into the Tha Dee and feeder canals — the source of the recurrent flash floods (Dec 2016/17, Dec 2024).",
        households: 38000,
      },
      geometry: { type: "Polygon", coordinates: [[
        [99.55, 8.30], [99.92, 8.30], [99.92, 8.62], [99.55, 8.62], [99.55, 8.30],
      ]] },
    },
    {
      type: "Feature",
      properties: {
        id: "old-town-city-sink", name: "Old Town / city low-lying zone", nameTh: "เขตเมืองเก่า–ตัวเมือง",
        severity: "high", type: "drainage-backflow",
        describe: "The City Municipality itself — the Old Town strip west of Ratchadamnoen Rd and around Tha Wang where Khao Luang runoff meets city drainage. Storm drainage backs up during sustained rain.",
        households: 7300,
      },
      geometry: { type: "Polygon", coordinates: [[
        [99.928, 8.400], [99.978, 8.400], [99.978, 8.470], [99.928, 8.470], [99.928, 8.400],
      ]] },
    },
    {
      type: "Feature",
      properties: {
        id: "tha-sala-sichon-coast", name: "Tha Sala–Sichon coastal lowlands", nameTh: "ที่ลุ่มชายฝั่งท่าศาลา–สิชล",
        severity: "medium", type: "coastal-flood",
        describe: "Northern coastal plain (Tha Sala, Sichon, Khanom) — short steep catchments off Khao Luang reaching the Gulf, prone to flash flood + king-tide backflow during the NE monsoon.",
        households: 26000,
      },
      geometry: { type: "Polygon", coordinates: [[
        [99.85, 8.62], [100.10, 8.62], [100.10, 9.20], [99.85, 9.20], [99.85, 8.62],
      ]] },
    },
    {
      type: "Feature",
      properties: {
        id: "southern-lowlands", name: "Chian Yai–Hua Sai southern lowlands", nameTh: "ที่ลุ่มตอนใต้ เชียรใหญ่–หัวไทร",
        severity: "medium", type: "river-basin-flood",
        describe: "The southern Pak Phanang lowlands (Chian Yai, Hua Sai, Chaloem Phra Kiat) — flat, slow-draining terrain that holds putrid floodwater for weeks after major events.",
        households: 34000,
      },
      geometry: { type: "Polygon", coordinates: [[
        [99.98, 7.85], [100.28, 7.85], [100.28, 8.10], [99.98, 8.10], [99.98, 7.85],
      ]] },
    },
  ] };
  await writeGeoJson("flood-risk.geojson", fc);
}

async function writeStubs() {
  console.log("\nwriting empty stubs (non-maritime city / pending EO export)…");
  for (const name of ["ports.geojson", "ferries.geojson", "nav-aids.geojson", "fisheries.geojson",
                       "alphaearth/landcover.geojson", "alphaearth/floodprone.geojson"]) {
    await writeGeoJson(name, emptyFc());
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("[extract-nst-geo] city bbox =", bbox, "| province bbox =", pbbox);
  await fs.mkdir(OUT, { recursive: true });

  const steps = [
    extractBuildings, extractBoundary, extractRoads, extractCivic,
    extractLandmarks, extractHeritage, extractTransit, extractAdminBoundaries,
    writeFloodRisk, writeStubs,
  ];
  for (const step of steps) {
    try { await step(); }
    catch (err) { console.error(`  ✕ ${step.name} failed:`, err.message); }
    await sleep(2500);
  }
  try {
    const waterFc = await extractWaterways();
    await extractRiverBuffer(waterFc);
  } catch (err) {
    console.error("  ✕ waterways/river-buffer failed:", err.message);
  }
  console.log("\n[extract-nst-geo] done");
}

main();
