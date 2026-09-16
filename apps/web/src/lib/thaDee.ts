/**
 * thaDee — the REAL คลองท่าดี channel as map geometry, plus the "trunk" river
 * subset that is legible at province/city zoom.
 *
 * Why a curated way list: OSM does not name the Tha Dee in this extract (only
 * แม่น้ำตาปี and แม่น้ำปากพนัง carry names), so name-matching finds nothing and
 * the cascade used to be drawn as straight lines between four zone centroids
 * — which reads as random geometry on the map. These way ids were derived
 * offline by intersecting the waterways with the curated Tha Dee corridor
 * buffer (public/geo/nst/river-buffer.geojson) and checking proximity to the
 * known gauge / level-post sites along the channel:
 *
 *   way/145173662  Khao Luang headwaters (284 → 48 m)          → Khiri Wong
 *   way/498037276  Khiri Wong → บ้านวังไทร X.200 (20 m) → ท่าใหญ่ post
 *                  (260 m) → บ้านนาป่า X.203 (230 m) — 33 km, 48 → 11 m
 *   way/145173591, way/1323449708, way/766416823, way/1323449707,
 *   way/559706713  the distribution canals into the city (11 → 5 m), ending
 *                  ~0.8 km from the Old Town axis (คลองนครน้อย / ท่าวัง reach)
 *
 * Re-derive with the same recipe if waterways.geojson is regenerated.
 */

import type { Feature, FeatureCollection, LineString, MultiLineString } from "geojson";

export type WaterwayFeature = Feature<
  LineString | MultiLineString,
  { id?: string; waterway?: string; name?: string | null; flowClass?: string; lengthM?: number }
>;

/** In flow order, upstream → city. */
export const THA_DEE_WAY_CHAIN: readonly string[] = [
  "way/145173662",
  "way/498037276",
  "way/145173591",
  "way/1323449708",
  "way/766416823",
  "way/1323449707",
  "way/559706713",
];

export const THA_DEE_WAY_IDS: ReadonlySet<string> = new Set(THA_DEE_WAY_CHAIN);

/** Rivers long enough to matter at overview zoom. Below this the network is
 *  hundreds of sub-catchment stubs that only make sense at street scale.
 *  Province scale is stricter than city scale: at zoom ~8 the 127 fast
 *  mountain reaches on the Khao Luang massif fuse into a white tangle. */
const TRUNK_MIN_LENGTH_M: Record<0 | 1, number> = { 0: 20000, 1: 8000 };

function lineCoords(f: WaterwayFeature): [number, number][] {
  const g = f.geometry;
  if (g.type === "LineString") return g.coordinates.map((p) => [p[0], p[1]] as [number, number]);
  return g.coordinates.flatMap((part) => part.map((p) => [p[0], p[1]] as [number, number]));
}

function dist2(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/**
 * Stitch the chain into one polyline, upstream → city. Each way is oriented
 * so it continues from the previous way's end (the enrichment script orients
 * most ways downhill, but the flat city canals are `downhillConfident: false`
 * and can point either way). Missing ways are skipped, so a partial
 * waterways load still yields a usable (shorter) path; returns [] if fewer
 * than two ways are present.
 */
export function stitchThaDeePath(
  waterways: FeatureCollection<LineString | MultiLineString, WaterwayFeature["properties"]> | null | undefined,
): [number, number][] {
  if (!waterways) return [];
  const byId = new Map<string, WaterwayFeature>();
  for (const f of waterways.features as WaterwayFeature[]) {
    if (f.properties?.id) byId.set(f.properties.id, f);
  }
  const segments: [number, number][][] = [];
  for (const id of THA_DEE_WAY_CHAIN) {
    const f = byId.get(id);
    if (!f) continue;
    const c = lineCoords(f);
    if (c.length >= 2) segments.push(c);
  }
  if (segments.length < 2) return segments[0] ?? [];

  const out: [number, number][] = [];
  // Orient the first segment toward the second; every later segment toward
  // the previous end.
  const first = segments[0]!;
  const second = segments[1]!;
  const secondNear = (p: [number, number]) => Math.min(dist2(p, second[0]!), dist2(p, second[second.length - 1]!));
  const firstOriented = secondNear(first[first.length - 1]!) <= secondNear(first[0]!) ? first : [...first].reverse();
  out.push(...firstOriented);
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]!;
    const prevEnd = out[out.length - 1]!;
    const oriented = dist2(seg[0]!, prevEnd) <= dist2(seg[seg.length - 1]!, prevEnd) ? seg : [...seg].reverse();
    // Drop the duplicate join vertex when the ways share a node exactly.
    const start = dist2(oriented[0]!, prevEnd) === 0 ? 1 : 0;
    for (let k = start; k < oriented.length; k++) out.push(oriented[k]!);
  }
  return out;
}

/**
 * The subset of waterways worth drawing with direction cues at overview zoom:
 * the Tha Dee itself, anything with a name (แม่น้ำตาปี, แม่น้ำปากพนัง …), and
 * the long rivers/canals. City scale (bucket 1) also admits the fast-class
 * reaches; province scale (bucket 0) keeps only the long trunks so the map
 * reads "here are the rivers", not a drainage-density plot.
 */
export function isTrunkWaterway(f: WaterwayFeature, zoomBucket: 0 | 1 = 1): boolean {
  const p = f.properties ?? {};
  if (p.id && THA_DEE_WAY_IDS.has(p.id)) return true;
  if (p.name && String(p.name).trim().length > 0) return true;
  if (zoomBucket === 1 && p.flowClass === "fast") return true;
  return (p.lengthM ?? 0) >= TRUNK_MIN_LENGTH_M[zoomBucket] && (p.waterway === "river" || p.waterway === "canal");
}
