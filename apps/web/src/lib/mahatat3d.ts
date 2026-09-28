/**
 * Mahatat3D — parametric 3D model of Wat Phra Mahathat Voramahavihan.
 *
 * The compound sits in NST Old Town at the canonical coordinates (99.9638°E,
 * 8.4367°N). The great chedi is the defining landmark of the city and the
 * subject of an active UNESCO World Heritage nomination.
 *
 * DIMENSIONS — taken from the nomination itself, not estimated. The OUV text
 * gives "H. 28 wa, W. 14 wa; 1 wa = 2 metre", i.e. a chedi 56 m tall and 28 m
 * wide, and states the 2:1 ratio is deliberate: 28 corporeality (รูป 28) to 14
 * functions of consciousness (กิจของจิต 14). The segment table below sums to exactly
 * 56.0 m, so the model is dimensionally checkable against the nomination.
 *
 * The previous version of this file claimed "~78m" — that number came from a
 * 48 m stack multiplied by the buildings layer's elevationScale of 1.65, so
 * the model was displaying a monument 40% taller than it is. A heritage
 * monument in a World Heritage nomination is the one object on this map
 * where "close enough" is not acceptable, so the chedi now renders at
 * elevationScale 1.0 and reads at true size against the city.
 *
 * Architectural form (bottom → top):
 *   - Square multi-tier plinth   (3 receding tiers, 6 m total, 28 m square)
 *   - Octagonal drum             (radius 14 m, 9.3 m tall)
 *   - Bell-shaped anda           (3 stacked drums, 14→9.5 m radius, 17.5 m)
 *   - Harmika                    (square box, 9.3 m × 9.3 m × 3.5 m)
 *   - Yasti (conical spire)      (4 stacked drums, 4.7→0.8 m radius, 16.3 m)
 *   - Finial                     (~3.5 m, gilded)
 *
 * Surrounding halls (all inside the cloister wall):
 *   - Ubosot (ordination hall)   — rectangle, 25m × 18m × 10m
 *   - Wihan (assembly hall)      — rectangle, 35m × 22m × 14m
 *   - Prang (Thai corn-cob spire)— 4-tier cylinder + finial, ~16m tall
 *   - Ho trai (scripture hall)   — rectangle, 10m × 8m × 6m
 *   - 8 satellite chedis         — small stupas around the main chedi
 *
 * The cloister wall itself comes from buildings.geojson (the hand-authored
 * `hand/mahatat-cloister` polygon, extruded to 12m).
 */

import { ColumnLayer } from "@deck.gl/layers";
import { PolygonLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

// ─── Canonical position (matches hand/mahatat-chedi in buildings.geojson) ──

export const MAHATAT_CENTER: { lng: number; lat: number } = {
  lng: 99.9638,
  lat: 8.4367,
};

// ─── Helpers — small offsets in metres, converted to degrees ──────────────

// At lat 8.4367: 1° lng ≈ 107.6 km → 1 m ≈ 9.29e-6 deg lng
//                 1° lat ≈ 110.6 km → 1 m ≈ 9.04e-6 deg lat
const LNG_PER_M = 9.29e-6;
const LAT_PER_M = 9.04e-6;

function offsetM(center: { lng: number; lat: number }, eastM: number, northM: number) {
  return {
    lng: center.lng + eastM * LNG_PER_M,
    lat: center.lat + northM * LAT_PER_M,
  };
}

// ─── Color palette — warm stone-white (the actual chedi is yellow-cream,
// pale grey-gold under sunlight) with subtle banding to read the tiers ──────

const STONE_TOP: [number, number, number] = [240, 222, 178]; // pale gold-cream
const STONE_MID: [number, number, number] = [222, 196, 142]; // mid stone-gold
const STONE_LOW: [number, number, number] = [196, 168, 122]; // shaded base stone

// Roof / finial gold (slightly brighter — reads as the gilded top)
const GOLD_FINIAL: [number, number, number] = [255, 218, 130];

// Tile red (Thai temple roofs — applied to the prang + ubosot roof band)
const ROOF_RED: [number, number, number] = [168, 56, 38];

// Wall white (the cloister + hall walls — actual NST temple walls are
// whitewashed plaster over brick)
const WALL_WHITE: [number, number, number] = [232, 226, 214];

// ─── The great chedi — built bottom-to-top as a vertical stack ────────────
//
// Each segment is rendered as either an extruded square polygon (SquareLayer
// style) or a polygonal column. The deck.gl `getElevation` returns the
// segment height; we compose the chedi by stacking 13 segments and letting
// each segment's height sit on top of the previous one.

interface ChediSegment {
  /** Centre offset from MAHATAT_CENTER, in metres (east, north) */
  eastM: number;
  northM: number;
  /** Width × depth in metres (for square plinths); diameter in metres
   *  (for round segments — bell, drum, spire). Round segments ignore this
   *  field and use `radiusM` instead. */
  widthM: number;
  depthM: number;
  /** For round segments. */
  radiusM?: number;
  /** Height of the segment in metres. */
  heightM: number;
  /** Cumulative height in metres — segment base elevation. */
  baseM: number;
  /** Colour. */
  rgb: [number, number, number];
  /** 12-sided polygon for "octagonal" drum/bell; 16 for spire (smoother). */
  sides: number;
  /** "round" = ColumnLayer, "square" = PolygonLayer extruded. */
  shape: "round" | "square";
}

const CHEDI_BASE_ELEV = 0; // sits on ground level inside the cloister

const CHEDI_SEGMENTS: ChediSegment[] = [
  // 1. Square multi-tier plinth (3 receding tiers) — Sri Lankan-style base
  { eastM: 0, northM: 0, widthM: 28, depthM: 28, heightM: 2.2, baseM: 0,  rgb: STONE_LOW, sides: 4, shape: "square" },
  { eastM: 0, northM: 0, widthM: 25, depthM: 25, heightM: 2.0, baseM: 2.2, rgb: STONE_MID, sides: 4, shape: "square" },
  { eastM: 0, northM: 0, widthM: 22, depthM: 22, heightM: 1.8, baseM: 4.2, rgb: STONE_TOP, sides: 4, shape: "square" },

  // 2. Octagonal drum — radius 14 m, so the bell stands 28 m across
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 14, heightM: 9.3, baseM: 6.0,  rgb: STONE_MID, sides: 12, shape: "round" },

  // 3. Bell-shaped anda — 3 stacked drums of decreasing radius, so the
  //    silhouette reads as a tapered bell rather than a stepped cone
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 14,   heightM: 4.7, baseM: 15.3, rgb: STONE_TOP, sides: 16, shape: "round" },
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 12.1, heightM: 7.0, baseM: 20.0, rgb: STONE_TOP, sides: 16, shape: "round" },
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 9.5,  heightM: 5.8, baseM: 27.0, rgb: STONE_TOP, sides: 16, shape: "round" },

  // 4. Harmika — square box at the top of the bell (the "shoulders")
  { eastM: 0, northM: 0, widthM: 9.3, depthM: 9.3, heightM: 3.5, baseM: 32.8, rgb: STONE_MID, sides: 4, shape: "square" },

  // 5. Yasti (conical spire) — tapering toward the finial
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 4.7, heightM: 3.5, baseM: 36.3, rgb: STONE_TOP, sides: 16, shape: "round" },
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 2.9, heightM: 4.6, baseM: 39.8, rgb: STONE_TOP, sides: 16, shape: "round" },
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 1.8, heightM: 4.6, baseM: 44.4, rgb: STONE_TOP, sides: 16, shape: "round" },
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 0.8, heightM: 3.5, baseM: 49.0, rgb: GOLD_FINIAL, sides: 16, shape: "round" },

  // 6. Finial — gilded, closing the model out at exactly 56.0 m
  { eastM: 0, northM: 0, widthM: 0, depthM: 0, radiusM: 0.6, heightM: 3.5, baseM: 52.5, rgb: GOLD_FINIAL, sides: 8, shape: "round" },
];

/** Total modelled height of the chedi, in metres. Derived from
 *  CHEDI_SEGMENTS so the segment table and this constant cannot drift.
 *  Equals 56.0 m — the nomination's "H. 28 wa" at 1 wa = 2 m. */
export const CHEDI_HEIGHT_M = CHEDI_SEGMENTS.reduce((a, s) => a + s.heightM, 0);

/** Widest modelled point, the plinth, in metres. The nomination gives
 *  "W. 14 wa" = 28 m, and the nomination states the 2:1 H:W ratio is
 *  deliberate (28 corporeality to 14 functions of consciousness). */
export const CHEDI_WIDTH_M = 28;


// ─── Surrounding halls (inside the cloister wall) ─────────────────────────

interface HallStructure {
  /** Centre offset from MAHATAT_CENTER (the chedi). */
  eastM: number;
  northM: number;
  /** Width × depth on the ground in metres. */
  widthM: number;
  depthM: number;
  /** Total height in metres. */
  heightM: number;
  /** Roof height (decorative red tier above the walls). */
  roofM: number;
  rgb: [number, number, number];
  roofRgb: [number, number, number];
  /** Cardinal direction (for label offset). */
  facing: "N" | "S" | "E" | "W";
  labelEn: string;
  labelTh: string;
}

const HALLS: HallStructure[] = [
  // Ubosot (ordination hall) — SW of the chedi, faces east toward the chedi
  {
    eastM: -45, northM: -35, widthM: 25, depthM: 18, heightM: 10, roofM: 4,
    rgb: WALL_WHITE, roofRgb: ROOF_RED, facing: "E",
    labelEn: "Ubosot", labelTh: "พระอุโบสถ",
  },
  // Wihan (assembly hall) — NE of the chedi, the larger hall
  {
    eastM: 38, northM: 32, widthM: 35, depthM: 22, heightM: 14, roofM: 5,
    rgb: WALL_WHITE, roofRgb: ROOF_RED, facing: "W",
    labelEn: "Wihan", labelTh: "พระวิหาร",
  },
  // Ho trai (scripture hall) — small, south of the chedi
  {
    eastM: 5, northM: -65, widthM: 10, depthM: 8, heightM: 6, roofM: 2,
    rgb: WALL_WHITE, roofRgb: ROOF_RED, facing: "N",
    labelEn: "Ho Trai", labelTh: "หอไตร",
  },
];

// ─── Prang (Thai corn-cob spire) — south gate, separate from main chedi ─

interface PrangTier {
  radiusM: number;
  heightM: number;
  baseM: number;
  rgb: [number, number, number];
}

const PRANG_TIERS: PrangTier[] = [
  { radiusM: 4,   heightM: 2,  baseM: 0,  rgb: STONE_LOW },
  { radiusM: 3.5, heightM: 2,  baseM: 2,  rgb: STONE_MID },
  { radiusM: 3,   heightM: 2,  baseM: 4,  rgb: STONE_TOP },
  { radiusM: 2,   heightM: 2,  baseM: 6,  rgb: STONE_TOP },
  { radiusM: 1,   heightM: 4,  baseM: 8,  rgb: STONE_TOP },
  { radiusM: 0.5, heightM: 4,  baseM: 12, rgb: GOLD_FINIAL },
];

const PRANG_CENTER_EAST_M = 80;
const PRANG_CENTER_NORTH_M = -75;

// ─── 8 satellite chedis — small stupas ringing the main chedi ───────────

interface SatelliteChedi {
  eastM: number;
  northM: number;
}

const SATELLITE_CHEDIS: SatelliteChedi[] = [
  { eastM:  30, northM: -25 },
  { eastM: -30, northM: -25 },
  { eastM:  30, northM:  25 },
  { eastM: -30, northM:  25 },
  { eastM:   0, northM: -45 },
  { eastM:   0, northM:  45 },
  { eastM: -55, northM:   0 },
  { eastM:  55, northM:   0 },
];

// ─── Layer factory ────────────────────────────────────────────────────────

/**
 * Build the deck.gl Layer[] array for the Wat Phra Mahathat 3D model.
 * Returns an empty array when `enabled` is false so the layer can be
 * conditionally rendered without rebuilding the parent array.
 *
 * @param enabled — when false, returns []
 * @param elevationScale — the buildings layer uses 1.65× so a low-rise
 *   tropical city still reads as a skyline at map zoom. The chedi does NOT
 *   take that scale. Its height is a documented figure from the UNESCO
 *   nomination (56 m), so inflating it by 1.65 would put a World Heritage
 *   monument 40% too tall — the one place on this map where matching the
 *   buildings' stylisation would mean misstating a fact. It renders at 1.0
 *   and reads at true size, which also makes the 2:1 chedi-to-plinth
 *   proportion legible against the modelled city around it.
 */
export function mahatat3DLayer(
  enabled: boolean,
  elevationScale: number = 1,
): Layer[] {
  if (!enabled) return [];

  const out: Layer[] = [];

  // ── The great chedi ────────────────────────────────────────────────────
  // One ColumnLayer per round segment, one PolygonLayer per square segment.
  // deck.gl draws them additively so the chedi reads as a stacked silhouette.
  for (const seg of CHEDI_SEGMENTS) {
    const centre = offsetM(MAHATAT_CENTER, seg.eastM, seg.northM);
    if (seg.shape === "round") {
      const r = seg.radiusM ?? 1;
      out.push(
        new ColumnLayer<{ pos: [number, number]; r: number; h: number; base: number; rgb: [number, number, number] }>({
          id: `mahatat-chedi-${seg.baseM.toFixed(0)}-${r.toFixed(1)}`,
          data: [{ pos: [centre.lng, centre.lat], r, h: seg.heightM, base: seg.baseM, rgb: seg.rgb }],
          diskResolution: seg.sides,
          getPosition: (d) => d.pos,
          getElevation: (d) => d.h * elevationScale,
          getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 235] as [number, number, number, number],
          radius: r,
          extruded: true,
          pickable: false,
          stroked: false,
          elevationScale,
        }) as Layer,
      );
    } else {
      const w = seg.widthM / 2;
      const d = seg.depthM / 2;
      const ring: [number, number][] = [
        [centre.lng - w * LNG_PER_M, centre.lat - d * LAT_PER_M],
        [centre.lng + w * LNG_PER_M, centre.lat - d * LAT_PER_M],
        [centre.lng + w * LNG_PER_M, centre.lat + d * LAT_PER_M],
        [centre.lng - w * LNG_PER_M, centre.lat + d * LAT_PER_M],
        [centre.lng - w * LNG_PER_M, centre.lat - d * LAT_PER_M],
      ];
      out.push(
        new PolygonLayer<{ ring: [number, number][]; h: number; rgb: [number, number, number] }>({
          id: `mahatat-chedi-square-${seg.baseM.toFixed(0)}`,
          data: [{ ring, h: seg.heightM, rgb: seg.rgb }],
          getPolygon: (d) => d.ring,
          getElevation: (d) => d.h * elevationScale,
          getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 235] as [number, number, number, number],
          extruded: true,
          pickable: false,
          stroked: false,
          elevationScale,
        }) as Layer,
      );
    }
  }

  // ── Halls (ubosot + wihan + ho trai) ───────────────────────────────────
  for (let i = 0; i < HALLS.length; i++) {
    const hall = HALLS[i]!;
    const centre = offsetM(MAHATAT_CENTER, hall.eastM, hall.northM);
    const w = hall.widthM / 2;
    const d = hall.depthM / 2;
    const ring: [number, number][] = [
      [centre.lng - w * LNG_PER_M, centre.lat - d * LAT_PER_M],
      [centre.lng + w * LNG_PER_M, centre.lat - d * LAT_PER_M],
      [centre.lng + w * LNG_PER_M, centre.lat + d * LAT_PER_M],
      [centre.lng - w * LNG_PER_M, centre.lat + d * LAT_PER_M],
      [centre.lng - w * LNG_PER_M, centre.lat - d * LAT_PER_M],
    ];
    // Walls
    out.push(
      new PolygonLayer<{ ring: [number, number][]; h: number; rgb: [number, number, number] }>({
        id: `mahatat-hall-${i}-walls`,
        data: [{ ring, h: hall.heightM, rgb: hall.rgb }],
        getPolygon: (d) => d.ring,
        getElevation: (d) => d.h * elevationScale,
        getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 235] as [number, number, number, number],
        extruded: true,
        pickable: false,
        stroked: false,
        elevationScale,
      }) as Layer,
    );
    // Roof — sits on top of the walls, slightly inset (red tier)
    const inset = 1.5; // metres — keeps the roof from overhanging the walls
    const rw = (hall.widthM - inset * 2) / 2;
    const rd = (hall.depthM - inset * 2) / 2;
    const roofRing: [number, number][] = [
      [centre.lng - rw * LNG_PER_M, centre.lat - rd * LAT_PER_M],
      [centre.lng + rw * LNG_PER_M, centre.lat - rd * LAT_PER_M],
      [centre.lng + rw * LNG_PER_M, centre.lat + rd * LAT_PER_M],
      [centre.lng - rw * LNG_PER_M, centre.lat + rd * LAT_PER_M],
      [centre.lng - rw * LNG_PER_M, centre.lat - rd * LAT_PER_M],
    ];
    out.push(
      new PolygonLayer<{ ring: [number, number][]; h: number; rgb: [number, number, number] }>({
        id: `mahatat-hall-${i}-roof`,
        data: [{ ring, h: hall.heightM, rgb: hall.roofRgb }],
        getPolygon: (d) => roofRing,
        getElevation: (d) => (d.h + hall.roofM) * elevationScale,
        getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 235] as [number, number, number, number],
        extruded: true,
        pickable: false,
        stroked: false,
        elevationScale,
      }) as Layer,
    );
  }

  // ── Prang (Thai corn-cob spire) — south gate ───────────────────────────
  const prangCentre = offsetM(MAHATAT_CENTER, PRANG_CENTER_EAST_M, PRANG_CENTER_NORTH_M);
  for (const tier of PRANG_TIERS) {
    out.push(
      new ColumnLayer<{ pos: [number, number]; r: number; h: number; base: number; rgb: [number, number, number] }>({
        id: `mahatat-prang-${tier.baseM.toFixed(0)}-${tier.radiusM.toFixed(1)}`,
        data: [{ pos: [prangCentre.lng, prangCentre.lat], r: tier.radiusM, h: tier.heightM, base: tier.baseM, rgb: tier.rgb }],
        diskResolution: 12,
        getPosition: (d) => d.pos,
        getElevation: (d) => d.h * elevationScale,
        getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 235] as [number, number, number, number],
        radius: tier.radiusM,
        extruded: true,
        pickable: false,
        stroked: false,
        elevationScale,
      }) as Layer,
    );
  }

  // ── Satellite chedis — small stupas around the main chedi ─────────────
  // Each satellite is a 3-tier mini-chedi (plinth + bell + spire).
  for (let i = 0; i < SATELLITE_CHEDIS.length; i++) {
    const sat = SATELLITE_CHEDIS[i]!;
    const c = offsetM(MAHATAT_CENTER, sat.eastM, sat.northM);
    const satTiers: Array<{ r: number; h: number; baseM: number; rgb: [number, number, number] }> = [
      { r: 2.5,  h: 1, baseM: 0,  rgb: STONE_LOW },
      { r: 2,    h: 1, baseM: 1,  rgb: STONE_MID },
      { r: 2,    h: 3, baseM: 2,  rgb: STONE_TOP }, // bell
      { r: 1,    h: 2, baseM: 5,  rgb: STONE_TOP }, // spire lower
      { r: 0.3,  h: 1, baseM: 7,  rgb: GOLD_FINIAL },
    ];
    for (const tier of satTiers) {
      out.push(
        new ColumnLayer<{ pos: [number, number]; r: number; h: number; baseM: number; rgb: [number, number, number] }>({
          id: `mahatat-sat-${i}-${tier.baseM.toFixed(0)}`,
          data: [{ pos: [c.lng, c.lat], r: tier.r, h: tier.h, baseM: tier.baseM, rgb: tier.rgb }],
          diskResolution: 12,
          getPosition: (d) => d.pos,
          getElevation: (d) => d.h * elevationScale,
          getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 235] as [number, number, number, number],
          radius: tier.r,
          extruded: true,
          pickable: false,
          stroked: false,
          elevationScale,
        }) as Layer,
      );
    }
  }

  return out;
}
