/**
 * Pure building classification helpers — extracted from layers.ts for unit testing.
 *
 * classifyBuilding() drives the color of every building in the 3D cityscape.
 * Getting it wrong silently shows the wrong color for hospitals, temples, etc.
 * and misleads operators who use the building colors for spatial awareness.
 *
 * hexToRgb() converts CSS hex colors to RGB tuples for deck.gl layers.
 * heightColor() maps building height to a height-ramp color for unlabeled buildings.
 */

/**
 * Convert a CSS hex color string (with or without `#`) to an RGB tuple.
 * Returns [200, 200, 200] (neutral grey) for invalid inputs.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [200, 200, 200];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Map a building height (metres) to a deck.gl RGB fill color.
 *
 * The height ramp communicates urban density at a glance in 3D view:
 *   ≥50 m  → sky-300   (high-rise, light blue)
 *   ≥30 m  → sky-400   (mid-high)
 *   ≥20 m  → sky-500   (mid-rise)
 *   ≥12 m  → blue-500  (3–4 floors)
 *   ≥7  m  → indigo    (2 floors)
 *   <7  m  → warm clay (1 floor / unknown)
 */
export function heightColor(h: number): [number, number, number] {
  if (h >= 50) return [125, 211, 252]; // sky-300  — high-rise
  if (h >= 30) return [ 56, 189, 248]; // sky-400  — mid-high
  if (h >= 20) return [ 14, 165, 233]; // sky-500  — mid-rise
  if (h >= 12) return [ 59, 130, 246]; // blue-500 — 3–4 floors
  if (h >=  7) return [ 99, 102, 241]; // indigo   — 2 floors
  return             [148,  103,  89]; // warm clay — 1 floor / unknown
}

export interface BuildingProperties {
  id: string;
  name: string | null;
  nameEn: string | null;
  nameTh: string | null;
  building: string;
  levels: number | null;
  height: number | null;
  operator: string | null;
  amenity?: string | null;
  tourism?: string | null;
  religion?: string | null;
  "building:use"?: string | null;
  office?: string | null;
  healthcare?: string | null;
  shop?: string | null;
  source?: string | null;
  // Municipal override — a type assigned per-building via the data/twin layer.
  // When set to a valid LandmarkKind it wins over any OSM-derived classification,
  // so curated data colours the building instead of its raw OSM tags.
  mnType?: string | null;
}

export type LandmarkKind =
  | "residential"
  | "commercial" | "industrial"
  | "office"
  | "hotel" | "temple" | "church" | "mosque"
  | "government" | "police" | "fire" | "hospital" | "clinic"
  | "school" | "university" | "power" | "tall"
  | "ms-generic"
  | null;

// Every valid LandmarkKind, used to validate a municipal `mnType` override.
const KNOWN_KINDS = new Set<string>([
  "residential", "commercial", "industrial", "office",
  "hotel", "temple", "church", "mosque",
  "government", "police", "fire", "hospital", "clinic",
  "school", "university", "power", "tall", "ms-generic",
]);

/**
 * Approximate geodesic area of a Polygon/MultiPolygon in m² (equirectangular
 * projection around the ring centroid — within ~1% at NST's latitude).
 * Returns 0 for anything malformed. Used to spot temple compounds / grounds
 * mapped as a single giant "building" (Wat Mahathat's wall: ~182,000 m²).
 */
export function polygonAreaM2(geom: { type: string; coordinates: unknown }): number {
  try {
    // Each polygon = [outer, ...holes]. Area = |outer| − Σ|holes| (a courtyard
    // or atrium is not footprint).
    const polys: number[][][][] =
      geom.type === "Polygon"
        ? [geom.coordinates as number[][][]]
        : geom.type === "MultiPolygon"
          ? (geom.coordinates as number[][][][])
          : [];
    if (polys.length === 0) return 0;
    const ring0 = polys[0]![0]!;
    let latSum = 0;
    for (const pt of ring0) latSum += pt[1]!;
    const cosLat = Math.cos((latSum / Math.max(1, ring0.length) * Math.PI) / 180);
    const ringArea = (ring: number[][]): number => {
      let s = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i]!;
        const b = ring[i + 1]!;
        s += a[0]! * b[1]! - b[0]! * a[1]!;
      }
      return Math.abs(s) / 2;
    };
    let areaDeg2 = 0;
    for (const poly of polys) {
      const [outer, ...holes] = poly;
      if (!outer) continue;
      areaDeg2 += Math.max(0, ringArea(outer) - holes.reduce((sum, h) => sum + ringArea(h), 0));
    }
    // degrees² → m² (111.32 km per degree longitude × cos(lat), 110.54 km latitude).
    return areaDeg2 * 111_320 * cosLat * 110_540;
  } catch {
    return 0;
  }
}

/** Above this footprint a sacred-tagged polygon is grounds, not a building. */
export const COMPOUND_AREA_M2 = 6_000;

/**
 * Name fallback for grounds tagged only building=yes. Thai has no word
 * boundaries, and plain "วัด" (temple) is also the tail of "จังหวัด"
 * (province): the first version of this rule flattened the Provincial Hall
 * (ศาลากลางจังหวัด) to 0.8 m. So: "วัด" only when NOT preceded by "จังห", and
 * "กำแพง" only in its wall-of-a-compound forms (it is also a tambon name).
 */
export const COMPOUND_NAME_RE = /กำแพงแก้ว|กำแพงวัด|(?<!จังห)วัด|compound|grounds|monastery/i;

const COMPOUND_BUILDING_TAGS = new Set([
  "temple", "church", "cathedral", "chapel", "mosque", "religious", "shrine",
]);

/**
 * True when a footprint is temple/church/mosque GROUNDS (walls, cloisters,
 * whole compounds) rather than a building. Extruding those swallows streets —
 * Wat Mahathat's กำแพงแก้ว rendered as a 182,000 m² solid block. Compounds
 * render flat (0.8 m) with no roof crown; the actual shrines inside keep
 * their heights because they are separate, smaller footprints.
 */
export function isGroundsCompound(props: BuildingProperties, areaM2: number): boolean {
  if (!(areaM2 > COMPOUND_AREA_M2)) return false;
  const kind = classifyBuilding(props);
  if (kind === "temple" || kind === "church" || kind === "mosque") return true;
  const b = (props.building ?? "").toLowerCase();
  if (COMPOUND_BUILDING_TAGS.has(b)) return true;
  // Anything already classified as something specific (government, school,
  // hospital, mall, industrial…) is a real building, whatever its name says.
  if (kind) return false;
  const nm = `${props.name ?? ""} ${props.nameTh ?? ""} ${props.nameEn ?? ""}`;
  return COMPOUND_NAME_RE.test(nm);
}

/**
 * Parse a finite positive number from a value that may be a number, numeric
 * string (possibly with unit suffixes like "3m"), or anything else.
 * Returns null for zero, negative, Infinity, NaN, and non-parseable values.
 */
export function finitePositive(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

/**
 * Estimate building height in metres from OSM properties.
 *
 * Priority: explicit `height` → `levels` × 4.2m/floor → landmark minimums.
 */
export function buildingHeightMeters(props: BuildingProperties): number {
  const raw = props as BuildingProperties & {
    "building:levels"?: number | string | null;
    height?: number | string | null;
  };
  const height = finitePositive(raw.height);
  if (height) return Math.max(height, 8);

  const levels = finitePositive(props.levels) ?? finitePositive(raw["building:levels"]);
  if (levels) return Math.max(levels * 4.2, 10);

  const kind = classifyBuilding(props);
  if (kind === "temple")     return 28;
  if (kind === "church")     return 20;
  if (kind === "mosque")     return 22;
  if (kind === "hospital")   return 18;
  if (kind === "government") return 15;
  if (kind === "university") return 15;
  if (kind === "hotel")      return 20;
  return 10;
}

/**
 * Classify a building into a landmark category from its OSM tags.
 *
 * Priority order (highest specificity first):
 *   amenity / healthcare / tourism tags → building tag → name keywords → height.
 * Returns null for unclassified ordinary buildings.
 */
export function classifyBuilding(props: BuildingProperties): LandmarkKind {
  // Municipal override wins: a curated per-building type set via the data layer
  // colours the building regardless of its raw OSM tags.
  const mn = (props.mnType ?? "").toLowerCase();
  if (mn && KNOWN_KINDS.has(mn)) return mn as LandmarkKind;

  const a  = (props.amenity    ?? "").toLowerCase();
  const t  = (props.tourism    ?? "").toLowerCase();
  const b  = (props.building   ?? "").toLowerCase();
  const r  = (props.religion   ?? "").toLowerCase();
  const op = (props.operator   ?? "").toLowerCase();
  const hc = (props.healthcare ?? "").toLowerCase();
  const of = (props.office     ?? "").toLowerCase();
  const nm = ((props.name ?? "") + " " + (props.nameEn ?? "") + " " + (props.nameTh ?? "")).toLowerCase();
  const src = (props.source ?? "").toLowerCase();

  if (a === "hospital"  || hc === "hospital") return "hospital";
  if (a === "clinic"    || hc === "clinic" || hc === "doctor") return "clinic";
  if (a === "police")   return "police";
  if (a === "fire_station") return "fire";
  if (a === "school" || a === "kindergarten") return "school";
  if (a === "university" || a === "college") return "university";
  if (a === "place_of_worship") {
    if (r === "christian") return "church";
    if (r === "muslim")    return "mosque";
    return "temple";
  }
  // OSM `building=temple/mosque/church/religious` — applied to sub-structures
  // inside the temple complex (ubosot, wihan, chedi base, monk quarters) that
  // OSM mappers tag with the building kind rather than `amenity=place_of_worship`.
  // Without this branch every cloister wall + auxiliary hall renders as the
  // neutral UNTYPED grey — the temple complex reads as a flat slab instead of
  // a gold cluster, and Mahatat (which has ~60 such sub-buildings) loses its
  // shape entirely.
  if (b === "temple") return "temple";
  if (b === "mosque") return "mosque";
  if (b === "church" || b === "cathedral" || b === "chapel") return "church";
  if (b === "religious") return r === "muslim" ? "mosque" : r === "christian" ? "church" : "temple";
  if (a === "townhall" || of === "government" || a === "courthouse") return "government";
  if (t === "hotel" || b === "hotel") return "hotel";
  if (op.includes("egat") || op.includes("pea ") || op.includes("การไฟฟ้า")) return "power";
  if (nm.includes("egat") || nm.includes("การไฟฟ้า")) return "power";
  if (nm.includes("hotel") || nm.includes("โรงแรม")) return "hotel";
  if (nm.includes("โรงพยาบาล") || nm.includes("hospital")) return "hospital";
  // Thai schools are very often named after a temple ("โรงเรียนวัด…"): decide
  // school BEFORE the temple-by-name fallback below.
  if (b === "school" || nm.includes("โรงเรียน")) return "school";
  // "วัด" also ends "จังหวัด" (province) — Thai has no word boundaries.
  if (/(?<!จังห)วัด/.test(nm) || nm.includes("temple") || nm.includes("wat ")) return "temple";
  if (nm.includes("สถานีตำรวจ") || nm.includes("police")) return "police";

  const directHeight = finitePositive(props.height) ?? (finitePositive(props.levels) ? finitePositive(props.levels)! * 4.2 : 0);
  if (directHeight >= 50) return "tall";

  if (
    b === "commercial" || b === "retail" || b === "shop" || b === "supermarket" ||
    b === "mall" || b === "kiosk" ||
    a === "marketplace" || a === "supermarket" || a === "fuel" ||
    a === "restaurant" || a === "cafe" || a === "fast_food" || a === "bar" || a === "food_court" ||
    (props.shop as string | undefined)
  ) return "commercial";

  if (
    b === "industrial" || b === "warehouse" || b === "factory" ||
    b === "storage_tank" || b === "storage"
  ) return "industrial";

  if (b === "office" || of === "company" || of === "ngo" || a === "bank" || a === "post_office")
    return "office";

  if (
    b === "house" || b === "detached" || b === "semidetached_house" ||
    b === "terrace" || b === "row_house" || b === "bungalow" ||
    b === "apartments" || b === "residential" || b === "dormitory" ||
    b === "hut" || b === "cabin"
  ) return "residential";

  if (src === "ms-footprints") return "ms-generic";

  return null;
}
