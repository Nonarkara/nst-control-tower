/**
 * buildingHeights — an HONEST estimate of how tall a building is.
 *
 * Why this file exists (2026-09-28): the 3D view drew every building at a
 * blanket 10 m and every temple at 28 m, so the city read as a uniform
 * plateau of wrong-sized boxes. The obvious fix — "get real heights from
 * OpenStreetMap" — does not work here, and pretending otherwise would be
 * worse than the plateau. Measured, not assumed:
 *
 *   - Overpass, bbox 8.40–8.46 N / 99.94–99.99 E: 1,865 buildings carry a
 *     `building` tag. Of those, ONE has `height` and THREE have
 *     `building:levels` — 0.21% coverage. The single measured value is
 *     height=9 m on building:levels=2 (4.5 m/storey).
 *   - Microsoft GlobalMLBuildingFootprints ships ML height estimates, but its
 *     authoritative `buildings-with-height-coverage.geojson` intersects ZERO
 *     tiles of Nakhon Si Thammarat at any zoom. Thailand is absent from every
 *     height release. Not a near-miss — a structural gap.
 *   - Overture's schema has a `height` field, but it is ingested from OSM, so
 *     it inherits the same 0.2%.
 *
 * So there is no real height to fetch. The honest move is to MODEL heights
 * from what IS known — OSM typology and footprint area — and to label every
 * single building with where its number came from, so the UI can say "3
 * measured, 2,456 modelled" instead of silently asserting a height it made up.
 *
 * The ground truth we do have, measured from the project's own footprints:
 *   median footprint 343 m² (p25 155, p75 864, p95 2,888, max 180,724)
 *   → half the city is under 400 m², the modal form being the Thai
 *     shophouse row (ตึกแถว), which is 2–3 storeys.
 *
 * Constants below are chosen for a tropical low-rise Thai city, not a
 * European one. STOREY_M is 3.2 (the OSM wiki default is 3 m; the one
 * measured Thai datum implies 4.5 m — 3.2 is the deliberately conservative
 * choice, since over-inflating a cityscape flatters it and under-inflating
 * flatters nothing).
 *
 * Expected accuracy, stated plainly: ±1 storey (~3 m) for the ~75% of the
 * city that is shophouses or townhouses, which is genuinely useful. Wider
 * error on modern mid-rise, which is a small minority and is where a viewer
 * is most likely to notice. This is a defensible estimate, not a
 * measurement, and the provenance tag says so.
 */

/** Metres per storey for a tropical low-rise Thai building. */
export const STOREY_M = 3.2;

/** Fallback height for a footprint we cannot classify at all. */
export const DEFAULT_HEIGHT_M = 7;

export type HeightSource = "osm-height" | "osm-levels" | "typology" | "area-model";

export interface BuildingHeightResult {
  /** Height in metres. */
  metres: number;
  /** Where the number came from — carried to the UI so it can be honest. */
  source: HeightSource;
  /** True only for `osm-height`; the only genuinely measured value. */
  measured: boolean;
}

/**
 * OSM `building=*` → storeys, for the typologies that actually occur in this
 * file. The research found: yes ×2437, roof, industrial, temple, terrace,
 * grandstand, hospital, train_station, pagoda, mosque, retail.
 */
const TYPOLOGY_STOREYS: Record<string, number> = {
  temple: 3,
  pagoda: 2,
  mosque: 2,
  grandstand: 3,
  hospital: 5,
  industrial: 3,
  train_station: 2,
  retail: 2,
  terrace: 2,
  house: 1,
  residential: 2,
  detached: 1,
  apartments: 4,
  commercial: 3,
};

/** Building-storey bands keyed by footprint area in m². */
const AREA_BANDS: ReadonlyArray<{ maxM2: number; storeys: number }> = [
  { maxM2: 100, storeys: 1 },
  { maxM2: 400, storeys: 2 },
  { maxM2: 1000, storeys: 2.5 },
  { maxM2: 3000, storeys: 3.5 },
  { maxM2: 8000, storeys: 5 },
  { maxM2: 20000, storeys: 10 },
  { maxM2: Infinity, storeys: 15 },
];

/** Parse an OSM height string ("12", "12.5", "12 m") to metres, or null.
 *  Rejects negatives explicitly: the first version stripped non-digits with
 *  /[^\d.]/g, which turned "-4" into 4 and would have extruded a
 *  below-grade or "no data" building UPWARD by 4 m. A caught-in-the-test bug,
 *  not a hypothetical. */
export function parseOsmHeight(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && !Number.isFinite(raw)) return null;
  const str = String(raw).trim();
  if (!str) return null;
  // Strip a trailing unit ("12 m", "12m") but keep an explicit sign.
  const cleaned = str.replace(/\s*(m|เมตร|metres?)\s*$/i, "").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Deterministic ±1-storey jitter seeded on the OSM id, so rebuilds are
 *  byte-identical and a git diff shows only the buildings that really changed.
 *  Without it every shophouse in the city extrudes to exactly 6.4 m and the
 *  old town reads as a machined plateau rather than a street. */
export function storeyJitter(id: string | undefined): number {
  if (!id) return 0;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const bucket = (h >>> 0) % 3; // 0, 1, 2
  return bucket === 0 ? 0 : bucket === 1 ? 0.5 : -0.5;
}

export interface HeightProps {
  id?: string;
  building?: string;
  height?: string | number;
  "building:levels"?: string | number;
  "building:levels:aboveground"?: string | number;
  name?: string;
  mnType?: string;
  _elevM?: number;
}

/**
 * Decide how tall a building is, and say where that number came from.
 *
 * Order of authority: a real OSM `height` beats a `building:levels` count,
 * which beats a typology lookup, which beats the area model. The legacy
 * `_elevM` is consulted LAST and only as a floor for landmarks, because it is
 * a hand-baked 10/28 m guess and should never outrank anything measured.
 */
export function estimateBuildingHeight(areaM2: number, p: HeightProps): BuildingHeightResult {
  const osm = parseOsmHeight(p.height);
  if (osm != null) return { metres: round1(osm), source: "osm-height", measured: true };

  const levels = parseOsmHeight(p["building:levels"] ?? p["building:levels:aboveground"]);
  if (levels != null) {
    return { metres: round1(levels * STOREY_M), source: "osm-levels", measured: false };
  }

  const typology = TYPOLOGY_STOREYS[p.building ?? ""];
  if (typology != null) {
    return { metres: round1(typology * STOREY_M), source: "typology", measured: false };
  }

  const band = AREA_BANDS.find((b) => areaM2 < b.maxM2) ?? AREA_BANDS[AREA_BANDS.length - 1]!;
  const jittered = Math.max(1, band.storeys + storeyJitter(p.id));
  return { metres: round1(jittered * STOREY_M), source: "area-model", measured: false };
}

/** Legacy `_elevM` is a 10/28 m guess; keep it only as a minimum for named
 *  landmarks so a hand-tagged tall building never shrinks. */
export function legacyFloor(p: HeightProps): number | null {
  if (typeof p._elevM !== "number") return null;
  return p.name || p.mnType ? p._elevM : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Planar area of a GeoJSON Polygon/MultiPolygon in m².
 * Uses the shoelace formula on an equirectangular local projection, which at
 * city scale is accurate to well under a percent and needs no dependency.
 */
export function polygonAreaM2(geometry: { type: string; coordinates: unknown }): number {
  if (!geometry) return 0;
  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates as number[][][];
    return rings.length ? Math.abs(ringAreaM2(rings[0]!)) : 0;
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as number[][][][];
    let total = 0;
    for (const rings of polys) if (rings.length) total += Math.abs(ringAreaM2(rings[0]!));
    return total;
  }
  return 0;
}

function ringAreaM2(ring: number[][]): number {
  if (ring.length < 3) return 0;
  const lat0 = ring[0]![1] ?? 0;
  const mPerDegLat = 110574;
  const mPerDegLng = 111320 * Math.cos((lat0 * Math.PI) / 180);
  let sum = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % n]!;
    sum += (x1! * mPerDegLng) * (y2! * mPerDegLat) - (x2! * mPerDegLng) * (y1! * mPerDegLat);
  }
  return sum / 2;
}

/** Summarise a batch of results so the UI can state its provenance. */
export interface HeightCensus {
  total: number;
  measured: number;
  bySource: Record<HeightSource, number>;
}

export function census(results: readonly BuildingHeightResult[]): HeightCensus {
  const bySource: Record<HeightSource, number> = {
    "osm-height": 0,
    "osm-levels": 0,
    typology: 0,
    "area-model": 0,
  };
  let measured = 0;
  for (const r of results) {
    bySource[r.source]++;
    if (r.measured) measured++;
  }
  return { total: results.length, measured, bySource };
}
