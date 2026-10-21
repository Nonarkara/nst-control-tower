/**
 * Mahatat3D — parametric 3D model of Wat Phra Mahathat Voramahavihan.
 *
 * The compound sits in NST Old Town at the nomination coordinates (99.9662167°E,
 *8.411475°N). The great chedi is the defining landmark of the city and the
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

import { PolygonLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import type { Layer } from "@deck.gl/core";
import reference from "../data/mahatatReference.json";
import { BELL_PROFILE, SPIRE_PROFILE, latheMesh } from "./templeMesh";

// Official nomination:8°24′41.31″N,99°57′58.38″E. This is a site reference,
// not a surveyed mesh registration. Earlier8.4367/99.9638 was2.8km north.
export const MAHATAT_CENTER = { lng: reference.lng, lat: reference.lat };
export const CHEDI_HEIGHT_M = 56;
export const CHEDI_WIDTH_M = 28;
const LNG_PER_M = 1 / (111320 * Math.cos(MAHATAT_CENTER.lat * Math.PI / 180));
const LAT_PER_M = 1 / 110574;
const bell = latheMesh(BELL_PROFILE);
const spire = latheMesh(SPIRE_PROFILE);
const position: [number, number, number] = [MAHATAT_CENTER.lng, MAHATAT_CENTER.lat, 0];
const material = { ambient: .5, diffuse: .5, shininess: 12, specularColor: [55, 50, 40] as [number, number, number] };

/** Smooth bell, ringed gilded spire and stepped plinth on the hero map.
 * Only overall dimensions are sourced; profiles are an authored reconstruction.
 * Surrounding halls retain their traced footprints, not invented placements. */
export function mahatat3DLayer(enabled: boolean, elevationScale = 1): Layer[] {
  if (!enabled) return [];
  const steps = [
    { width: 28, base: 0, height: 2.2 },
    { width: 25, base: 2.2, height: 2 },
    { width: 22, base: 4.2, height: 1.8 },
    { width: 5.6, base: 32.8, height: 3.5 },
  ].map((step, i) => {
    const x = step.width / 2 * LNG_PER_M, y = step.width / 2 * LAT_PER_M;
    const ring = [[position[0] - x, position[1] - y], [position[0] + x, position[1] - y], [position[0] + x, position[1] + y], [position[0] - x, position[1] + y], [position[0] - x, position[1] - y]].map(p => [p[0]!, p[1]!, step.base * elevationScale]);
    return new PolygonLayer({ id: `mahatat-chedi-plinth-${i}`, data: [ring],
      getPolygon: (p: number[][]) => p, getElevation: step.height, elevationScale,
      getFillColor: [224, 221, 210, 255], material, extruded: true, stroked: false, pickable: false });
  });
  return [...steps,
    new SimpleMeshLayer({ id: "mahatat-chedi-bell", data: [position], mesh: bell,
      getPosition: (p: [number, number, number]) => p, getColor: [235, 233, 223, 255],
      getScale: [1, 1, elevationScale], material, pickable: false }),
    new SimpleMeshLayer({ id: "mahatat-chedi-spire", data: [position], mesh: spire,
      getPosition: (p: [number, number, number]) => p, getColor: [207, 163, 65, 255],
      getScale: [1, 1, elevationScale], material: { ...material, shininess: 30 }, pickable: false }),
  ];
}
