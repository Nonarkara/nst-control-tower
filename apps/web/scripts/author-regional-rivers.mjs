#!/usr/bin/env node
/**
 * Hand-author the major REGIONAL rivers of southern Thailand that cross
 * the NST province or its boundaries. These are bigger than the NST
 * municipal canals — they span multiple districts/provinces and are the
 * hydrological skeleton of the region.
 *
 * The current OSM extract (public/geo/nst/waterways.geojson) carries the
 * แม่น้ำปากพนัง (Pak Phanang River) but NOT the bigger regional rivers
 * like แม่น้ำตาปี — the longest river in southern Thailand — which the
 * user has now asked us to map. This file ships the missing rivers.
 *
 * Run from apps/web/:  node scripts/author-regional-rivers.mjs
 *
 * Each river is a LineString with 10–15 vertices approximating the real
 * path. Coordinates [lng, lat] (deck.gl order). Status / length / source
 * facts are encoded in properties so the renderer can label and badge
 * them appropriately.
 */

import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/geo/nst/regional-rivers.geojson");

/**
 * แม่น้ำตาปี (Tapi River) — the longest river in southern Thailand.
 *
 * Source: เทือกเขาหลวง (Khao Luang range), อ.พิปูน (Amphoe Phipun),
 *         จ.นครศรีธรรมราช (NST province)
 * Mouth:  อ่าวบ้านดอน (Ao Ban Don), อ.เมืองสุราษฎร์ธานี,
 *         จ.สุราษฎร์ธานี (Surat Thani)
 * Length: ~230 km — longest in southern Thailand
 *
 * Path traces: Khao Luang foothills (Phipun) → flows NORTH through
 * Phrom Khiri → Wiang Sa → Phrasaeng → Mueang Surat Thani → Ao Ban Don.
 * Coordinates approximate from the official Thai hydro chart (the
 * reference image the user shared) and OSM's way/495360888 for the
 * Pak Phanang river.
 */
const RIVERS = [
  {
    id: "hand/maenam-tapi",
    nameEn: "Tapi River",
    nameTh: "แม่น้ำตาปี",
    status: "complete",
    class: "regional",
    lengthKm: 230,
    badge: "Longest river in southern Thailand · แม่น้ำที่ยาวที่สุดในภาคใต้",
    source: {
      en: "Source: Khao Luang range, Amphoe Phipun, NST province",
      th: "ต้นกำเนิด: เทือกเขาหลวง อ.พิปูน จ.นครศรีธรรมราช",
    },
    mouth: {
      en: "Mouth: Ao Ban Don, Mueang Surat Thani",
      th: "ปลาย: อ่าวบ้านดอน อ.เมืองสุราษฎร์ธานี",
    },
    // Listed upstream → downstream so the arrow bearing reads naturally.
    coords: [
      [99.610, 8.720],   // source — Khao Luang foothills, Phipun
      [99.595, 8.780],
      [99.580, 8.850],   // Phipun town area
      [99.555, 8.910],
      [99.515, 8.985],   // Phrom Khiri
      [99.460, 9.060],
      [99.390, 9.130],   // enters Surat Thani province
      [99.320, 9.165],   // Wiang Sa
      [99.250, 9.180],   // Phrasaeng
      [99.180, 9.190],   // approaches Mueang Surat Thani
      [99.145, 9.180],   // meander in Surat Thani
      [99.140, 9.150],
      [99.165, 9.115],   // Ao Ban Don outlet
      [99.180, 9.080],   // Gulf of Thailand
    ],
  },
];

// Convert to GeoJSON FeatureCollection of LineStrings. _bbox + _elevM follow
// the convention used by the OSM extract so downstream consumers treat
// hand-authored features uniformly with OSM features.
const features = RIVERS.map((r) => {
  const lngs = r.coords.map((p) => p[0]);
  const lats = r.coords.map((p) => p[1]);
  const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  return {
    type: "Feature",
    id: r.id,
    properties: {
      id: r.id,
      name: r.nameEn,
      nameEn: r.nameEn,
      nameTh: r.nameTh,
      waterway: "river",
      flowClass: "regional", // longer than "fast" — gets its own renderer branch
      _canalStatus: r.status,
      _riverLengthKm: r.lengthKm,
      _riverBadge: r.badge,
      _riverSource: r.source,
      _riverMouth: r.mouth,
      _bbox: bbox,
    },
    geometry: {
      type: "LineString",
      coordinates: r.coords,
    },
  };
});

const fc = {
  type: "FeatureCollection",
  features,
};

await fs.writeFile(OUT, JSON.stringify(fc));
console.log(`Wrote ${features.length} regional rivers to ${OUT}`);
for (const r of RIVERS) {
  console.log(`  ${r.nameTh.padEnd(16)} ${r.lengthKm} km  [${r.class}]  ${r.coords.length} vertices`);
  console.log(`    ${r.source.en}`);
  console.log(`    ${r.mouth.en}`);
}
