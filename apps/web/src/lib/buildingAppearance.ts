/** Footprint-constrained, schematic architecture. No survey detail is invented. */
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { classifyBuilding, isGroundsCompound, polygonAreaM2, type BuildingProperties } from "./building";
import { roofObservation, type RoofShape } from "./roofEvidence";
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
  const observation = roofObservation(p.id);
  const compound = isGroundsCompound(p, area) || !!observation?.openAir;
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  // A POI/category does not establish the roof on each building in a precinct.
  const tagged = p["roof:shape"];
  const mappedShape: RoofShape = tagged === "gabled" || tagged === "hipped" || tagged === "flat" ? tagged : "unknown";
  const observedShape = observation && observation.shape !== "unknown" ? observation.shape : mappedShape;
  const simple = polygons.every(poly => poly.length === 1 && isConvex(poly[0]!));
  const stupa = /pagoda|chedi|เจดีย์|stupa/i.test(`${p.building} ${p.name ?? ""} ${p.nameTh ?? ""}`);
  const shape: RoofShape = !compound && !stupa && simple ? observedShape : observedShape === "flat" ? "flat" : "unknown";
  const frames = polygons.map(poly => roofFrame(poly[0]!));
  const rise = shape !== "flat" && shape !== "unknown" ? Math.min(5, height.metres * .4, Math.max(1.2, Math.min(...frames.map(f => f.width)) * .32)) : 0;
  const total = observation?.openAir ? 0 : compound ? .8 : height.metres;
  return { height, total, eaves: total - rise, rise, compound, polygons, frames, kind, shape, observation };
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
  const along = (p: Position) => (p[0]! - origin[0]!) * mx * dx + (p[1]! - origin[1]!) * my * dy;
  const values = ring.map(across), low = Math.min(...values), high = Math.max(...values);
  const alongValues = ring.map(along), start = Math.min(...alongValues), end = Math.max(...alongValues);
  return { across, along, low, high, start, end, center: (low + high) / 2, width: high - low };
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
  const observedColor = model.observation?.color;
  const roofColor: Rgb = observedColor?.length === 3 ? [observedColor[0]!, observedColor[1]!, observedColor[2]!] : BUILDING_MATERIAL.tile;
  const shade: Rgb = roofColor.map(c => Math.round(c * .82)) as Rgb;
  const add = (rings: Position[][], color: Rgb, roofBasis: string) => faces.push({
    type: "Feature", properties: { id: feature.properties.id, color, roofBasis },
    geometry: { type: "Polygon", coordinates: rings },
  });
  const basis = model.shape === "unknown" ? "neutral schematic cap; roof shape unverified or geometry unresolved"
    : model.observation?.shape !== "unknown" && model.observation
    ? `aerial-reviewed ${model.shape}; Esri World Imagery; capture date unknown; schematic dimensions`
    : `mapped roof:shape=${model.shape}; schematic dimensions`;
  model.polygons.forEach((poly, index) => {
    if (!model.rise) {
      add(poly.map(ring => ring.map(p => [p[0]!, p[1]!, model.total + .03])), BUILDING_MATERIAL.roof, basis);
      return;
    }
    const frame = model.frames[index]!, halfWidth = frame.width / 2;
    const planes = [
      (p: Position) => (frame.high - frame.across(p)) / halfWidth,
      (p: Position) => (frame.across(p) - frame.low) / halfWidth,
      ...(model.shape === "gabled" ? [] : [
        (p: Position) => (frame.along(p) - frame.start) / halfWidth,
        (p: Position) => (frame.end - frame.along(p)) / halfWidth,
      ]),
    ];
    // Two observed eave bands, with a small closed fascia step. Heights are
    // schematic; there are no invented finials, gilded ornaments or overhangs.
    const bands = model.shape === "temple-tiered"
      ? [{ lo: 0, hi: .48, z0: 0, z1: .28 }, { lo: .48, hi: 1, z0: .33, z1: 1 }]
      : [{ lo: 0, hi: 1, z0: 0, z1: 1 }];
    const outline = poly[0]!.slice(0, -1);
    const onOutline = (a: Position, b: Position) => outline.some((v, i) => {
      const w = outline[(i + 1) % outline.length]!;
      const dx = w[0]! - v[0]!, dy = w[1]! - v[1]!;
      const len2 = dx * dx + dy * dy;
      const on = (p: Position) => {
        const x = p[0]! - v[0]!, y = p[1]! - v[1]!;
        const t = (x * dx + y * dy) / len2;
        return Math.abs(x * dy - y * dx) < 1e-12 && t >= -1e-6 && t <= 1 + 1e-6;
      };
      return len2 > 0 && on(a) && on(b);
    });
    planes.forEach((q, planeIndex) => {
      let region = outline;
      for (const other of planes) if (other !== q) region = clip(region, p => other(p) - q(p));
      region = clip(region, p => 1 - q(p));
      for (const band of bands) {
        const part = clip(clip(region, p => q(p) - band.lo), p => band.hi - q(p));
        if (part.length < 3) continue;
        const z = (p: Position) => model.eaves + model.rise * (band.z0 + (band.z1 - band.z0) * (q(p) - band.lo) / (band.hi - band.lo));
        const top = part.map(p => [p[0]!, p[1]!, z(p)]);
        add([[...top, top[0]!]], planeIndex % 2 ? shade : roofColor, `${basis}; footprint-derived ridge`);
        for (let i = 0; i < part.length; i++) {
          const a = part[i]!, b = part[(i + 1) % part.length]!;
          let bottom: number | null = null;
          if (onOutline(a, b)) bottom = model.eaves;
          else if (band.lo > 0 && Math.abs(q(a) - band.lo) < 1e-6 && Math.abs(q(b) - band.lo) < 1e-6) bottom = model.eaves + model.rise * .28;
          if (bottom == null || (Math.abs(z(a) - bottom) < 1e-6 && Math.abs(z(b) - bottom) < 1e-6)) continue;
          add([[[a[0]!, a[1]!, bottom], [b[0]!, b[1]!, bottom], [b[0]!, b[1]!, z(b)], [a[0]!, a[1]!, z(a)], [a[0]!, a[1]!, bottom]]], onOutline(a, b) ? BUILDING_MATERIAL.plaster : shade, `${basis}; roof edge closure`);
        }
      }
    });
  });
  return faces;
}
