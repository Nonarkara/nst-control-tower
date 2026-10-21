/** Authored Wat Mahathat chedi reconstruction: 56m high, 28m plinth from
 * the official nomination. Its map anchor follows the round OSM footprint,
 * checked against aerial imagery; the nomination coordinate is a site reference,
 * not the chedi center or a surveyed mesh registration. Surrounding halls use
 * traced footprints and separately reviewed roofs, never invented compound boxes. */

import { PolygonLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import type { Layer } from "@deck.gl/core";
import reference from "../data/mahatatReference.json";
import { BELL_PROFILE, SPIRE_PROFILE, latheMesh } from "./templeMesh";

// Approximate aerial/OSM registration; source and site reference in the JSON.
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
