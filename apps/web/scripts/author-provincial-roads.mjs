#!/usr/bin/env node
/**
 * Hand-author the major provincial highways of NST province from the
 * official road map (panteethai.com reference). These are the routes
 * that connect districts to NST City and to neighbouring provinces.
 *
 * Run from apps/web/:  node scripts/author-provincial-roads.mjs
 *
 * Coordinates [lng, lat] (deck.gl order), anchored on real cities/towns.
 * Each route is a LineString with 3-10 vertices approximating the road's
 * path through the province. Route numbers come from the Thai highway
 * shield system: 1-2 digit = national, 3-4 digit = provincial.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT = path.resolve(__dirname, "../public/geo/nst/provincial-roads.geojson");

/**
 * Road catalog. Each route:
 *   id           — stable ID for the renderer
 *   routeNumber  — Thai highway shield number
 *   class        — "national" (1-2 digit) | "provincial" (4-digit)
 *   nameEn/Th    — bilingual label
 *   coords       — [lng, lat][] tracing the route through the province
 *
 * ANCHOR CITIES (canonical coords):
 *   NST City       99.9638, 8.4367
 *   Pak Phanang    100.180, 8.490
 *   Thung Song     99.620,  8.130
 *   Khanom         99.500,  9.200
 *   Sichon         99.780,  9.050
 *   Nop Phi Ta     99.660,  8.700
 *   Lan Saka       99.770,  8.360
 *   Phrom Khiri    99.780,  8.510
 *   Chawang        99.500,  8.420
 *   Phra Phrom     99.940,  8.430
 *   Cha Uat        99.850,  8.300
 *   Ron Phibun     99.850,  8.200
 *   Hua Sai        100.100, 8.320
 *   Chaloem Phra Kiat  100.040, 8.200
 *   Tha Sala       99.930,  8.670
 */
const ROADS = [
  // ─── National Highway 41 — main N-S spine ────────────────────────────
  {
    id: "hwy/41",
    routeNumber: "41",
    class: "national",
    nameEn: "Highway 41 (NST-Krabi-Trang-Phatthalung)",
    nameTh: "ทางหลวงแผ่นดิน 41",
    coords: [
      [99.50, 9.30],   // Krabi direction (north)
      [99.55, 9.10],
      [99.60, 8.90],
      [99.70, 8.70],
      [99.78, 8.51],   // Phrom Khiri
      [99.85, 8.30],   // Cha Uat
      [99.83, 8.13],   // Thung Song
      [99.80, 8.00],   // Trang direction (south)
    ],
  },
  // ─── National Highway 4 (Phetkasem) — east-west coastal ─────────────────
  {
    id: "hwy/4",
    routeNumber: "4",
    class: "national",
    nameEn: "Highway 4 (Phetkasem)",
    nameTh: "ทางหลวงแผ่นดิน 4",
    coords: [
      [99.85, 8.20],   // Ranong direction
      [99.97, 8.20],
      [100.04, 8.20],   // Chaloem Phra Kiat
      [100.10, 8.20],
      [100.18, 8.20],   // Phatthalung direction
    ],
  },

  // ─── Provincial Highway 401 — NST east to Phatthalung ───────────────────
  {
    id: "hwy/401",
    routeNumber: "401",
    class: "provincial",
    nameEn: "Highway 401 (NST → Phatthalung)",
    nameTh: "ทางหลวง 401",
    coords: [
      [99.85, 8.30],   // Cha Uat
      [99.95, 8.40],   // NST
      [100.04, 8.45],   // Phra Phrom area
      [100.10, 8.50],   // Tha Sala
      [100.18, 8.49],   // Pak Phanang
    ],
  },
  // ─── Provincial Highway 403 — toward Phra Phrom / Pak Phanang ───────────
  {
    id: "hwy/403",
    routeNumber: "403",
    class: "provincial",
    nameEn: "Highway 403 (NST → Pak Phanang)",
    nameTh: "ทางหลวง 403",
    coords: [
      [99.96, 8.30],
      [99.97, 8.38],
      [99.98, 8.44],
      [100.04, 8.48],
      [100.12, 8.50],
      [100.18, 8.49],
    ],
  },
  // ─── Provincial Highway 408 — east through Pak Phanang ──────────────────
  {
    id: "hwy/408",
    routeNumber: "408",
    class: "provincial",
    nameEn: "Highway 408 (NST → Pak Phanang Bay)",
    nameTh: "ทางหลวง 408",
    coords: [
      [99.95, 8.40],
      [100.04, 8.45],
      [100.13, 8.47],
      [100.18, 8.46],
      [100.20, 8.42],   // Pak Phanang Bay
    ],
  },
  // ─── Provincial Highway 4103 — north of NST (Phrom Khiri / Phipun) ───────
  {
    id: "hwy/4103",
    routeNumber: "4103",
    class: "provincial",
    nameEn: "Highway 4103 (NST → Tha Sala)",
    nameTh: "ทางหลวง 4103",
    coords: [
      [99.95, 8.45],
      [99.92, 8.55],
      [99.90, 8.65],
      [99.93, 8.70],
    ],
  },
  // ─── Provincial Highway 4104 — northwest towards Nop Phi Ta ──────────────
  {
    id: "hwy/4104",
    routeNumber: "4104",
    class: "provincial",
    nameEn: "Highway 4104 (NST → Nop Phi Ta)",
    nameTh: "ทางหลวง 4104",
    coords: [
      [99.78, 8.51],   // Phrom Khiri
      [99.72, 8.62],
      [99.66, 8.70],   // Nop Phi Ta
    ],
  },
  // ─── Provincial Highway 4141 — Prom Khiri to NST City ───────────────────
  {
    id: "hwy/4141",
    routeNumber: "4141",
    class: "provincial",
    nameEn: "Highway 4141 (Prom Khiri → NST)",
    nameTh: "ทางหลวง 4141",
    coords: [
      [99.78, 8.51],   // Phrom Khiri
      [99.85, 8.48],
      [99.92, 8.45],
      [99.96, 8.44],   // NST
    ],
  },
  // ─── Provincial Highway 4142 — Khanom to Si Chon ─────────────────────────
  {
    id: "hwy/4142",
    routeNumber: "4142",
    class: "provincial",
    nameEn: "Highway 4142 (Khanom → Si Chon)",
    nameTh: "ทางหลวง 4142",
    coords: [
      [99.50, 9.20],   // Khanom
      [99.65, 9.10],
      [99.78, 9.05],   // Si Chon
    ],
  },
  // ─── Provincial Highway 4151 — Phra Phrom area ───────────────────────────
  {
    id: "hwy/4151",
    routeNumber: "4151",
    class: "provincial",
    nameEn: "Highway 4151 (Phra Phrom)",
    nameTh: "ทางหลวง 4151",
    coords: [
      [99.96, 8.42],
      [99.97, 8.38],
      [100.00, 8.32],
      [100.04, 8.28],
    ],
  },
  // ─── Provincial Highway 4153 — towards Pak Phanang south ─────────────────
  {
    id: "hwy/4153",
    routeNumber: "4153",
    class: "provincial",
    nameEn: "Highway 4153 (NST → Hua Sai)",
    nameTh: "ทางหลวง 4153",
    coords: [
      [99.95, 8.40],
      [100.02, 8.36],
      [100.08, 8.32],
      [100.13, 8.30],   // Hua Sai
    ],
  },
  // ─── Provincial Highway 4157 — Hua Sai coast ────────────────────────────
  {
    id: "hwy/4157",
    routeNumber: "4157",
    class: "provincial",
    nameEn: "Highway 4157 (Hua Sai coast)",
    nameTh: "ทางหลวง 4157",
    coords: [
      [100.10, 8.32],
      [100.14, 8.30],
      [100.18, 8.28],
    ],
  },
  // ─── Provincial Highway 4182 — Si Chon area ────────────────────────────
  {
    id: "hwy/4182",
    routeNumber: "4182",
    class: "provincial",
    nameEn: "Highway 4182 (Si Chon)",
    nameTh: "ทางหลวง 4182",
    coords: [
      [99.78, 9.05],
      [99.83, 9.00],
      [99.88, 8.95],
    ],
  },
  // ─── Provincial Highway 4184 — Phrom Khiri to Khuan Niang ──────────────
  {
    id: "hwy/4184",
    routeNumber: "4184",
    class: "provincial",
    nameEn: "Highway 4184 (Phrom Khiri)",
    nameTh: "ทางหลวง 4184",
    coords: [
      [99.78, 8.51],
      [99.72, 8.48],
      [99.65, 8.45],
    ],
  },
  // ─── Provincial Highway 4186 — east towards Nop Phi Ta ───────────────────
  {
    id: "hwy/4186",
    routeNumber: "4186",
    class: "provincial",
    nameEn: "Highway 4186 (Nop Phi Ta)",
    nameTh: "ทางหลวง 4186",
    coords: [
      [99.78, 8.70],
      [99.72, 8.75],
      [99.66, 8.80],
    ],
  },
  // ─── Provincial Highway 4188 — east towards Pak Phanang ─────────────────
  {
    id: "hwy/4188",
    routeNumber: "4188",
    class: "provincial",
    nameEn: "Highway 4188 (Pak Phanang east)",
    nameTh: "ทางหลวง 4188",
    coords: [
      [100.13, 8.47],
      [100.18, 8.45],
      [100.22, 8.42],
    ],
  },
  // ─── Provincial Highway 4194 — Chawang ───────────────────────────────────
  {
    id: "hwy/4194",
    routeNumber: "4194",
    class: "provincial",
    nameEn: "Highway 4194 (NST → Chawang)",
    nameTh: "ทางหลวง 4194",
    coords: [
      [99.78, 8.40],   // Lan Saka
      [99.65, 8.41],
      [99.50, 8.42],   // Chawang
    ],
  },
  // ─── Provincial Highway 4195 — east from Chawang ─────────────────────────
  {
    id: "hwy/4195",
    routeNumber: "4195",
    class: "provincial",
    nameEn: "Highway 4195 (Chawang east)",
    nameTh: "ทางหลวง 4195",
    coords: [
      [99.50, 8.42],   // Chawang
      [99.62, 8.45],
      [99.75, 8.50],
      [99.85, 8.48],
    ],
  },
  // ─── Provincial Highway 4201 — between NST and Pak Phanang ─────────────
  {
    id: "hwy/4201",
    routeNumber: "4201",
    class: "provincial",
    nameEn: "Highway 4201 (NST south)",
    nameTh: "ทางหลวง 4201",
    coords: [
      [99.92, 8.40],
      [99.88, 8.30],
      [99.84, 8.20],
    ],
  },
  // ─── Provincial Highway 4214 — towards Thung Yai / Lan Saka ──────────────
  {
    id: "hwy/4214",
    routeNumber: "4214",
    class: "provincial",
    nameEn: "Highway 4214 (Thung Yai / Lan Saka)",
    nameTh: "ทางหลวง 4214",
    coords: [
      [99.50, 8.10],   // Thung Yai
      [99.65, 8.25],
      [99.78, 8.36],   // Lan Saka
    ],
  },
  // ─── Provincial Highway 4225 — south towards Ron Phibun ─────────────────
  {
    id: "hwy/4225",
    routeNumber: "4225",
    class: "provincial",
    nameEn: "Highway 4225 (Ron Phibun)",
    nameTh: "ทางหลวง 4225",
    coords: [
      [99.85, 8.20],   // Ron Phibun
      [99.78, 8.10],
      [99.72, 8.00],
    ],
  },
  // ─── Provincial Highway 4232 — Sichon area ─────────────────────────────
  {
    id: "hwy/4232",
    routeNumber: "4232",
    class: "provincial",
    nameEn: "Highway 4232 (Si Chon)",
    nameTh: "ทางหลวง 4232",
    coords: [
      [99.85, 9.05],
      [99.78, 9.05],   // Si Chon
      [99.70, 9.00],
    ],
  },
];

// Convert to GeoJSON FeatureCollection of LineStrings
const features = ROADS.map((r) => {
  const lngs = r.coords.map((c) => c[0]);
  const lats = r.coords.map((c) => c[1]);
  const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  return {
    type: "Feature",
    id: r.id,
    properties: {
      id: r.id,
      routeNumber: r.routeNumber,
      class: r.class,
      name: r.nameEn,
      nameEn: r.nameEn,
      nameTh: r.nameTh,
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

// Use sync writeFile — async fs.promises on this codebase's filesystem
// can silently fail to flush; sync is the safe path for one-shot
// hand-authored datasets.
fs.writeFileSync(OUT, JSON.stringify(fc));

const counts = features.reduce((acc, f) => {
  const c = f.properties.class;
  acc[c] = (acc[c] ?? 0) + 1;
  return acc;
}, {});
console.log(`Wrote ${features.length} provincial roads to ${OUT}`);
for (const [c, n] of Object.entries(counts)) {
  console.log(`  ${c.padEnd(12)} ${n}`);
}
console.log(`  TOTAL       ${features.length}`);
