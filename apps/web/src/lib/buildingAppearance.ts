/** Footprint-constrained, schematic architecture. No survey detail is invented. */
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { classifyBuilding, isGroundsCompound, polygonAreaM2, type BuildingProperties } from "./building";
import { estimateBuildingHeight } from "./buildingHeights";

export type BuildingFeature = Feature<Polygon | MultiPolygon, BuildingProperties>;
export type Rgb = [number, number, number];
export const BUILDING_MATERIAL = {
  plaster: [218, 211, 194] as Rgb,
  concrete: [177, 179, 174] as Rgb,
  tile: [146, 76, 52] as Rgb,
  tileShade: [119, 62, 45] as Rgb,
  roof: [126, 133, 135] as Rgb,
};

/** Both walls and roof use this authority order; _elevM is an obsolete guess. */
export function buildingModel(feature: BuildingFeature) {
  const p = feature.properties;
  const kind = classifyBuilding(p);
  const area = polygonAreaM2(feature.geometry);
  const height = estimateBuildingHeight(area, {
    ...p,
    name: p.name ?? undefined,
    mnType: p.mnType ?? undefined,
    height: p.height ?? undefined,
    "building:levels": (p as unknown as { "building:levels"?: number })["building:levels"] ?? p.levels ?? undefined,
    building: p.building === "yes" && kind === "temple" ? "temple" : p.building,
  });
  const compound = isGroundsCompound(p, area);
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  // Infer only simple hall roofs. Courtyards, concave outlines and stupas stay
  // as mapped; a type tag alone cannot justify ornate spires or multi-tier roofs.
  const shape = (p as unknown as { "roof:shape"?: string })["roof:shape"];
  const hall = kind === "temple" && !/pagoda|chedi|เจดีย์|stupa/i.test(`${p.building} ${p.name ?? ""} ${p.nameTh ?? ""}`);
  const gables = !compound && (shape === "gabled" || (!shape && hall)) && polygons.every(poly => poly.length === 1 && isConvex(poly[0]!));
  const frames = polygons.map(poly => roofFrame(poly[0]!));
  const rise = gables ? Math.min(5, height.metres * .4, Math.max(1.2, Math.min(...frames.map(f => f.width)) * .32)) : 0;
  const total = compound ? .8 : height.metres;
  return { height, total, eaves: total - rise, rise, compound, polygons, frames, kind };
}

function isConvex(closed: Position[]): boolean {
  const ring = closed.slice(0, -1);
  if (ring.length < 3) return false;
  let direction = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!, b = ring[(i + 1) % ring.length]!, c = ring[(i + 2) % ring.length]!;
    const cross = (b[0]! - a[0]!) * (c[1]! - b[1]!) - (b[1]! - a[1]!) * (c[0]! - b[0]!);
    if (Math.abs(cross) < 1e-15) continue;
    if (direction && Math.sign(cross) !== direction) return false;
    direction = Math.sign(cross);
  }
  return direction !== 0;
}

/** Longest footprint edge sets the ridge direction in local metric space. */
function roofFrame(ring: Position[]) {
  const origin = ring[0]!;
  const mx = 111320 * Math.cos(origin[1]! * Math.PI / 180), my = 110574;
  let dx = 1, dy = 0, longest = 0;
  for (let i = 1; i < ring.length; i++) {
    const x = (ring[i]![0]! - ring[i - 1]![0]!) * mx;
    const y = (ring[i]![1]! - ring[i - 1]![1]!) * my;
    const length = Math.hypot(x, y);
    if (length > longest) { longest = length; dx = x / length; dy = y / length; }
  }
  const across = (p: Position) => -(p[0]! - origin[0]!) * mx * dy + (p[1]! - origin[1]!) * my * dx;
  const values = ring.map(across), low = Math.min(...values), high = Math.max(...values);
  return { across, center: (low + high) / 2, width: high - low };
}

function clip(ring: Position[], side: (p: Position) => number): Position[] {
  const out: Position[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!, b = ring[(i + 1) % ring.length]!, sa = side(a), sb = side(b);
    if (sa >= -1e-8) out.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      out.push([a[0]! + t * (b[0]! - a[0]!), a[1]! + t * (b[1]! - a[1]!)]);
    }
  }
  return out;
}

export type RoofFace = Feature<Polygon, { id: string; color: Rgb; roofBasis: string }>;
export function buildingRoofFaces(feature: BuildingFeature): RoofFace[] {
  const model = buildingModel(feature);
  if (model.compound) return [];
  const faces: RoofFace[] = [];
  const add = (rings: Position[][], color: Rgb, roofBasis: string) => faces.push({
    type: "Feature", properties: { id: feature.properties.id, color, roofBasis },
    geometry: { type: "Polygon", coordinates: rings },
  });
  model.polygons.forEach((poly, index) => {
    if (!model.rise) {
      add(poly.map(ring => ring.map(p => [p[0]!, p[1]!, model.total + .03])), BUILDING_MATERIAL.roof, "flat schematic cap; shape unverified");
      return;
    }
    const frame = model.frames[index]!;
    const distance = (p: Position) => frame.across(p) - frame.center;
    const z = (p: Position) => model.eaves + model.rise * Math.max(0, 1 - Math.abs(distance(p)) / (frame.width / 2));
    const outline = poly[0]!.slice(0, -1);
    for (const sign of [1, -1]) {
      const half = clip(outline, p => sign * distance(p));
      if (half.length < 3) continue;
      const top = half.map(p => [p[0]!, p[1]!, z(p)]);
      add([[...top, top[0]!]], sign > 0 ? BUILDING_MATERIAL.tile : BUILDING_MATERIAL.tileShade, "schematic gable; footprint-derived ridge, unverified roof");
      // Close the gable ends. Split at ridge intersections so no roof floats
      // over an open triangular wall; full3d tessellation handles vertical faces.
      for (let i = 0; i < half.length; i++) {
        const a = half[i]!, b = half[(i + 1) % half.length]!;
        if (Math.abs(distance(a)) < 1e-7 && Math.abs(distance(b)) < 1e-7) continue;
        if (z(a) <= model.eaves + 1e-6 && z(b) <= model.eaves + 1e-6) continue;
        const ring = [[a[0]!, a[1]!, model.eaves], [b[0]!, b[1]!, model.eaves], [b[0]!, b[1]!, z(b)], [a[0]!, a[1]!, z(a)], [a[0]!, a[1]!, model.eaves]];
        add([ring], BUILDING_MATERIAL.plaster, "schematic gable end");
      }
    }
  });
  return faces;
}
