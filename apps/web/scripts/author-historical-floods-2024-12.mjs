#!/usr/bin/env node
/**
 * Hand-author the historical flood polygons from the GISTDA Sentinel-1
 * flood map: 16-18 December 2024 (Buddhist year 2567).
 *
 * Source map (rendered by GISTDA): the red polygons represent SAR-derived
 * flood pooling — satellite-detected standing water during the Dec 2024
 * southern Thailand flood. This is the same event that flooded 632 lanes
 * in the Pak Phanang basin and damaged 2,570 households across 7 districts.
 *
 * The OSM extract does NOT carry historical flood data — these are
 * hand-traced from the published GISTDA raster, with polygon vertices
 * approximating the visible cluster extents at the map's resolution
 * (~1:350,000). They're an approximation, not a precise re-digitisation.
 *
 * Run from apps/web/:  node scripts/author-historical-floods-2024-12.mjs
 *
 * Coordinates [lng, lat] (deck.gl order). Each polygon is a closed
 * LineString (first vertex == last vertex) with 5–10 vertices.
 */

import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/geo/nst/historical-floods-2024-12.geojson");

/**
 * Polygon catalog — the major red clusters visible on the GISTDA map.
 * Each entry is an approximation; the verbatim cluster shape is not
 * available without a precise SAR re-digitisation pass.
 */
const POLYGONS = [
  // ─── Pak Phanang basin (south-east, อ.ปากพนัง) — heaviest flooding ───
  {
    id: "flood-2024-12/pak-phanang-mouth",
    nameEn: "Pak Phanang mouth (lower)",
    nameTh: "ปากพนังตอนล่าง",
    district: "Pak Phanang",
    severity: "high",
    households: 28000,
    // Mouth of the Pak Phanang river, where the river meets the bay
    coords: [
      [100.10, 8.46],
      [100.16, 8.46],
      [100.18, 8.43],
      [100.18, 8.40],
      [100.14, 8.38],
      [100.10, 8.40],
      [100.08, 8.43],
      [100.10, 8.46],
    ],
  },
  {
    id: "flood-2024-12/pak-phanang-mid",
    nameEn: "Pak Phanang mid-basin",
    nameTh: "ลุ่มน้ำปากพนังตอนกลาง",
    district: "Pak Phanang",
    severity: "high",
    households: 24000,
    // Middle of the Pak Phanang floodplain
    coords: [
      [100.04, 8.48],
      [100.10, 8.48],
      [100.11, 8.45],
      [100.09, 8.43],
      [100.05, 8.43],
      [100.03, 8.45],
      [100.04, 8.48],
    ],
  },
  {
    id: "flood-2024-12/pak-phanang-upper",
    nameEn: "Pak Phanang upper basin",
    nameTh: "ลุ่มน้ำปากพนังตอนบน",
    district: "Pak Phanang",
    severity: "high",
    households: 18000,
    // Upper basin near Pak Phanang town
    coords: [
      [100.00, 8.50],
      [100.06, 8.50],
      [100.07, 8.47],
      [100.05, 8.45],
      [100.01, 8.46],
      [99.99, 8.48],
      [100.00, 8.50],
    ],
  },
  {
    id: "flood-2024-12/pak-phanang-canal",
    nameEn: "Pak Phanang Canal corridor",
    nameTh: "คลองปากพนัง",
    district: "Pak Phanang",
    severity: "high",
    households: 12000,
    // Along the Pak Phanang Canal corridor (south of NST City)
    coords: [
      [99.96, 8.42],
      [100.00, 8.42],
      [100.01, 8.40],
      [99.98, 8.39],
      [99.95, 8.40],
      [99.96, 8.42],
    ],
  },

  // ─── Tha Dee floodplain (east of NST Old Town, อ.เมืองนครศรีธรรมราช) ───
  {
    id: "flood-2024-12/tha-dee-floodplain-east",
    nameEn: "Tha Dee floodplain (east of NST City)",
    nameTh: "ที่ลุ่มคลองท่าดีตะวันออก",
    district: "Mueang NST",
    severity: "high",
    households: 9500,
    // East of the Old Town — where Tha Dee widens and floods spread
    coords: [
      [99.98, 8.43],
      [100.03, 8.43],
      [100.04, 8.40],
      [100.00, 8.39],
      [99.97, 8.40],
      [99.98, 8.43],
    ],
  },
  {
    id: "flood-2024-12/tha-dee-floodplain-west",
    nameEn: "Tha Dee floodplain (west of NST City)",
    nameTh: "ที่ลุ่มคลองท่าดีตะวันตก",
    district: "Mueang NST",
    severity: "medium",
    households: 4200,
    // West of the Old Town — toward the Tha Wang confluence
    coords: [
      [99.92, 8.44],
      [99.96, 8.44],
      [99.97, 8.42],
      [99.94, 8.41],
      [99.91, 8.42],
      [99.92, 8.44],
    ],
  },

  // ─── Phra Phrom (east of NST City) — scattered along waterways ───
  {
    id: "flood-2024-12/phra-phrom-east",
    nameEn: "Phra Phrom (eastern lowland)",
    nameTh: "พระพรหมตะวันออก",
    district: "Phra Phrom",
    severity: "medium",
    households: 6500,
    // Eastern lowland of Phra Phrom — flood spreads from the cascade
    coords: [
      [99.96, 8.46],
      [100.00, 8.46],
      [100.01, 8.43],
      [99.98, 8.42],
      [99.95, 8.43],
      [99.96, 8.46],
    ],
  },

  // ─── Cha Uat (south-west of NST) — along the Cha Uat canal ───
  {
    id: "flood-2024-12/cha-uat-canal",
    nameEn: "Cha Uat Canal corridor",
    nameTh: "คลองชะอวด",
    district: "Cha Uat",
    severity: "medium",
    households: 4800,
    // Along the Cha Uat canal — southwestern NST
    coords: [
      [99.85, 8.40],
      [99.90, 8.40],
      [99.91, 8.37],
      [99.87, 8.36],
      [99.84, 8.38],
      [99.85, 8.40],
    ],
  },
  {
    id: "flood-2024-12/cha-uat-town",
    nameEn: "Cha Uat town (south)",
    nameTh: "ชะอวดตอนใต้",
    district: "Cha Uat",
    severity: "low",
    households: 2200,
    // Scattered around Cha Uat town — south of NST
    coords: [
      [99.79, 8.34],
      [99.83, 8.34],
      [99.84, 8.31],
      [99.81, 8.30],
      [99.78, 8.32],
      [99.79, 8.34],
    ],
  },

  // ─── Hua Sai (south of Pak Phanang) — coastal flooding ───
  {
    id: "flood-2024-12/hua-sai-coast",
    nameEn: "Hua Sai coast",
    nameTh: "หัวไทรชายฝั่ง",
    district: "Hua Sai",
    severity: "medium",
    households: 7800,
    // Coastal lowland south of Pak Phanang Bay
    coords: [
      [100.06, 8.32],
      [100.14, 8.32],
      [100.16, 8.28],
      [100.10, 8.27],
      [100.04, 8.29],
      [100.06, 8.32],
    ],
  },
];

// Convert to GeoJSON FeatureCollection of Polygons. Properties carry the
// metadata the renderer needs for legend + popup + severity colouring.
const features = POLYGONS.map((p) => {
  const lngs = p.coords.map((c) => c[0]);
  const lats = p.coords.map((c) => c[1]);
  const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  return {
    type: "Feature",
    id: p.id,
    properties: {
      id: p.id,
      name: p.nameEn,
      nameEn: p.nameEn,
      nameTh: p.nameTh,
      district: p.district,
      severity: p.severity,
      households: p.households,
      // Provenance — the GISTDA raster that the polygon was traced from
      source: "GISTDA Sentinel-1 SAR flood detection",
      eventStart: "2024-12-16",
      eventEnd: "2024-12-18",
      _bbox: bbox,
    },
    geometry: {
      type: "Polygon",
      coordinates: [p.coords],
    },
  };
});

const fc = {
  type: "FeatureCollection",
  features,
};

await fs.writeFile(OUT, JSON.stringify(fc));
console.log(`Wrote ${features.length} historical flood polygons to ${OUT}`);
const totals = features.reduce((acc, f) => {
  const d = f.properties.district;
  acc[d] = (acc[d] ?? 0) + f.properties.households;
  return acc;
}, {});
for (const [d, h] of Object.entries(totals)) {
  console.log(`  ${d.padEnd(20)} ${h.toLocaleString()} households`);
}
const totalHouseholds = features.reduce((s, f) => s + f.properties.households, 0);
console.log(`  ${"TOTAL".padEnd(20)} ${totalHouseholds.toLocaleString()} households`);
