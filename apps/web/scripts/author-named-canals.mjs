#!/usr/bin/env node
/**
 * Hand-author the major Thai-named canals of NST City Municipality.
 *
 * The OSM Overpass extract at public/geo/nst/waterways.geojson covers most
 * named waterways, but the most important canals in the official hydrology
 * map (RID, Royal Irrigation Department) aren't in OSM at all — only the
 * Pak Phanang River (แม่น้ำปากพนัง, way/495360888) has OSM coverage. The
 * user specifically called out the Royal Project Canal (คลองพระราชดำริ)
 * which is "still under construction" and missing from the dataset.
 *
 * Run from apps/web/:  node scripts/author-named-canals.mjs
 *
 * The canal paths are based on the published RID hydrology chart of NST
 * (which the user shared). Coordinates [lng, lat] (deck.gl order). Each
 * canal is a LineString with 4–12 vertices approximating the real path
 * through the Old Town, the Pak Phanang basin, and the mountain foothills.
 * These are NOT precise — they're the level of approximation a printed
 * 1:250,000 hydrology chart would show.
 */

import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/geo/nst/named-canals.geojson");

// Anchor points (canonical, used across the dashboard)
// Khao Luang summit     99.733, 8.500
// Khiri Wong            99.80,  8.46
// Lan Saka              99.83,  8.43
// NST City / Old Town   99.965, 8.437
// Pak Phanang Bay       100.184, 8.4942

/**
 * Each canal:
 *   id           — stable OSM-like id (hand/<slug>)
 *   nameEn       — Latin name
 *   nameTh       — Thai name
 *   status       — "complete" | "under-construction" | "planned"
 *   class        — "trunk" | "branch" | "drainage"
 *   coords       — [lng, lat][] along the canal centreline
 *
 * Coords are listed upstream → downstream so the flow direction reads
 * naturally (the existing hydroMap layer derives the arrow bearing from
 * the way direction).
 */
const CANALS = [
  // ─── Main cascade (mountain → city) ─────────────────────────────────────
  {
    id: "hand/tha-dee",
    nameEn: "Tha Dee Canal",
    nameTh: "คลองท่าดี",
    status: "complete",
    class: "trunk",
    coords: [
      [99.748, 8.490],   // source — Khao Luang foothills
      [99.775, 8.475],
      [99.810, 8.460],   // Khiri Wong area
      [99.840, 8.445],
      [99.870, 8.440],   // Lan Saka
      [99.910, 8.435],
      [99.940, 8.430],
      [99.965, 8.437],   // NST Old Town / Tha Dee junction
    ],
  },
  {
    id: "hand/tha-wang",
    nameEn: "Tha Wang Canal",
    nameTh: "คลองท่าวัง",
    status: "complete",
    class: "trunk",
    coords: [
      [99.760, 8.510],   // source — north of Khao Luang
      [99.800, 8.490],
      [99.840, 8.470],
      [99.880, 8.460],
      [99.920, 8.450],
      [99.965, 8.437],   // joins Tha Dee at NST City
    ],
  },

  // ─── Royal Project Canal — incomplete, highlighted as "under construction" ─
  // This is the user's specific call-out. RID designed it as a flood-diversion
  // channel from the lower Tha Dee east through the Pak Phanang floodplain to
  // the bay — meant to take pressure off the city during heavy rain. Per the
  // published chart, only the eastern segment (from NST City toward the bay)
  // is built; the western reach (from Tha Dee junction westward) is still in
  // the planning/construction phase.
  {
    id: "hand/royal-project-canal",
    nameEn: "Royal Project Canal",
    nameTh: "คลองพระราชดำริ",
    status: "under-construction",
    class: "trunk",
    coords: [
      [99.980, 8.430],   // planned western terminus (Tha Dee junction)
      [100.010, 8.430],
      [100.040, 8.435],
      [100.070, 8.445],
      [100.100, 8.460],
      [100.130, 8.475],
      [100.150, 8.485],  // built eastern terminus (toward Pak Phanang Bay)
    ],
    // Only the eastern half is built; mark the planned reach so the renderer
    // can split the line into "solid" + "dashed" segments. Coordinates are
    // indices into `coords` (the planned reach goes from 0 → 3).
    plannedReach: [0, 3],
  },

  // ─── Pak Phanang River — the main outlet to the Gulf ───────────────────
  // Already in OSM as แม่น้ำปากพนัง (way/495360888), but the published chart
  // labels it คลองปากพนัง in the lower urban reach. Author the upper basin
  // path here so the chart's labels match.
  {
    id: "hand/pak-phanang-upper",
    nameEn: "Pak Phanang Canal (upper)",
    nameTh: "คลองปากพนัง (ตอนบน)",
    status: "complete",
    class: "trunk",
    coords: [
      [99.770, 8.520],   // source — Khao Luang east ridge
      [99.820, 8.510],
      [99.870, 8.500],
      [99.920, 8.490],
      [99.970, 8.485],
      [100.020, 8.490],
      [100.070, 8.495],
      [100.120, 8.495],
      [100.170, 8.490],  // approaches the bay
    ],
  },

  // ─── Western tributary — Cha Uat canal ─────────────────────────────────
  {
    id: "hand/cha-uat",
    nameEn: "Cha Uat Canal",
    nameTh: "คลองชะอวด",
    status: "complete",
    class: "branch",
    coords: [
      [99.680, 8.420],   // source — Khao Luang foothills
      [99.720, 8.425],
      [99.770, 8.430],
      [99.820, 8.435],
      [99.870, 8.440],
      [99.910, 8.445],   // joins the cascade
    ],
  },

  // ─── Eastern district canal — Nakhon Noi ────────────────────────────────
  {
    id: "hand/nakhon-noi",
    nameEn: "Nakhon Noi Canal",
    nameTh: "คลองนครน้อย",
    status: "complete",
    class: "branch",
    coords: [
      [99.990, 8.420],
      [100.030, 8.425],
      [100.070, 8.430],
      [100.110, 8.445],
      [100.150, 8.470],
      [100.180, 8.490],  // reaches Pak Phanang Bay
    ],
  },

  // ─── Phra Phrom district canal ──────────────────────────────────────────
  {
    id: "hand/phra-phrom",
    nameEn: "Phra Phrom Canal",
    nameTh: "คลองพระพรหม",
    status: "complete",
    class: "branch",
    coords: [
      [99.890, 8.470],
      [99.920, 8.465],
      [99.950, 8.460],
      [99.975, 8.455],
      [100.000, 8.450],
    ],
  },

  // ─── Ban Na district canal ──────────────────────────────────────────────
  {
    id: "hand/ban-na",
    nameEn: "Ban Na Canal",
    nameTh: "คลองบ้านนา",
    status: "complete",
    class: "branch",
    coords: [
      [99.870, 8.490],
      [99.910, 8.485],
      [99.950, 8.480],
      [99.990, 8.475],
      [100.030, 8.470],
      [100.070, 8.465],
    ],
  },
];

// Convert to GeoJSON FeatureCollection of LineStrings. _bbox + _elevM follow
// the convention used by the OSM extract so downstream consumers (the
// hydroFlowArrowsLayer, buildingHeightMeters, etc.) treat hand-authored
// features uniformly with OSM features.
const features = CANALS.map((c) => {
  const lngs = c.coords.map((p) => p[0]);
  const lats = c.coords.map((p) => p[1]);
  const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  return {
    type: "Feature",
    id: c.id,
    properties: {
      id: c.id,
      name: c.nameEn,
      nameEn: c.nameEn,
      nameTh: c.nameTh,
      waterway: "canal",
      flowClass: c.class === "trunk" ? "fast" : "medium",
      // Encode the status + planned reach in properties so the renderer
      // can branch on them without re-parsing the geometry.
      _canalStatus: c.status,
      _plannedReach: c.plannedReach ?? null,
      _bbox: bbox,
    },
    geometry: {
      type: "LineString",
      coordinates: c.coords,
    },
  };
});

const fc = {
  type: "FeatureCollection",
  features,
};

await fs.writeFile(OUT, JSON.stringify(fc));
console.log(`Wrote ${features.length} named canals to ${OUT}`);
for (const c of CANALS) {
  const flag = c.status === "under-construction" ? "🚧 " : "";
  console.log(`  ${flag}${c.nameTh.padEnd(20)} ${c.coords.length} vertices  [${c.class}]`);
}
