/** Orthographic imagery projected onto schematic roofs, not photogrammetry.
 * Tile boundaries clip triangles, preserving courtyards and footprint edges.
 */
import earcut from "earcut";
import type { Position } from "geojson";
import { buildingRoofFaces, type BuildingFeature } from "./buildingAppearance";

export type RoofTileBounds = [west: number, south: number, east: number, north: number];
type Triangle = [Position, Position, Position];
const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));

function clip3d(ring: Position[], signed: (p: Position) => number): Position[] {
  const out: Position[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!, b = ring[(i + 1) % ring.length]!;
    const sa = signed(a), sb = signed(b);
    if (sa >= 0) out.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      out.push(a.map((v, axis) => v + t * (b[axis]! - v)));
    }
  }
  return out;
}

export function roofTriangles(feature: BuildingFeature): Triangle[] {
  return buildingRoofFaces(feature).flatMap(face => {
    // Vertical gable ends keep the masonry material; aerial pixels cannot
    // describe a facade. Triangulate the horizontal footprint including holes.
    const rings = face.geometry.coordinates.map(r => r.slice(0, -1));
    const points = rings.flat();
    if (points.length < 3) return [];
    const holes: number[] = [];
    let n = rings[0]!.length;
    for (const ring of rings.slice(1)) { holes.push(n); n += ring.length; }
    const indices = earcut(points.flatMap(p => [p[0]!, p[1]!]), holes, 2);
    const triangles: Triangle[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const tri = indices.slice(i, i + 3).map(index => points[index]!) as Triangle;
      const [a, b, c] = tri;
      const area = Math.abs((b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!));
      if (area > 1e-15) triangles.push(tri);
    }
    return triangles;
  });
}

/** A coarse lookup makes tile work proportional to nearby roofs, not the city. */
export function indexAerialRoofs(features: BuildingFeature[]) {
  const step = .005;
  const bins = new Map<string, Set<BuildingFeature>>();
  const triangles = new WeakMap<BuildingFeature, Triangle[]>();
  for (const f of features) {
    const points = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).flat(2);
    if (!points.length) continue;
    const xs = points.map(p => p[0]!), ys = points.map(p => p[1]!);
    for (let x = Math.floor(Math.min(...xs) / step); x <= Math.floor(Math.max(...xs) / step); x++) {
      for (let y = Math.floor(Math.min(...ys) / step); y <= Math.floor(Math.max(...ys) / step); y++) {
        const key = `${x}/${y}`;
        if (!bins.has(key)) bins.set(key, new Set());
        bins.get(key)!.add(f);
      }
    }
  }
  return (bounds: RoofTileBounds) => {
    const [w, s, e, n] = bounds;
    const candidates = new Set<BuildingFeature>();
    for (let x = Math.floor(w / step); x <= Math.floor(e / step); x++)
      for (let y = Math.floor(s / step); y <= Math.floor(n / step); y++)
        for (const f of bins.get(`${x}/${y}`) ?? []) candidates.add(f);
    const longitude = (w + e) / 2, latitude = (s + n) / 2;
    const mx = 111320 * Math.cos(latitude * Math.PI / 180), my = 110574;
    const positions: number[] = [], texCoords: number[] = [], normals: number[] = [];
    for (const f of candidates) {
      if (!triangles.has(f)) triangles.set(f, roofTriangles(f));
      for (const tri of triangles.get(f)!) {
        let clipped: Position[] = tri;
        for (const side of [(p: Position) => p[0]! - w, (p: Position) => e - p[0]!, (p: Position) => p[1]! - s, (p: Position) => n - p[1]!]) clipped = clip3d(clipped, side);
        for (let i = 1; i + 1 < clipped.length; i++) {
          for (const p of [clipped[0]!, clipped[i]!, clipped[i + 1]!]) {
            positions.push((p[0]! - longitude) * mx, (p[1]! - latitude) * my, (p[2] ?? 0) + .04);
            texCoords.push((p[0]! - w) / (e - w), (mercatorY(n) - mercatorY(p[1]!)) / (mercatorY(n) - mercatorY(s)));
            normals.push(0, 0, 1);
          }
        }
      }
    }
    return { origin: [longitude, latitude, 0] as [number, number, number], mesh: {
      attributes: {
        POSITION: { value: new Float32Array(positions), size: 3 },
        NORMAL: { value: new Float32Array(normals), size: 3 },
        TEXCOORD_0: { value: new Float32Array(texCoords), size: 2 },
      },
    } };
  };
}
