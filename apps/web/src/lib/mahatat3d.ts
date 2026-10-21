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
 * The cloister wall used to be claimed here as coming from buildings.geojson —
 * a hand-authored `hand/mahatat-cloister` polygon extruded to 12 m. That
 * polygon has been REMOVED: it was a five-point axis-aligned rectangle
 * 452 m × 401 m, i.e. a bounding box drawn around the temple rather than a
 * traced wall, and it rendered as an 18-hectare plate lying across the streets
 * of the old town. The surrounding halls above are modelled here, not mapped;
 * the 156 real traced temple footprints in buildings.geojson carry the real
 * ones. See lib/buildingFootprints.test.ts, which pins both facts.
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

const STONE_TOP: [number, number, number] = [236, 233, 223]; // pale gold-cream
const STONE_MID: [number, number, number] = [220, 218, 208]; // mid stone-gold
const STONE_LOW: [number, number, number] = [197, 196, 187]; // shaded base stone

// Roof / finial gold (slightly brighter — reads as the gilded top)
const GOLD_FINIAL: [number, number, number] = [255, 218, 130];

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


/** Only the dimensioned central chedi is modelled. Surrounding halls use
 * traced OSM footprints; no invented compound layout is drawn. */
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
          getPosition: (d) => [d.pos[0], d.pos[1], d.base * elevationScale],
          getElevation: (d) => d.h,
          getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 255] as [number, number, number, number],
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
          getPolygon: (d) => d.ring.map(p => [p[0], p[1], seg.baseM * elevationScale]),
          getElevation: (d) => d.h,
          getFillColor: (d) => [d.rgb[0], d.rgb[1], d.rgb[2], 255] as [number, number, number, number],
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
