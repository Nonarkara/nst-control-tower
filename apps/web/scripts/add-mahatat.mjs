#!/usr/bin/env node
/**
 * Hand-author the Wat Phra Mahathat Voramahavihan complex in NST Old Town.
 *
 * This is added on top of the OSM extract because OSM Overpass is unreachable
 * from this machine today (rate-limit / 406 errors on every host). The
 * canonical Old Town coordinates (8.4367°N, 99.9638°E) are well-established —
 * the chedi is the tallest structure in southern Thailand (~78m) and the
 * defining landmark of the city. The complex footprint is approximated from
 * the publicly-known cloister wall boundary.
 *
 * Run from apps/web/:  node scripts/add-mahatat.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/geo/nst/buildings.geojson");

// Canonical coordinates for Wat Phra Mahathat Voramahavihan (NST Old Town).
// Source: the temple's published address (Ratchadamnoen Rd, Mueang NST) +
// satellite imagery cross-reference. Coordinates [lng, lat] (deck.gl order).
//
//   Chedi (central tower):  ~25m square at the base, 78m tall
//   Outer cloister wall:    ~220m × 200m rectangular complex
//
// We author TWO features so the chedi reads as a clear golden spike in the
// 3D skyline, with the cloister walls forming a gold "frame" around it.
const CHEDI_CENTER = [99.96376, 8.43666];

// Chedi base footprint — 25m square (≈0.00028° lng × 0.00023° lat at this latitude).
const HALF = 0.00014;
const CHEDI = {
  type: "Polygon",
  coordinates: [[
    [CHEDI_CENTER[0] - HALF,        CHEDI_CENTER[1] - HALF * 0.82],
    [CHEDI_CENTER[0] + HALF,        CHEDI_CENTER[1] - HALF * 0.82],
    [CHEDI_CENTER[0] + HALF,        CHEDI_CENTER[1] + HALF * 0.82],
    [CHEDI_CENTER[0] - HALF,        CHEDI_CENTER[1] + HALF * 0.82],
    [CHEDI_CENTER[0] - HALF,        CHEDI_CENTER[1] - HALF * 0.82],
  ]],
};

// Outer cloister wall — 220m × 200m box around the chedi.
// At lat 8.4366: 1° lng ≈ 107.5 km → 220m ≈ 0.00205° lng
//                1° lat ≈ 110.6 km → 200m ≈ 0.00181° lat
const CLOISTER_W = 0.00205;
const CLOISTER_H = 0.00181;
const CLOISTER = {
  type: "Polygon",
  coordinates: [[
    [CHEDI_CENTER[0] - CLOISTER_W, CHEDI_CENTER[1] - CLOISTER_H],
    [CHEDI_CENTER[0] + CLOISTER_W, CHEDI_CENTER[1] - CLOISTER_H],
    [CHEDI_CENTER[0] + CLOISTER_W, CHEDI_CENTER[1] + CLOISTER_H],
    [CHEDI_CENTER[0] - CLOISTER_W, CHEDI_CENTER[1] + CLOISTER_H],
    [CHEDI_CENTER[0] - CLOISTER_W, CHEDI_CENTER[1] - CLOISTER_H],
  ]],
};

const MAHATAT = {
  chedi: {
    type: "Feature",
    id: "hand/mahatat-chedi",
    properties: {
      id: "hand/mahatat-chedi",
      name: "วัดพระมหาธาตุ วรมหาวิหาร — เจดีย์",
      nameEn: "Wat Phra Mahathat Voramahavihan — Chedi",
      nameTh: "วัดพระมหาธาตุ วรมหาวิหาร — เจดีย์",
      building: "temple",
      religion: "buddhist",
      amenity: "place_of_worship",
      tourism: "attraction",
      height: 78,
      levels: null,
      operator: null,
      office: null,
      healthcare: null,
      shop: null,
      source: "hand-authored",
      // Municipal override — wins over OSM-derived classification so this
      // golden spire paints gold even before classifyBuilding sees it.
      mnType: "temple",
      _elevM: 78,
      _bbox: [
        CHEDI_CENTER[0] - HALF, CHEDI_CENTER[1] - HALF * 0.82,
        CHEDI_CENTER[0] + HALF, CHEDI_CENTER[1] + HALF * 0.82,
      ],
    },
    geometry: CHEDI,
  },
  cloister: {
    type: "Feature",
    id: "hand/mahatat-cloister",
    properties: {
      id: "hand/mahatat-cloister",
      name: "วัดพระมหาธาตุ วรมหาวิหาร — กำแพงแก้ว",
      nameEn: "Wat Phra Mahathat Voramahavihan — Cloister",
      nameTh: "วัดพระมหาธาตุ วรมหาวิหาร — กำแพงแก้ว",
      building: "temple",
      religion: "buddhist",
      amenity: "place_of_worship",
      tourism: "attraction",
      height: 12,
      levels: 3,
      operator: null,
      office: null,
      healthcare: null,
      shop: null,
      source: "hand-authored",
      mnType: "temple",
      _elevM: 12,
      _bbox: [
        CHEDI_CENTER[0] - CLOISTER_W, CHEDI_CENTER[1] - CLOISTER_H,
        CHEDI_CENTER[0] + CLOISTER_W, CHEDI_CENTER[1] + CLOISTER_H,
      ],
    },
    geometry: CLOISTER,
  },
};

async function main() {
  const raw = await fs.readFile(OUT, "utf8");
  const fc = JSON.parse(raw);

  // Remove any prior hand-authored Mahatat entries (idempotent re-run).
  fc.features = fc.features.filter(
    (f) => f?.properties?.id !== MAHATAT.chedi.properties.id
        && f?.properties?.id !== MAHATAT.cloister.properties.id,
  );
  fc.features.push(MAHATAT.chedi);
  fc.features.push(MAHATAT.cloister);

  await fs.writeFile(OUT, JSON.stringify(fc));
  console.log(`Wrote ${fc.features.length} features (added 2 Mahatat polygons).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
