import { GeoJsonLayer, GridCellLayer, IconLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import { judgeGauge } from "../lib/levelWatch";
import type { Layer } from "@deck.gl/core";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import type { Feature, FeatureCollection, Polygon, MultiPolygon, LineString, Point } from "geojson";
import type {
  IncidentFeature,
  CampusZoneFeature,
  CampusZoneCollection,
  AirQualityPoint,
  IsochroneResult,
  ConflictIncident,
  FloodGauge,
  DamStatus,
  ProvinceWatchScore,
  SouthernRiverReach,
  FloodWatchBand,
  RiverDischargeBand,
  WaterGauge,
  RainfallStation,
  EwsStation,
  GistdaLevelPost,
  GistdaFloodExtentTambon,
} from "@nst/shared";
import type { HeatPoint } from "../sim/trafficSim";
import {
  classifyBuilding,
  buildingHeightMeters,
  finitePositive,
  hexToRgb,
  type BuildingProperties,
  type LandmarkKind,
} from "../lib/building";
import { ZONE_STATUS_RGB, ZONE_STATUS_LABEL, isThaDeeZone, leadTimeToCity, worstStatus, CELERITY_MIN_MS, type ZoneSummary } from "../lib/watershed";
import type { BasinWaterBalance } from "@nst/shared";
import { STATUS, statusRgba, type StatusLevel } from "../lib/status";

export type CctvCategory = "traffic" | "school" | "safety" | "water" | "other";
export type CctvStatus = "online" | "offline" | "unknown";

/** Mirrors apps/api adapters/cctv.ts CctvCamera. */
export interface CctvCamera {
  id: string;
  sourceId?: string;
  name: string;
  lat: number;
  lng: number;
  vendor: string;
  category?: CctvCategory;
  status?: CctvStatus;
  imageUrl?: string;
  hlsUrl?: string;
  embedUrl?: string;
  embedHdUrl?: string;
  organization?: string;
}

/** Okabe–Ito hues (colour-vision-deficiency safe) — one per camera purpose. */
export const CCTV_CATEGORY_RGB: Record<CctvCategory, [number, number, number]> = {
  traffic: [230, 159, 0],
  school: [240, 228, 66],
  safety: [204, 121, 167],
  water: [86, 180, 233],
  other: [200, 196, 184],
};
// ─── Map colour system (MoMA rules) ─────────────────────────────────────────
// Only three kinds of colour are drawn on the map:
//  1. STATUS (lib/status.ts) — every severity scale is mapped explicitly onto
//     its five levels via statusRgbMap(); no layer invents a status colour.
//  2. CAT — Okabe–Ito categorical hues (mirror tokens.css --cat-*), safe for
//     colour-vision deficiency. When a palette has more categories than hues,
//     related categories share a hue family at distinct lightness steps
//     (tint/shade) — never the same RGB.
//  3. Neutral greys + ink for context (roads, outlines, grids, labels).
// Continuous ramps are monotonic in luminance so they read in greyscale.
type RGB = [number, number, number];
type RGBA = [number, number, number, number];

const CAT: Record<"orange" | "sky" | "green" | "yellow" | "blue" | "vermil" | "pink", RGB> = {
  orange: [230, 159, 0],
  sky: [86, 180, 233],
  green: [0, 158, 115],
  yellow: [240, 228, 66],
  blue: [0, 114, 178],
  vermil: [213, 94, 0],
  pink: [204, 121, 167],
};
/** Category palette, exported for legends (MapLegend) so keys match the map. */
export const MAP_CAT = CAT;

/** Mix toward white: t = 0 → the colour, t = 1 → white. */
function tint(c: readonly number[], t: number): RGB {
  return [0, 1, 2].map((i) => Math.round(c[i] + (255 - c[i]) * t)) as RGB;
}
/** Mix toward black: t = 0 → the colour, t = 1 → black. */
function shade(c: readonly number[], t: number): RGB {
  return [0, 1, 2].map((i) => Math.round(c[i] * (1 - t))) as RGB;
}
function grey(v: number): RGB {
  return [v, v, v];
}
function withAlpha(c: readonly number[], a: number): RGBA {
  return [c[0], c[1], c[2], a];
}
/** Domain scale → StatusLevel map, resolved to STATUS map colours. */
function statusRgbMap<K extends string | number>(levels: Record<K, StatusLevel>): Record<K, RGB> {
  const out = {} as Record<K, RGB>;
  for (const k of Object.keys(levels) as K[]) out[k] = STATUS[levels[k]].rgb;
  return out;
}

/** Map ink — tokens.css --paper / --ink — for outlines, label grounds and text. */
const INK_DARK: RGB = [14, 14, 14];
const INK_LIGHT: RGB = [244, 244, 244];
/** One type family on the map, same as the interface. */
const MAP_FONT = "'Libre Franklin Variable', 'IBM Plex Sans Thai', system-ui, sans-serif";
/** "Beyond critical" (PM2.5 hazardous > 150): the critical hue, darkened — still
 *  reads as critical, and darker keeps intensity ramps monotonic in luminance. */
const CRITICAL_DEEP: RGB = shade(STATUS.critical.rgb, 0.4);
/** Pale end of intensity ramps (luminance above STATUS.watch, so
 *  pale → watch → warning → critical → deep only ever gets darker). */
const RAMP_PALE_WATER: RGB = tint(CAT.sky, 0.6);
const RAMP_PALE_GOOD: RGB = tint(STATUS.normal.rgb, 0.6);

export interface ShuttleVehicle {
  id: string;
  line: string;
  lat: number;
  lng: number;
  bearing?: number;
  occupancy?: string;
}

export interface RouteProps { route: string; color: string; label: string }
export interface StopProps { id: string; name: string; lines: string[] }
export interface StationProps { id: string; name: string; system: "BTS" | "MRT"; line: string; code: string }
export interface TransitLineProps { id: string; system: "BTS" | "MRT" | "ART"; line: string; color: string; ref: string }
export interface GateProps { id: string; kind: "gate" | "lift-gate" | "entrance"; name: string | null; nameTh: string | null; named: boolean }
export interface ClassifiedRoadProps { name: string | null; nameEn: string | null; nameTh: string | null; highway: string; priority: number; oneway: boolean }
export interface NeighborhoodBuildingProps { id: string; name: string | null; nameEn: string | null; height: number; levels: number | null; building: string }

const ZONE_COLORS: Record<string, [number, number, number]> = {
  academic: CAT.sky,
  residential: CAT.pink,
  athletic: CAT.orange,
  park: CAT.green,
  commercial: CAT.blue,
  service: grey(130),
  perimeter: grey(220),
};

export function campusBoundaryLayer(
  collection: CampusZoneCollection,
  options: { extruded?: boolean; filled?: boolean; stroked?: boolean } = {},
) {
  return new GeoJsonLayer({
    id: "campus-boundary",
    data: collection as unknown as FeatureCollection,
    stroked: options.stroked ?? true,
    filled: options.filled ?? true,
    pickable: true,
    extruded: options.extruded ?? false,
    getFillColor: ((f: CampusZoneFeature) => {
      const z = ZONE_COLORS[f.properties.zoneType] ?? [120, 120, 120];
      return [z[0], z[1], z[2], 38] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineColor: ((f: CampusZoneFeature) => {
      const z = ZONE_COLORS[f.properties.zoneType] ?? [200, 200, 200];
      return [z[0], z[1], z[2], 200] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineWidth: 1.5,
    lineWidthMinPixels: 1,
    getElevation: ((f: CampusZoneFeature) => f.properties.height ?? 0) as unknown as number,
  });
}

export function trafficHeatmapLayer(data: HeatPoint[]) {
  return new HeatmapLayer<HeatPoint>({
    id: "traffic-heatmap",
    data,
    getPosition: (d) => d.position,
    getWeight: (d) => d.weight,
    radiusPixels: 38,
    intensity: 1.2,
    threshold: 0.04,
    aggregation: "SUM",
    colorRange: [
      // Congestion → watch → warning → critical: luminance only ever falls.
      statusRgba("watch", 0),
      statusRgba("watch", 120),
      statusRgba("warning", 180),
      statusRgba("critical", 215),
      statusRgba("critical", 240),
      withAlpha(CRITICAL_DEEP, 255),
    ],
  });
}

/**
 * Mobile-safe substitute for trafficHeatmapLayer. deck.gl's HeatmapLayer
 * renders its KDE through float textures whose shaders fail to compile on a
 * range of Android GPU drivers (observed in production: fragment shader
 * "traffic-heatmap-weights-transform" rejected on an ESSL 3.10 translation).
 * When App.tsx detects a device without reliable float-target support — or
 * catches a live shader error via Deck's onError — it renders this instead:
 * plain weighted dots on the same samples, same warm palette. Lower-fi, but
 * compiles everywhere a WebGL2 map can run at all.
 */
export function trafficDensityFallbackLayer(data: HeatPoint[]) {
  return new ScatterplotLayer<HeatPoint>({
    id: "traffic-heatmap", // same id — swaps in-place for the heatmap
    data,
    getPosition: (d) => d.position,
    getRadius: (d) => 30 + d.weight * 90,
    radiusMinPixels: 2,
    radiusMaxPixels: 14,
    getFillColor: (d) => {
      const w = d.weight;
      if (w >= 0.75) return statusRgba("critical", 180);
      if (w >= 0.5) return statusRgba("warning", 150);
      if (w >= 0.25) return statusRgba("watch", 120);
      return statusRgba("watch", 70);
    },
    stroked: false,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });
}

const INCIDENT_COLORS: Record<IncidentFeature["category"], [number, number, number]> = {
  "traffic-accident": CAT.vermil,
  "traffic-congestion": CAT.orange,
  construction: CAT.yellow,
  flooding: CAT.sky,
  waste: shade(CAT.orange, 0.35),
  lighting: tint(CAT.yellow, 0.5),
  sidewalk: CAT.pink,
  drainage: CAT.blue,
  trees: CAT.green,
  other: grey(150),
};

export function incidentLayer(id: string, data: IncidentFeature[]) {
  return new ScatterplotLayer<IncidentFeature>({
    id,
    data,
    getPosition: (d) => [d.lng, d.lat],
    getFillColor: (d) => {
      const c = INCIDENT_COLORS[d.category] ?? [200, 200, 200];
      return [...c, d.status === "resolved" ? 90 : 220] as [number, number, number, number];
    },
    getRadius: (d) => (d.severity === "high" ? 26 : d.severity === "medium" ? 18 : 12),
    radiusMinPixels: 4,
    radiusMaxPixels: 22,
    stroked: true,
    getLineColor: [14, 14, 14, 230],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

export function shuttleRoutesLayer(collection: FeatureCollection<LineString, RouteProps>) {
  return new GeoJsonLayer({
    id: "cu-shuttle-routes",
    data: collection as unknown as FeatureCollection,
    stroked: true,
    filled: false,
    pickable: true,
    getLineColor: ((f: Feature<LineString, RouteProps>) => {
      const c = hexToRgb(f.properties.color);
      return [c[0], c[1], c[2], 220] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineWidth: 3,
    lineWidthMinPixels: 2,
    lineWidthMaxPixels: 5,
  });
}

/**
 * Render a single CU shuttle route (one line of the 5). Per-line toggles let
 * the user isolate a route to read it; the colour comes from the route's own
 * `color` property (color-codes municipal land zones).
 */
export function shuttleRouteLineLayer(
  routeId: string,
  collection: FeatureCollection<LineString, RouteProps>,
) {
  const feature = collection.features.find((f) => f.properties.route === routeId);
  if (!feature) return null;
  const rgb = hexToRgb(feature.properties.color);
  return new GeoJsonLayer({
    id: `cu-shuttle-line-${routeId}`,
    data: { type: "FeatureCollection", features: [feature] } as unknown as FeatureCollection,
    stroked: true,
    filled: false,
    pickable: true,
    getLineColor: [rgb[0], rgb[1], rgb[2], 230],
    getLineWidth: 4,
    lineWidthMinPixels: 3,
    lineWidthMaxPixels: 6,
  });
}

export function shuttleStopsLayer(collection: FeatureCollection<Point, StopProps>) {
  return new ScatterplotLayer({
    id: "cu-shuttle-stops",
    data: collection.features,
    getPosition: ((f: Feature<Point, StopProps>) => f.geometry.coordinates) as unknown as [number, number],
    getRadius: 18,
    radiusMinPixels: 3,
    radiusMaxPixels: 7,
    getFillColor: withAlpha(CAT.yellow, 230),
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

export function shuttleVehiclesLayer(vehicles: ShuttleVehicle[]) {
  return new ScatterplotLayer<ShuttleVehicle>({
    id: "cu-shuttle-vehicles",
    data: vehicles,
    getPosition: (v) => [v.lng, v.lat],
    getRadius: 38,
    radiusMinPixels: 6,
    radiusMaxPixels: 12,
    getFillColor: withAlpha(CAT.sky, 240),
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 2,
    pickable: true,
  });
}

export function transitStationsLayer(collection: FeatureCollection<Point, StationProps>) {
  return new ScatterplotLayer({
    id: "transit-stations",
    data: collection.features,
    getPosition: ((f: Feature<Point, StationProps>) => f.geometry.coordinates) as unknown as [number, number],
    getRadius: 32,
    radiusMinPixels: 5,
    radiusMaxPixels: 10,
    getFillColor: ((f: Feature<Point, StationProps>) =>
      f.properties.system === "BTS"
        ? withAlpha(CAT.sky, 240)
        : withAlpha(CAT.blue, 240)) as unknown as [number, number, number, number],
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

export interface CuLandProperties {
  id: string;
  name: { en: string; th: string; zh: string };
  kind: "commercial" | "mixed-use" | "athletic" | "park" | "residential" | "healthcare" | "cultural" | "education";
  operator: string;
  color: string;
  describe: string;
}

export function cuLandsLayer(collection: FeatureCollection<Polygon | MultiPolygon, CuLandProperties>) {
  return new GeoJsonLayer({
    id: "cu-lands",
    data: collection as unknown as FeatureCollection,
    stroked: true,
    filled: true,
    pickable: true,
    getFillColor: ((f: Feature<Polygon | MultiPolygon, CuLandProperties>) => {
      const c = hexToRgb(f.properties.color);
      return [c[0], c[1], c[2], 70] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineColor: ((f: Feature<Polygon | MultiPolygon, CuLandProperties>) => {
      const c = hexToRgb(f.properties.color);
      return [c[0], c[1], c[2], 230] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineWidth: 1.5,
    lineWidthMinPixels: 1.5,
    extruded: false,
  });
}

// ─── Campus building footprints (real OSM data) ──────────────────────────
// BuildingProperties, LandmarkKind, classifyBuilding, buildingHeightMeters,
// and finitePositive are imported from ../lib/building (pure, unit-tested).
export type { BuildingProperties, LandmarkKind };

// Landmark fill colours — one decision per category, legible in dark 3D.
// Reading guide: red=health, gold=culture, cyan=civic, violet=education,
//                amber=commerce, steel=industry, teal=office, sand=fabric.
// Building types → Okabe–Ito hue families (distinct RGB per type):
//   orange = commerce + housing · vermillion = health + fire · yellow = worship
//   blue/sky = civic, police, skyline · green = work + infrastructure · pink = education
export const LANDMARK_COLOR: Record<NonNullable<LandmarkKind>, [number, number, number]> = {
  "ms-generic":  shade(CAT.orange, 0.55),  // background residential fabric (20K buildings)
  residential:   shade(CAT.orange, 0.3),  // OSM-tagged houses / apartments
  commercial:    CAT.orange,  // shops, retail, markets, F&B
  industrial:    shade(CAT.green, 0.35),  // warehouses, factories
  office:        CAT.green,  // offices, banks, post offices
  hotel:         tint(CAT.orange, 0.45),  // tourism anchor
  temple:        CAT.yellow,  // cultural backbone
  church:        tint(CAT.yellow, 0.5),  // Christian worship
  mosque:        shade(CAT.yellow, 0.3),  // Islamic worship
  government:    CAT.blue,  // city hall + public institutions
  police:        CAT.sky,  // safety infrastructure
  fire:          shade(CAT.vermil, 0.3),  // emergency response
  hospital:      CAT.vermil,  // health anchor
  clinic:        tint(CAT.vermil, 0.4),  // clinics / doctors
  school:        CAT.pink,  // education
  university:    tint(CAT.pink, 0.4),
  power:         tint(CAT.green, 0.45),  // EGAT / PEA infrastructure
  tall:          tint(CAT.sky, 0.5),  // skyline height marker
};

// Neutral grey for buildings with no known type (OSM `building=yes`, unclassified).
// Keeping these muted lets the genuinely-typed buildings carry the colour signal —
// the map now reads by TYPE, not by height.
export const UNTYPED_COLOR: [number, number, number] = grey(110);

// On-map legend — the canonical band → colour key, consumed by <BuildingLegend>.
// Representative bands (some fine OSM categories collapse into one row); order is
// the display order.
export const BUILDING_LEGEND: { label: string; color: [number, number, number] }[] = [
  { label: "Residential", color: LANDMARK_COLOR.residential },
  { label: "Commercial",  color: LANDMARK_COLOR.commercial },
  { label: "Office",      color: LANDMARK_COLOR.office },
  { label: "Industrial",  color: LANDMARK_COLOR.industrial },
  { label: "Government",  color: LANDMARK_COLOR.government },
  { label: "Police",      color: LANDMARK_COLOR.police },
  { label: "Fire",        color: LANDMARK_COLOR.fire },
  { label: "Hospital",    color: LANDMARK_COLOR.hospital },
  { label: "School",      color: LANDMARK_COLOR.school },
  { label: "Temple",      color: LANDMARK_COLOR.temple },
  { label: "Mosque",      color: LANDMARK_COLOR.mosque },
  { label: "Hotel",       color: LANDMARK_COLOR.hotel },
  { label: "Unclassified", color: UNTYPED_COLOR },
];

/**
 * Render every municipality building as a filled, tappable 3D box.
 *
 * 2D: hairline footprints — landmarks warmer, ordinary buildings dim.
 * 3D: extruded to real height. Landmarks get their category colour at full
 *     vibrancy regardless of height. Ordinary buildings stay on the blue
 *     height-ramp (sky-300 → sky-700). The result: the mayor can read the
 *     urban topology — the gold temple cluster, amber hotel strip, red
 *     hospital district — all visible in a single 3D view.
 * 3DS: ghosted for the substructure (utilities) cutaway view.
 */
export function buildingsLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, BuildingProperties>,
  options: {
    extruded?: boolean;
    ghosted?: boolean;
    zoomBucket?: 0 | 1 | 2;
    /** When extruded, enable Phong lighting (slower but more "showcase"). */
    material?: "flat" | "phong";
  } = {},
) {
  const extruded = options.extruded ?? false;
  const ghosted  = options.ghosted  ?? false;
  const zoomBucket = options.zoomBucket ?? 2;
  const materialKind = options.material ?? "flat";
  const lineA = ghosted ? 110 : 220;

  // ── LOD: drop the ordinary buildings at province scale (default zoom 8.4) ──
  // At bucket 0 the camera is showing the whole NST province. Individual
  // buildings are 1-2 px dots and indistinguishable from one another — drawing
  // all 2,457 of them is pure waste. We keep only the landmarks (mnType set,
  // ~200 of them) plus buildings that carry a name. Below city scale (bucket 1)
  // we keep all but drop pickable — pickable is per-pixel-per-frame work and
  // not useful when the user is panning around the whole city. At street
  // scale (bucket 2) everything is on.
  //
  // The province-scale floor was 20m (mid-rise+ only). Lifted to 12m so the
  // 2-3 story Old Town fabric survives the zoom-out — without that you only
  // see the tall landmarks and the city reads as "landmarks floating on a
  // flat green plain" instead of a real Old Town.
  const features = collection.features;
  const filtered =
    zoomBucket === 0
      ? features.filter((f) => {
          const p = f.properties as BuildingProperties & { _elevM?: number };
          if (p.mnType) return true;
          if (p.name) return true;
          if (typeof p._elevM === "number" && p._elevM >= 12) return true;
          if (classifyBuilding(p)) return true; // classified residential/retail/etc still reads as fabric at province scale
          return false;
        })
      : extruded
      ? capUntaggedFor3D(features)
      : features;
  const pickable = zoomBucket === 2 && !ghosted;
  const filteredCollection: FeatureCollection<Polygon | MultiPolygon, BuildingProperties> = {
    type: "FeatureCollection",
    features: filtered,
  };

  // Pre-compute the kind + base color per feature once at layer creation.
  // Before this, classifyBuilding() was called from getFillColor, getLineColor,
  // AND getLineWidth on every frame — that's ~15 string comparisons × 2,457
  // buildings × 60 fps ≈ 2.2 M classifications/sec. Caching here cuts the
  // accessors to a single property read.
  const _kindCache: WeakMap<typeof filtered[number], { kind: ReturnType<typeof classifyBuilding>; base: readonly [number, number, number] }> = new WeakMap();
  for (const f of filtered) {
    const kind = classifyBuilding(f.properties);
    const base = kind ? LANDMARK_COLOR[kind] : UNTYPED_COLOR;
    _kindCache.set(f, { kind, base: base as readonly [number, number, number] });
  }

  return new GeoJsonLayer({
    id: "municipality-buildings",
    data: filteredCollection as unknown as FeatureCollection,
    // Source GeoJSON is already valid (single FeatureCollection with proper
    // geometry); skipping normalization saves a full pass over 20k+ features
    // every time the layer instance is created.
    _normalize: false,
    // Stroke is a full second draw pass over 20k+ polygons. In extruded (3D) mode
    // the lighting already provides depth cues, so we skip the edge pass entirely.
    // In flat 2D mode we keep it — edges are the only way to distinguish footprints.
    stroked: !extruded,
    filled: true,
    pickable,
    autoHighlight: false,
    extruded,
    elevationScale: extruded && !ghosted ? 1.65 : 1,
    material: extruded && !ghosted && materialKind === "phong"
      ? { ambient: 0.72, diffuse: 0.82, shininess: 24, specularColor: [255, 245, 220] }
      : false,
    getFillColor: ((f: Feature<Polygon | MultiPolygon, BuildingProperties>) => {
      const cached = _kindCache.get(f as typeof filtered[number]);
      const base = cached ? cached.base : UNTYPED_COLOR as unknown as readonly [number, number, number];
      const hasKind = cached ? !!cached.kind : false;
      if (ghosted) {
        return [base[0], base[1], base[2], 32] as [number, number, number, number];
      }
      if (extruded) {
        // Anonymous footprints in 3D used to fill at 210/255 — present, but
        // 10,000+ adjacent blocks at the same alpha blended into a flat
        // mid-grey wash that read as "background" rather than "city fabric".
        // Lifted to 235 so the residential block pattern stays visible as
        // *texture* under the landmarks. Landmarks (hasKind) hold at 230
        // because they're already saturated by their category hue.
        return [base[0], base[1], base[2], hasKind ? 230 : 235] as [number, number, number, number];
      }
      // Anonymous footprints (no OSM type, no name — ~14k of ~21k buildings,
      // packed wall-to-wall in old-town blocks) previously filled at 70/255.
      // Individually that reads as a faint wash, but thousands of adjacent
      // polygons at the same alpha compound visually into a solid slab
      // covering whole blocks — worse against the dark basemap, where the
      // mid-grey composite sits well above the background. Fill them at
      // near-zero so the block reads as street pattern, not a grey mass;
      // named/classified buildings (the informative ones) keep full fill.
      return [base[0], base[1], base[2], hasKind ? 130 : 22] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineColor: ((f: Feature<Polygon | MultiPolygon, BuildingProperties>) => {
      const cached = _kindCache.get(f as typeof filtered[number]);
      if (cached?.kind) {
        const c = cached.base;
        return [c[0], c[1], c[2], lineA] as [number, number, number, number];
      }
      if (f.properties.name) return withAlpha(grey(200), lineA) as [number, number, number, number];
      // Fully anonymous buildings (no kind, no name) previously got a
      // near-black outline (INK_DARK) at the same ~86% opacity as every
      // other footprint. Same compounding problem as the fill above: at
      // street scale, thousands of near-black edges sharing walls in a
      // dense block fuse into a solid dark rectangle — the artifact this
      // fixes. These footprints carry no information (see capUntaggedFor3D
      // above), so a faint outline is enough to keep the street pattern
      // legible without dominating the block.
      return withAlpha(grey(150), Math.round(lineA * 0.3)) as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineWidth: ((f: Feature<Polygon | MultiPolygon, BuildingProperties>) =>
      _kindCache.get(f as typeof filtered[number])?.kind ? 1.2 : 0.6) as unknown as number,
    lineWidthMinPixels: extruded && !ghosted ? 0.7 : 0.5,
    // Prefer the pre-baked `_elevM` from the data file (one tuple-deref per
    // feature per frame) over calling `buildingHeightMeters` (which is a JS
    // function call that does ~15 string comparisons per call). Falls back to
    // the function for older data files that haven't been re-slimmed yet.
    getElevation: ((f: Feature<Polygon | MultiPolygon, BuildingProperties>) => {
      const e = (f.properties as BuildingProperties & { _elevM?: number })._elevM;
      return typeof e === "number" ? e : buildingHeightMeters(f.properties);
    }) as unknown as number,
    opacity: ghosted ? 0.35 : 1,
    updateTriggers: {
      getFillColor: [extruded, ghosted, zoomBucket, materialKind],
      getLineColor: [ghosted, zoomBucket],
      getElevation: [extruded, ghosted, zoomBucket],
    },
  });
}

/**
 * LIGHTWEIGHTNESS — keep most of the 1-2 storey untagged fabric in 3D mode.
 * The breakdown is roughly:
 *   - ~250 landmarks (mnType) + 50 super-tall (≥20 m)        — always kept
 *   - ~1,500 named (street-color outline)                    — always kept
 *   - ~5,400 short-tagged (`building=residential`/`house`)  — always kept
 *   - ~13,800 "OSM building=yes" untagged low-rise          — kept at 70%
 *
 * The original 30% cap made the 3D map look like "landmarks floating on a
 * flat plain" — the residential fabric dropped out, the city felt empty.
 * Lifted to 70% so a 5-year-old can still trace the block pattern under
 * the landmarks. Kept in 2D so BuildingSearch can still find every one.
 */
export function capUntaggedFor3D(
  features: Feature<Polygon | MultiPolygon, BuildingProperties>[],
): Feature<Polygon | MultiPolygon, BuildingProperties>[] {
  const keep: typeof features = [];
  const maybeDrop: typeof features = [];
  for (const f of features) {
    const p = f.properties as BuildingProperties & { _elevM?: number };
    const isLandmark = !!p.mnType;
    const isNamed = !!p.name;
    const isTall = typeof p._elevM === "number" && p._elevM >= 20;
    const isClassified = !!classifyBuilding(p);
    if (isLandmark || isNamed || isTall || isClassified) keep.push(f);
    else maybeDrop.push(f);
  }
  maybeDrop.sort((a, b) => {
    const ai = String((a.properties as { id?: string }).id ?? "");
    const bi = String((b.properties as { id?: string }).id ?? "");
    return ai.localeCompare(bi);
  });
  const cap = Math.floor(maybeDrop.length * 0.7);
  const survivors = maybeDrop.slice(0, cap);
  return [...keep, ...survivors];
}

/**
 * Roof cap layer — renders a thin shimmering slab on top of each extruded
 * building so the tops read as "rooftops" rather than flat cut-offs.
 *
 * Heritage types (temple / church / mosque / government) receive:
 *  • A significantly taller cap (+12 m for sacred buildings, +4 m for civic)
 *    — this makes their silhouettes read as "pointed / crowned" in the 3D
 *    skyline, suggesting the chedi/prang/bell-tower that would sit above the
 *    main structure.  True pitched-roof geometry would need ScenegraphLayer
 *    + custom GLTF, which is a larger effort.
 *  • A much brighter, more saturated colour so the gold temple cluster and
 *    the sky-blue civic strip are immediately readable from above.
 *
 * Ordinary buildings get a +0.5 m cap in their height-ramp colour.
 */
export function buildingRoofsLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, BuildingProperties>,
  options: { maxRoofs?: number; elevationScale?: number } = {},
) {
  const maxRoofs = options.maxRoofs ?? 1400;
  const scale = options.elevationScale ?? 1.65;

  // Use the pre-baked `_elevM` for the sort — avoids a JS function call per
  // pair comparison (2,457 buildings → ~3 M comparisons in the worst case).
  const elev = (p: BuildingProperties) =>
    (p as BuildingProperties & { _elevM?: number })._elevM ?? buildingHeightMeters(p);
  const sorted = [...collection.features]
    .sort((a, b) => elev(b.properties) - elev(a.properties))
    .slice(0, maxRoofs);

  const roofCollection: FeatureCollection = { type: "FeatureCollection", features: sorted };

  // Heritage roof colours — bright, pure, recognisable at distance
  // Declared BEFORE the cache loop because the cache reads from it.
  const HERITAGE_ROOF: Partial<Record<NonNullable<LandmarkKind>, [number, number, number, number]>> = {
    // Brighter tints of each type's LANDMARK_COLOR — same hue, reads as a crown.
    temple:     withAlpha(tint(LANDMARK_COLOR.temple, 0.2), 240),
    church:     withAlpha(tint(LANDMARK_COLOR.church, 0.2), 220),
    mosque:     withAlpha(tint(LANDMARK_COLOR.mosque, 0.2), 220),
    government: withAlpha(tint(LANDMARK_COLOR.government, 0.2), 220),
    police:     withAlpha(tint(LANDMARK_COLOR.police, 0.2), 210),
    fire:       withAlpha(tint(LANDMARK_COLOR.fire, 0.2), 220),
    hospital:   withAlpha(tint(LANDMARK_COLOR.hospital, 0.2), 220),
    hotel:      withAlpha(tint(LANDMARK_COLOR.hotel, 0.2), 210),
  };

  // Per-building roof elevation bonus (meters, before elevationScale is applied)
  function roofBonus(props: BuildingProperties): number {
    const kind = classifyBuilding(props);
    if (kind === "temple" || kind === "church" || kind === "mosque") return 12; // spire crown
    if (kind === "government" || kind === "police" || kind === "fire")  return  5; // civic parapet
    if (kind === "hotel" || kind === "hospital")                        return  3; // landmark cap
    return 0.5;
  }

  // Pre-compute per-feature: kind + heritage colour + roof bonus.
  // Without this cache the accessors below call classifyBuilding() on every
  // frame for every rendered roof (~1,400 features).
  const _roofCache: WeakMap<typeof collection.features[number], { kind: ReturnType<typeof classifyBuilding>; heritage: [number, number, number, number] | undefined; bonus: number }> = new WeakMap();
  for (const f of sorted) {
    const kind = classifyBuilding(f.properties);
    _roofCache.set(f, {
      kind,
      heritage: kind ? HERITAGE_ROOF[kind] : undefined,
      bonus: roofBonus(f.properties),
    });
  }

  return new GeoJsonLayer({
    id: "building-roofs",
    data: roofCollection,
    // Source GeoJSON is already valid — skip normalization.
    _normalize: false,
    stroked: false,
    filled: true,
    pickable: false,
    extruded: true,
    elevationScale: scale,
    material: { ambient: 0.90, diffuse: 0.75, shininess: 28, specularColor: [255, 252, 230] },
    getFillColor: ((f: Feature<Polygon | MultiPolygon, BuildingProperties>) => {
      const cached = _roofCache.get(f as typeof collection.features[number]);
      if (cached?.heritage) return cached.heritage;
      const kind = cached?.kind;
      const base = kind ? LANDMARK_COLOR[kind] : UNTYPED_COLOR;
      return [Math.min(base[0] + 30, 255), Math.min(base[1] + 30, 255), Math.min(base[2] + 30, 255), 200] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getElevation: ((f: Feature<Polygon | MultiPolygon, BuildingProperties>) => {
      const cached = _roofCache.get(f as typeof collection.features[number]);
      const e = (f.properties as BuildingProperties & { _elevM?: number })._elevM
        ?? buildingHeightMeters(f.properties);
      return e + (cached?.bonus ?? 0.5);
    }) as unknown as number,
    opacity: 0.92,
    // Without updateTriggers, deck.gl falls back to conservative heuristics and
    // re-runs the elevation/color accessors every time the layer is instantiated.
    // The accessors are pure functions of feature properties + scale, so we tag
    // the only inputs that actually change.
    updateTriggers: {
      getElevation: [scale],
    },
  });
}

// ─── Underground / substructure PathLayer factories ─────────────────────
// Re-render utility line geometry at a negative z so we can see the
// network "buried" beneath the ghosted buildings. Depths are typical Bangkok
// burial: electricity ~2 m, water ~3 m, drainage ~4 m.

function lineFeaturesAt(
  collection: FeatureCollection,
  depthMeters: number,
): Array<{ path: [number, number, number][]; properties: Record<string, unknown> }> {
  const out: Array<{ path: [number, number, number][]; properties: Record<string, unknown> }> = [];
  for (const f of collection.features) {
    if (f.geometry.type !== "LineString") continue;
    const coords = (f.geometry.coordinates as [number, number][]).map(
      (c) => [c[0], c[1], -depthMeters] as [number, number, number],
    );
    out.push({ path: coords, properties: (f.properties ?? {}) as Record<string, unknown> });
  }
  return out;
}

export function electricityPathLayer(collection: FeatureCollection) {
  const paths = lineFeaturesAt(collection, 2);
  return [
    new PathLayer({
      id: "cu-electricity-paths-3ds",
      data: paths,
      getPath: (d) => d.path,
      getColor: (d) =>
        (d.properties as ElectricityProps).kind === "hv-backbone"
          ? withAlpha(CAT.orange, 255)
          : withAlpha(tint(CAT.orange, 0.45), 230),
      getWidth: (d) => ((d.properties as ElectricityProps).kind === "hv-backbone" ? 14 : 8),
      widthUnits: "pixels",
      widthMinPixels: 4,
      pickable: true,
    }),
    new TextLayer({
      id: "cu-electricity-labels-3ds",
      data: paths.filter((d) => ((d.properties as unknown as ElectricityProps).kind === "hv-backbone" || (d.properties as unknown as ElectricityProps).name)),
      getPosition: (d) => {
        const mid = Math.floor(d.path.length / 2);
        return d.path[mid];
      },
      getText: (d) => (d.properties as unknown as ElectricityProps).name || "",
      getSize: 14,
      getColor: withAlpha(CAT.orange, 240),
      getAngle: 0,
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      billboard: true,
      fontFamily: MAP_FONT,
      fontWeight: 600,
      parameters: { depthTest: false },
      pickable: false,
    }),
  ];
}

export function waterPathLayer(collection: FeatureCollection) {
  const paths = lineFeaturesAt(collection, 3);
  return [
    new PathLayer({
      id: "cu-water-paths-3ds",
      data: paths,
      getPath: (d) => d.path,
      getColor: (d) =>
        (d.properties as WaterProps).kind === "main"
          ? withAlpha(CAT.sky, 250)
          : withAlpha(tint(CAT.sky, 0.45), 220),
      getWidth: (d) => ((d.properties as WaterProps).kind === "main" ? 12 : 7),
      widthUnits: "pixels",
      widthMinPixels: 4,
      pickable: true,
    }),
    new TextLayer({
      id: "cu-water-labels-3ds",
      data: paths.filter((d) => ((d.properties as unknown as WaterProps).kind === "main" || (d.properties as unknown as WaterProps).name)),
      getPosition: (d) => {
        const mid = Math.floor(d.path.length / 2);
        return d.path[mid];
      },
      getText: (d) => {
        const p = d.properties as unknown as WaterProps;
        const parts: string[] = [];
        if (p.name) parts.push(p.name);
        if (p.diameter) parts.push(`Ø${p.diameter}`);
        return parts.join(" ");
      },
      getSize: 13,
      getColor: withAlpha(CAT.sky, 235),
      getAngle: 0,
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      billboard: true,
      fontFamily: MAP_FONT,
      fontWeight: 600,
      parameters: { depthTest: false },
      pickable: false,
    }),
  ];
}

export function drainagePathLayer(collection: FeatureCollection) {
  const paths = lineFeaturesAt(collection, 4);
  return [
    new PathLayer({
      id: "cu-drainage-paths-3ds",
      data: paths,
      getPath: (d) => d.path,
      getColor: (d) =>
        (d.properties as DrainageProps).kind === "main"
          ? withAlpha(CAT.green, 250)
          : withAlpha(tint(CAT.green, 0.45), 220),
      getWidth: (d) => ((d.properties as DrainageProps).kind === "main" ? 14 : 8),
      widthUnits: "pixels",
      widthMinPixels: 4,
      pickable: true,
    }),
    new TextLayer({
      id: "cu-drainage-labels-3ds",
      data: paths.filter((d) => ((d.properties as unknown as DrainageProps).kind === "main" || (d.properties as unknown as DrainageProps).name)),
      getPosition: (d) => {
        const mid = Math.floor(d.path.length / 2);
        return d.path[mid];
      },
      getText: (d) => {
        const p = d.properties as unknown as DrainageProps;
        const parts: string[] = [];
        if (p.name) parts.push(p.name);
        if (p.diameter) parts.push(`Ø${p.diameter}`);
        if (p.capacityM3) parts.push(`${p.capacityM3}m³`);
        return parts.join(" ");
      },
      getSize: 13,
      getColor: withAlpha(CAT.green, 235),
      getAngle: 0,
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      billboard: true,
      fontFamily: MAP_FONT,
      fontWeight: 600,
      parameters: { depthTest: false },
      pickable: false,
    }),
  ];
}

export interface BmaPoi {
  id: string;
  kind:
    | "hospital"
    | "health-center"
    | "school"
    | "fire-station"
    | "police-station"
    | "park"
    | "market"
    | "bma-office"
    | "flood-gate"
    | "pump-station"
    | "cctv"
    | "bus-stop"
    | "other";
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

const POI_COLORS: Record<BmaPoi["kind"], [number, number, number]> = {
  hospital:        CAT.vermil,
  "health-center": tint(CAT.vermil, 0.4),
  school:          CAT.pink,
  "fire-station":  shade(CAT.vermil, 0.3),
  "police-station":CAT.sky,
  park:            CAT.green,
  market:          CAT.orange,
  "bma-office":    CAT.blue,
  "flood-gate":    shade(CAT.sky, 0.3),
  "pump-station":  tint(CAT.sky, 0.5),
  cctv:            grey(220),
  "bus-stop":      tint(CAT.pink, 0.4),
  other:           grey(150),
};

export function bmaPoiLayer(pois: BmaPoi[]) {
  return new ScatterplotLayer<BmaPoi>({
    id: "bma-pois",
    data: pois,
    getPosition: (p) => [p.lng, p.lat],
    getRadius: (p) => (p.kind === "hospital" ? 28 : p.kind === "fire-station" || p.kind === "police-station" ? 22 : 14),
    radiusMinPixels: 4,
    radiusMaxPixels: 10,
    getFillColor: (p) => {
      const c = POI_COLORS[p.kind] ?? [200, 200, 200];
      return [c[0], c[1], c[2], 230] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

export function bmaParksLayer(collection: FeatureCollection<Polygon | MultiPolygon, { PARK_NAME_T?: string }>) {
  return new GeoJsonLayer({
    id: "bma-parks",
    data: collection as unknown as FeatureCollection,
    stroked: true,
    filled: true,
    pickable: true,
    getFillColor: withAlpha(CAT.green, 50),
    getLineColor: withAlpha(CAT.green, 200),
    getLineWidth: 0.8,
    lineWidthMinPixels: 0.5,
  });
}

export interface AqStation {
  id: string;
  name: string;
  address: string;
  pm25: number | null;
  pm10: number | null;
  lat: number;
  lng: number;
}

// PM2.5 (µg/m³) → StatusLevel: ≤12 good = normal · ≤35 moderate = watch ·
// ≤55 unhealthy for sensitive groups = warning · ≤150 unhealthy = critical ·
// >150 hazardous = critical, drawn darker (CRITICAL_DEEP).
export function bmaAqStationsLayer(stations: AqStation[]) {
  return new ScatterplotLayer<AqStation>({
    id: "bma-aq-stations",
    data: stations,
    getPosition: (s) => [s.lng, s.lat],
    getRadius: 60,
    radiusMinPixels: 8,
    radiusMaxPixels: 16,
    getFillColor: (s) => {
      const v = s.pm25 ?? 0;
      if (v < 12) return statusRgba("normal", 255);
      if (v < 35) return statusRgba("watch", 255);
      if (v < 55) return statusRgba("warning", 255);
      if (v < 150) return statusRgba("critical", 255);
      return withAlpha(CRITICAL_DEEP, 255);
    },
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 2,
    pickable: true,
  });
}

/**
 * Air4Thai PCD stations — official Thai government air-quality monitors inside
 * Chonburi province. Coloured by PM2.5 (US-EPA bands), labelled with the live
 * AQI so an operator sees the real sensor readings on the map. Pickable so the
 * tooltip shows station name + readings.
 */
export function air4thaiLayer(stations: AirQualityPoint[]) {
  return new ScatterplotLayer<AirQualityPoint>({
    id: "air4thai-stations",
    data: stations,
    getPosition: (s) => [s.lng, s.lat],
    getRadius: 90,
    radiusMinPixels: 9,
    radiusMaxPixels: 20,
    getFillColor: (s) => {
      const v = s.pm25 ?? -1;
      if (v < 0) return statusRgba("unknown", 200); // no reading
      if (v <= 12) return statusRgba("normal", 255);
      if (v <= 35.4) return statusRgba("watch", 255);
      if (v <= 55.4) return statusRgba("warning", 255);
      if (v <= 150.4) return statusRgba("critical", 255);
      return withAlpha(CRITICAL_DEEP, 255);
    },
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 2,
    pickable: true,
  });
}

/** Camera dots: hue = purpose, and an OFFLINE camera is a dark disc with a
 *  coloured ring — status never rides on colour alone. */
export function cctvLayer(cameras: CctvCamera[], id: "cctv-cameras" | "cctv-water-level" = "cctv-cameras") {
  return new ScatterplotLayer<CctvCamera>({
    id,
    data: cameras,
    getPosition: (c) => [c.lng, c.lat],
    getRadius: 28,
    radiusMinPixels: 5,
    radiusMaxPixels: 9,
    getFillColor: (c) => {
      if (c.status === "offline") return [15, 13, 10, 210];
      const [r, g, b] = CCTV_CATEGORY_RGB[c.category ?? "other"];
      return [r, g, b, 240];
    },
    stroked: true,
    getLineColor: (c) => {
      if (c.status !== "offline") return [15, 13, 10, 255];
      const [r, g, b] = CCTV_CATEGORY_RGB[c.category ?? "other"];
      return [r, g, b, 255];
    },
    lineWidthUnits: "pixels",
    getLineWidth: (c) => (c.status === "offline" ? 2 : 1),
    pickable: true,
  });
}

/**
 * CCTV pulse halo — a single-entry ScatterplotLayer that renders JUST the
 * highlighted camera as a pulsing ring on top of `cctvLayer`. The radius
 * is updated each animation frame via the caller's rAF loop (see
 * `useCctvPulseFrame` hook in App.tsx). `null` returns no layer — caller
 * appends nothing when no camera is highlighted.
 *
 * Old-school map↔wall sync: when an operator clicks a CCTV dot on the
 * map, BOTH the dot AND its tile in the CCTV Command Center wall blink
 * in sync for ~2.4 s. This layer is the map-side half of that handshake;
 * the wall-side half is a CSS keyframe on the matching `.cctv-cell`.
 */
export function cctvPulseLayer(highlightedId: string | null, cameras: CctvCamera[], pulseRadius: number): Layer | null {
  if (!highlightedId) return null;
  const cam = cameras.find((c) => c.id === highlightedId);
  if (!cam) return null;
  const [r, g, b] = CCTV_CATEGORY_RGB[cam.category ?? "other"];
  return new ScatterplotLayer<CctvCamera>({
    id: "cctv-pulse",
    data: [cam],
    getPosition: (c) => [c.lng, c.lat],
    getRadius: pulseRadius,
    radiusUnits: "pixels",
    radiusMinPixels: 12,
    radiusMaxPixels: 64,
    getFillColor: [r, g, b, 90],
    stroked: true,
    getLineColor: [r, g, b, 240],
    lineWidthUnits: "pixels",
    getLineWidth: 2,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  }) as Layer;
}

// IconLayer reference, kept so 3D-extruded buildings + vehicle icons can be added later.
export { IconLayer };

// ─── Utility layers ──────────────────────────────────────────────────────
// Electricity, water mains, storm drainage, WiFi survey. Geometry comes from
// hand-authored GeoJSONs at /geo/cu-electricity|water|drainage|wifi.geojson —
// see those files for sourcing notes (real substation names verified against
// the CU-MEA SMART CITY agreement; everything else is realistic
// approximation along the road network).

interface ElectricityProps {
  id: string;
  kind: "substation" | "ring-feeder" | "delivery" | "hv-backbone" | "mv-feeder" | "solar-pv" | "battery-storage";
  name: string;
  voltage?: number;
  capacityMva?: number;
  capacityKw?: number;
  capacityMwh?: number;
  status?: string;
  describe?: string;
}

export function electricityLineLayer(collection: FeatureCollection) {
  // Only LineString features (HV backbone, MV feeder).
  const fc = {
    type: "FeatureCollection",
    features: collection.features.filter((f) => f.geometry.type === "LineString"),
  } as FeatureCollection;
  return new GeoJsonLayer({
    id: "cu-electricity-lines",
    data: fc,
    stroked: true,
    filled: false,
    pickable: true,
    getLineColor: ((f: Feature<LineString, ElectricityProps>) =>
      f.properties.kind === "hv-backbone"
        ? (withAlpha(CAT.orange, 240) as [number, number, number, number]) // amber HV
        : (withAlpha(tint(CAT.orange, 0.45), 215) as [number, number, number, number])) as unknown as [number, number, number, number],
    getLineWidth: ((f: Feature<LineString, ElectricityProps>) =>
      f.properties.kind === "hv-backbone" ? 5 : 2.5) as unknown as number,
    lineWidthMinPixels: 2,
    lineWidthMaxPixels: 6,
  });
}

export function electricityNodeLayer(collection: FeatureCollection) {
  const points = collection.features.filter((f) => f.geometry.type === "Point");
  return new ScatterplotLayer({
    id: "cu-electricity-nodes",
    data: points,
    getPosition: ((f: Feature<Point, ElectricityProps>) =>
      f.geometry.coordinates) as unknown as [number, number],
    getRadius: ((f: Feature<Point, ElectricityProps>) => {
      const k = f.properties.kind;
      if (k === "substation") return 90;
      if (k === "delivery") return 60;
      if (k === "battery-storage") return 50;
      if (k === "solar-pv") return 45;
      return 35;
    }) as unknown as number,
    radiusMinPixels: 5,
    radiusMaxPixels: 14,
    getFillColor: ((f: Feature<Point, ElectricityProps>) => {
      const k = f.properties.kind;
      if (k === "substation") return withAlpha(CAT.orange, 240);
      if (k === "delivery") return withAlpha(shade(CAT.orange, 0.3), 220);
      if (k === "battery-storage") return withAlpha(CAT.pink, 230);
      if (k === "solar-pv") return withAlpha(CAT.yellow, 230);
      return withAlpha(tint(CAT.orange, 0.45), 220);
    }) as unknown as [number, number, number, number],
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

interface WaterProps {
  id: string;
  kind: "supply-point" | "main" | "lateral" | "fire-hydrant";
  diameter?: number;
  status?: string;
  name?: string;
}

export function waterLineLayer(collection: FeatureCollection) {
  const fc = {
    type: "FeatureCollection",
    features: collection.features.filter((f) => f.geometry.type === "LineString"),
  } as FeatureCollection;
  return new GeoJsonLayer({
    id: "cu-water-lines",
    data: fc,
    stroked: true,
    filled: false,
    pickable: true,
    getLineColor: ((f: Feature<LineString, WaterProps>) =>
      f.properties.kind === "main"
        ? (withAlpha(CAT.sky, 230) as [number, number, number, number]) // cyan main
        : (withAlpha(tint(CAT.sky, 0.45), 200) as [number, number, number, number])) as unknown as [number, number, number, number],
    getLineWidth: ((f: Feature<LineString, WaterProps>) =>
      f.properties.kind === "main" ? 4 : 2) as unknown as number,
    lineWidthMinPixels: 1.5,
    lineWidthMaxPixels: 5,
  });
}

export function waterNodeLayer(collection: FeatureCollection) {
  const points = collection.features.filter((f) => f.geometry.type === "Point");
  return new ScatterplotLayer({
    id: "cu-water-nodes",
    data: points,
    getPosition: ((f: Feature<Point, WaterProps>) => f.geometry.coordinates) as unknown as [number, number],
    getRadius: 40,
    radiusMinPixels: 4,
    radiusMaxPixels: 10,
    getFillColor: ((f: Feature<Point, WaterProps>) =>
      f.properties.kind === "supply-point"
        ? (withAlpha(CAT.sky, 240) as [number, number, number, number])
        : (withAlpha(tint(CAT.sky, 0.45), 230) as [number, number, number, number])) as unknown as [number, number, number, number],
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

interface DrainageProps {
  id: string;
  kind: "main" | "feeder" | "retention-basin" | "outfall" | "pump-station";
  diameter?: number;
  capacityM3?: number;
  flow?: string;
  status?: string;
  name?: string;
}

export function drainageLineLayer(collection: FeatureCollection) {
  const fc = {
    type: "FeatureCollection",
    features: collection.features.filter((f) => f.geometry.type === "LineString"),
  } as FeatureCollection;
  return new GeoJsonLayer({
    id: "cu-drainage-lines",
    data: fc,
    stroked: true,
    filled: false,
    pickable: true,
    getLineColor: ((f: Feature<LineString, DrainageProps>) =>
      f.properties.kind === "main"
        ? (withAlpha(CAT.green, 230) as [number, number, number, number]) // emerald main
        : (withAlpha(tint(CAT.green, 0.45), 200) as [number, number, number, number])) as unknown as [number, number, number, number],
    getLineWidth: ((f: Feature<LineString, DrainageProps>) =>
      f.properties.kind === "main" ? 5 : 2.5) as unknown as number,
    lineWidthMinPixels: 2,
    lineWidthMaxPixels: 6,
  });
}

export function drainageNodeLayer(collection: FeatureCollection) {
  const points = collection.features.filter((f) => f.geometry.type === "Point");
  return new ScatterplotLayer({
    id: "cu-drainage-nodes",
    data: points,
    getPosition: ((f: Feature<Point, DrainageProps>) => f.geometry.coordinates) as unknown as [number, number],
    getRadius: ((f: Feature<Point, DrainageProps>) =>
      f.properties.kind === "retention-basin" ? 110 : 50) as unknown as number,
    radiusMinPixels: 5,
    radiusMaxPixels: 16,
    getFillColor: ((f: Feature<Point, DrainageProps>) => {
      const k = f.properties.kind;
      if (k === "retention-basin") return withAlpha(CAT.green, 220);
      if (k === "outfall") return withAlpha(CAT.sky, 230);
      if (k === "pump-station") return withAlpha(tint(CAT.green, 0.45), 230);
      return withAlpha(shade(CAT.green, 0.3), 220);
    }) as unknown as [number, number, number, number],
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

// ─── WiFi survey heatmap + points ────────────────────────────────────────

interface WifiProps {
  id: string;
  name: string;
  mbps: number;
  rttMs?: number;
  ssid?: string;
  source?: string;
}

// WiFi heatmap, weighted by Mbps (faster = stronger contribution)
export function wifiHeatmapLayer(collection: FeatureCollection) {
  const features = collection.features.filter(
    (f): f is Feature<Point, WifiProps> => f.geometry.type === "Point",
  );
  return new HeatmapLayer<Feature<Point, WifiProps>>({
    id: "cu-wifi-heat",
    data: features,
    getPosition: (f) => f.geometry.coordinates as [number, number],
    getWeight: (f) => f.properties.mbps / 200,
    radiusPixels: 80,
    intensity: 1.2,
    threshold: 0.05,
    aggregation: "MEAN",
    colorRange: [
      // Signal quality is data, not status: dark blue (weak) → pale sky (strong).
      withAlpha(shade(CAT.blue, 0.35), 0),
      withAlpha(CAT.blue, 120),
      withAlpha(CAT.sky, 180),
      withAlpha(tint(CAT.sky, 0.5), 220),
      withAlpha(tint(CAT.sky, 0.8), 240),
    ],
  });
}

/** Pulsing dot at the operator's GPS fix. Two concentric circles + an
 *  accuracy disk underneath. */
export function devicePresenceLayer(
  lng: number,
  lat: number,
  accuracyM: number | null,
) {
  const data = [{ lng, lat, accuracyM }];
  // Convert accuracy metres to a rough pixel radius at zoom 16 (campus zoom).
  // deck.gl Scatterplot uses `radius` in meters when `radiusUnits === "meters"`
  // (the default for this layer). We pass the actual metre value.
  return [
    new ScatterplotLayer({
      id: "device-accuracy",
      data,
      getPosition: (d) => [d.lng, d.lat] as [number, number],
      getRadius: () => accuracyM ?? 30,
      radiusUnits: "meters",
      radiusMinPixels: 8,
      radiusMaxPixels: 240,
      getFillColor: withAlpha(CAT.sky, 50),
      stroked: false,
      pickable: false,
    }),
    new ScatterplotLayer({
      id: "device-dot",
      data,
      getPosition: (d) => [d.lng, d.lat] as [number, number],
      getRadius: 16,
      radiusUnits: "pixels",
      getFillColor: withAlpha(CAT.sky, 240),
      stroked: true,
      getLineColor: [255, 255, 255, 240],
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      pickable: false,
    }),
  ];
}

export function wifiPointsLayer(collection: FeatureCollection) {
  const features = collection.features.filter((f) => f.geometry.type === "Point");
  return new ScatterplotLayer({
    id: "cu-wifi-points",
    data: features,
    getPosition: ((f: Feature<Point, WifiProps>) =>
      f.geometry.coordinates) as unknown as [number, number],
    getRadius: 22,
    radiusMinPixels: 4,
    radiusMaxPixels: 8,
    getFillColor: ((f: Feature<Point, WifiProps>) => {
      const m = f.properties.mbps;
      if (m >= 120) return withAlpha(tint(CAT.sky, 0.6), 230); // fast
      if (m >= 80)  return withAlpha(CAT.sky, 230);            // ok
      if (m >= 50)  return withAlpha(CAT.blue, 230);           // meh
      return withAlpha(shade(CAT.blue, 0.35), 230); // slow
    }) as unknown as [number, number, number, number],
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

/**
 * CU 2015 paper map as a georeferenced raster overlay.
 * Bounds tuned to the actual campus extent (Bunthadthong → Ratchadamri,
 * Rama 1 → Si Lom). Refine the corner coordinates if alignment drifts.
 */
export function cuMapOverlay(
  url = "/maps/cu-map-2015.png",
  bounds: [number, number, number, number] = [100.5176, 13.7270, 100.5455, 13.7475],
  opacity = 0.85,
) {
  return new BitmapLayer({
    id: "cu-map-2015",
    image: url,
    bounds,
    opacity,
    pickable: false,
    desaturate: 0,
    // depthTest off so the bitmap stays glued to the ground when buildings
    // are extruded — otherwise the building bottoms occlude it and the map
    // appears to vanish at pitch > 0.
    parameters: { depthTest: false },
  });
}

/** NASA GIBS WMTS tile layer — free, no API key. */
/**
 * NASA GIBS global tile layer (MODIS true-color, NDVI, LST, flood).
 * Always visible when called — the caller decides whether to add it to
 * the deck.gl layer list based on enabledLayers. The zoom restriction was
 * removed: if the user explicitly turns a satellite layer on, they should
 * see it. Layer descriptions in the palette already say "regional zoom".
 */
// GIBS product → (format, max-level) heuristic. RGB / true-color products
// ship as JPG at Level 9; thematic palettes (NDVI, LST, AOD, NO2, IMERG)
// ship as PNG at lower max levels.
function inferFormat(productId: string): "jpg" | "png" {
  if (productId.includes("CorrectedReflectance")) return "jpg";
  if (productId.includes("TrueColor")) return "jpg";
  if (productId.includes("DayNightBand")) return "png";
  return "png";
}
function inferLevel(productId: string): 6 | 7 | 8 | 9 {
  if (productId.includes("IMERG")) return 6;
  if (productId.includes("OMI_") || productId.includes("AOD")) return 6;
  if (productId.includes("Land_Surface_Temp")) return 7;
  if (productId.includes("DayNightBand")) return 8;
  return 9;
}

interface GibsOpts {
  /** "jpg" for true-color / RGB products, "png" for thematic / index products. */
  format?: "jpg" | "png";
  /** Tile matrix max level: 9 for high-res, 7-8 for thematic, 6 for IMERG / OMI. */
  level?: 6 | 7 | 8 | 9;
}
export function gibsLayer(
  productId: string,
  date?: string,
  opacity = 0.6,
  opts: GibsOpts = {},
) {
  const dateStr = date ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const format = opts.format ?? inferFormat(productId);
  const level = opts.level ?? inferLevel(productId);
  return new TileLayer({
    id: `gibs-${productId}`,
    data:
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${productId}/default/${dateStr}` +
      `/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${format}`,
    minZoom: 0,
    maxZoom: level,
    tileSize: 256,
    opacity,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as {
        boundingBox: [[number, number], [number, number]];
      };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({
        ...props,
        data: undefined,
        image: props.data as unknown as string,
        bounds: [w, s, e, n],
      });
    },
  });
}

/** Esri World Imagery — high-resolution satellite, publicly accessible. */
export function esriSatelliteLayer(opacity = 0.9) {
  return new TileLayer({
    id: "satellite-esri",
    data: "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    opacity,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as {
        boundingBox: [[number, number], [number, number]];
      };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({
        ...props,
        data: undefined,
        image: props.data as unknown as string,
        bounds: [w, s, e, n],
      });
    },
  });
}

/** Google Map Tiles (satellite / live-traffic overlay) via a minted session
 *  token. `tileUrlTemplate` is the per-session 2dtiles URL from
 *  googleTileTemplate(); deck.gl's TileLayer drives the {z}/{x}/{y} substitution
 *  and BitmapLayer paints each fetched tile. Same proven pattern as the Esri +
 *  GIBS deck.gl layers (MapLibre raster overlays don't paint in this
 *  <DeckGL><Map> setup, so satellite imagery must ride deck.gl's canvas). */
export function googleTilesLayer(tileUrlTemplate: string, opacity = 1, id = "google-tiles") {
  return new TileLayer({
    id,
    data: tileUrlTemplate,
    minZoom: 0,
    maxZoom: 20,
    tileSize: 256,
    opacity,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as {
        boundingBox: [[number, number], [number, number]];
      };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({
        ...props,
        data: undefined,
        image: props.data as unknown as string,
        bounds: [w, s, e, n],
      });
    },
  });
}

/** OpenTopoMap terrain — for elevation/contour context. Lower max zoom (17). */
// True-3D topographic terrain of the Khao Luang massif, as an EXTRUDED grid.
// deck.gl's TerrainLayer does not composite in this DeckGL-as-camera / MapLibre-
// basemap setup (renders nothing), but deck's extruded layers do — the 3D
// buildings prove it — so terrain is a GridCellLayer of real ground-elevation
// samples (scripts/build-nst-terrain-grid.mjs, Open-Meteo ~90 m DEM). Coloured
// by height: coastal green → foothill olive → montane brown → peak grey.
export interface TerrainCell {
  x: number;
  y: number;
  lng: number;
  lat: number;
  elevM: number;
}
export interface TerrainGrid {
  cellLng: number;
  cellLat: number;
  cells: TerrainCell[];
}

const M_PER_DEG = 110_800;

function terrainColor(elevM: number): [number, number, number] {
  // Dark green (sea level) → olive → tan → pale grey (peaks); every stop is
  // lighter than the one below so relief reads in greyscale. Khao Luang ≈ 1,835 m.
  const stops: Array<[number, [number, number, number]]> = [
    [0, [40, 72, 52]],
    [150, [70, 100, 60]],
    [450, [110, 120, 70]],
    [900, [145, 130, 95]],
    [1400, [175, 165, 145]],
    [1900, [215, 212, 208]],
  ];
  if (elevM <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (elevM <= stops[i][0]) {
      const [lo, loC] = stops[i - 1];
      const [hi, hiC] = stops[i];
      const t = (elevM - lo) / (hi - lo);
      return [
        Math.round(loC[0] + (hiC[0] - loC[0]) * t),
        Math.round(loC[1] + (hiC[1] - loC[1]) * t),
        Math.round(loC[2] + (hiC[2] - loC[2]) * t),
      ];
    }
  }
  return stops[stops.length - 1][1];
}

export function terrain3dLayer(grid: TerrainGrid, exaggeration = 6) {
  // Square-ish cell size from the (larger) lat spacing → cells overlap slightly
  // rather than gap, so the relief reads as a continuous surface. Exaggeration
  // is generous: at province scale a literal 1× lifts only ~2 % of the view
  // width, invisible under pitch — ~6× makes Khao Luang legibly rise.
  const cellSize = grid.cellLat * M_PER_DEG;
  return new GridCellLayer<TerrainCell>({
    id: "terrain-3d",
    data: grid.cells,
    cellSize,
    // GridCellLayer anchors a cell at its position and extends +cellSize; offset
    // the sample-centre by half a cell so the cell centres on its sample.
    getPosition: (c) => [c.lng - grid.cellLng / 2, c.lat - grid.cellLat / 2],
    getElevation: (c) => Math.max(0, c.elevM),
    elevationScale: exaggeration,
    extruded: true,
    getFillColor: (c) => {
      const [r, g, b] = terrainColor(c.elevM);
      return [r, g, b, 235];
    },
    material: { ambient: 0.5, diffuse: 0.6, shininess: 4, specularColor: [30, 30, 30] },
    pickable: false,
  });
}

/**
 * RainViewer live radar nowcast (animated) — the third precipitation layer
 * beside the existing GIBS IMERG (satellite rain-rate) and Himawari (storm
 * clouds). Plain XYZ PNG tiles; the frame URL is chosen by the caller
 * (map/useRainRadar.ts) which walks past→forecast frames. No key.
 */
export function rainviewerRadarLayer(frameUrlTemplate: string, opacity = 0.6) {
  return new TileLayer({
    id: "precip-radar",
    data: frameUrlTemplate,
    minZoom: 0,
    maxZoom: 7,
    tileSize: 256,
    opacity,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as { boundingBox: [[number, number], [number, number]] };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({ ...props, data: undefined, image: props.data as unknown as string, bounds: [w, s, e, n] });
    },
  });
}

/**
 * WAQI / AQICN air-quality tile overlay — the AirDash "field" view (real
 * US-EPA-AQI raster, not just station dots). Served through the API worker
 * proxy `/api/air/waqi/{z}/{x}/{y}` so the token stays server-side. Coloured by
 * WAQI's standard AQI palette; where the air thickens (traffic corridors,
 * burning season) the field deepens.
 */
export function waqiAirFieldLayer(apiBase: string, opacity = 0.55) {
  return new TileLayer({
    id: "air-waqi-field",
    data: `${apiBase}/api/air/waqi/{z}/{x}/{y}`,
    minZoom: 0,
    maxZoom: 12,
    tileSize: 256,
    opacity,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as { boundingBox: [[number, number], [number, number]] };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({ ...props, data: undefined, image: props.data as unknown as string, bounds: [w, s, e, n] });
    },
  });
}

export function openTopoTerrainLayer(opacity = 0.6) {
  return new TileLayer({
    id: "satellite-terrain",
    data: [
      "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
    ],
    minZoom: 0,
    maxZoom: 17,
    tileSize: 256,
    opacity,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as {
        boundingBox: [[number, number], [number, number]];
      };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({
        ...props,
        data: undefined,
        image: props.data as unknown as string,
        bounds: [w, s, e, n],
      });
    },
  });
}

/**
 * Himawari-9 Band 13 (clean infrared) via NASA GIBS WMS. Geostationary cloud
 * loop, 10-min cadence — best for spotting incoming storms over Bangkok.
 * Uses WMS (not WMTS) because GIBS only exposes Himawari that way.
 */
export function himawariInfraredLayer(opacity = 0.55) {
  const today = new Date().toISOString().slice(0, 10);
  // GIBS WMS template — single tile per request, but TileLayer drives the bbox.
  const wmsBase =
    "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?" +
    "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&" +
    `LAYERS=Himawari_AHI_Band13_Clean_Infrared&TIME=${today}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256`;
  return new TileLayer({
    id: "satellite-himawari",
    minZoom: 0,
    maxZoom: 9,
    tileSize: 256,
    opacity,
    getTileData: async ({ bbox }) => {
      // bbox in Web Mercator metres. GIBS expects BBOX=minx,miny,maxx,maxy.
      const { west, south, east, north } = bbox as { west: number; south: number; east: number; north: number };
      // Convert lat/lng to mercator metres (deck.gl gives lng/lat).
      const R = 6378137;
      const toMx = (lng: number) => (lng * Math.PI * R) / 180;
      const toMy = (lat: number) => Math.log(Math.tan((Math.PI * (90 + lat)) / 360)) * R;
      const url = `${wmsBase}&BBOX=${toMx(west)},${toMy(south)},${toMx(east)},${toMy(north)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        if (typeof createImageBitmap === "function") {
          return await createImageBitmap(blob);
        }
        // Old Safari without createImageBitmap — skip tile rather than leak blob URLs
        return null;
      } catch {
        return null;
      }
    },
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as {
        boundingBox: [[number, number], [number, number]];
      };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({
        ...props,
        data: undefined,
        image: props.data as unknown as ImageBitmap,
        bounds: [w, s, e, n],
      });
    },
  });
}

// ─── BTS / MRT line geometry ────────────────────────────────────────────
// Polyline tracks for the elevated/underground rail network around the
// campus. Coloured per system: BTS Sukhumvit/Silom (greens), MRT Blue
// (blue), Airport/Gold lines (warm). Lines render below station scatter.

export function transitLinesLayer(collection: FeatureCollection<LineString, TransitLineProps>) {
  return new GeoJsonLayer({
    id: "transit-lines",
    data: collection as unknown as FeatureCollection,
    stroked: true,
    filled: false,
    pickable: true,
    getLineColor: ((f: Feature<LineString, TransitLineProps>) => {
      const c = hexToRgb(f.properties.color);
      return [c[0], c[1], c[2], 230] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineWidth: 5,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 2,
    lineWidthMaxPixels: 7,
  });
}

// ─── Campus gates / entrances ───────────────────────────────────────────
// Every barrier=gate / barrier=lift_gate / entrance=* node on or near the
// campus perimeter. Named gates (ประตูพญาไท 1/2/3, อังรีดูนังต์ 1/2, ประตูดำ)
// render larger and amber; unnamed minor gates stay small and grey.

export function campusGatesLayer(collection: FeatureCollection<Point, GateProps>) {
  return new ScatterplotLayer({
    id: "campus-gates",
    data: collection.features,
    getPosition: ((f: Feature<Point, GateProps>) => f.geometry.coordinates) as unknown as [number, number],
    getRadius: ((f: Feature<Point, GateProps>) => (f.properties.named ? 36 : 18)) as unknown as number,
    radiusMinPixels: 4,
    radiusMaxPixels: 12,
    getFillColor: ((f: Feature<Point, GateProps>) =>
      f.properties.named
        ? withAlpha(CAT.yellow, 240)
        : withAlpha(grey(150), 220)) as unknown as [number, number, number, number],
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

// ─── Road network — classified by priority ──────────────────────────────
// Renders the OSM road network as a visible map element. Width + colour
// scale by `priority`: motorway/primary = thick warm, secondary = medium
// cyan, tertiary = thin cyan, residential/lane = thinnest neutral.

// Roads are context, not data: neutral greys, brighter + wider = higher class.
const ROAD_STYLE: Record<number, { color: [number, number, number]; width: number }> = {
  6: { color: grey(235), width: 4.5 },  // motorway
  5: { color: grey(200),  width: 3.5 },  // primary / secondary
  4: { color: grey(165), width: 2.5 },  // tertiary
  3: { color: grey(130), width: 1.5 },  // residential / lane
  2: { color: grey(105), width: 1.0 },  // unclassified / minor
};

export function roadNetworkLayer(
  collection: FeatureCollection<LineString, ClassifiedRoadProps>,
  options: { zoomBucket?: 0 | 1 | 2 } = {},
) {
  const zoomBucket = options.zoomBucket ?? 2;
  // Picking is per-pixel work for the GPU picking buffer; at province/city
  // scale (zoom 0/1) the user is panning around, not clicking on individual
  // road segments. Disable it.
  const pickable = zoomBucket === 2;
  // Drop the smallest roads (priority ≥ 3, i.e. residential/service) at province
  // scale — they'd be 1 px lines stacked on top of each other. Keep the arterials
  // and secondary roads (priority 1 + 2) for spatial context.
  const features = zoomBucket === 0
    ? collection.features.filter((f) => f.properties.priority <= 2)
    : collection.features;
  const filtered: FeatureCollection<LineString, ClassifiedRoadProps> = {
    type: "FeatureCollection",
    features,
  };
  return new GeoJsonLayer({
    id: "road-network",
    data: filtered as unknown as FeatureCollection,
    stroked: true,
    filled: false,
    pickable,
    getLineColor: ((f: Feature<LineString, ClassifiedRoadProps>) => {
      const s = ROAD_STYLE[f.properties.priority] ?? ROAD_STYLE[3];
      return [s.color[0], s.color[1], s.color[2], 180] as [number, number, number, number];
    }) as unknown as [number, number, number, number],
    getLineWidth: ((f: Feature<LineString, ClassifiedRoadProps>) => {
      const s = ROAD_STYLE[f.properties.priority] ?? ROAD_STYLE[3];
      return s.width;
    }) as unknown as number,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 0.5,
    lineWidthMaxPixels: 6,
    updateTriggers: {
      getLineColor: [zoomBucket],
      getLineWidth: [zoomBucket],
    },
  });
}

// ─── Neighborhood tall buildings (≥30 m) ────────────────────────────────
// Skyline context — the towers around Pathumwan / Silom / Ratchaprasong.
// Cooler palette than the campus buildings so the campus visually pops.

export function neighborhoodBuildingsLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, NeighborhoodBuildingProps>,
  options: { extruded?: boolean; ghosted?: boolean } = {},
) {
  const extruded = options.extruded ?? false;
  const ghosted = options.ghosted ?? false;

  const colorFor = (h: number): [number, number, number, number] => {
    const alpha = ghosted ? 32 : extruded ? 215 : 70;
    if (h >= 150) return withAlpha(tint(CAT.sky, 0.6), alpha); // supertall
    if (h >= 80)  return withAlpha(tint(CAT.sky, 0.3), alpha);
    if (h >= 50)  return withAlpha(CAT.sky, alpha);
    return withAlpha(grey(90), alpha);
  };

  return new GeoJsonLayer({
    id: "neighborhood-buildings",
    data: collection as unknown as FeatureCollection,
    stroked: true,
    filled: true,
    pickable: true,
    extruded,
    material: extruded && !ghosted
      ? { ambient: 0.55, diffuse: 0.65, shininess: 8, specularColor: [200, 220, 255] }
      : false,
    getFillColor: ((f: Feature<Polygon | MultiPolygon, NeighborhoodBuildingProps>) =>
      colorFor(f.properties.height)) as unknown as [number, number, number, number],
    getLineColor: withAlpha(tint(CAT.sky, 0.3), ghosted ? 90 : 200),
    getLineWidth: 0.6,
    lineWidthMinPixels: 0.4,
    getElevation: ((f: Feature<Polygon | MultiPolygon, NeighborhoodBuildingProps>) =>
      f.properties.height) as unknown as number,
    opacity: ghosted ? 0.35 : 1,
    updateTriggers: {
      getFillColor: [extruded, ghosted],
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MARITIME LAYERS
// ═══════════════════════════════════════════════════════════════════════

export interface AisVessel {
  mmsi: string;
  name: string | null;
  lat: number;
  lng: number;
  course?: number;
  speed?: number;
  type?: string;
  flag?: string;
  lastUpdate?: string;
}

export interface DatagoPoint {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  lat: number;
  lng: number;
  source: string;
  attribution?: string;
}

// OpenSeaMap raster tile overlay — shipping lanes, depth, anchorages
export function maritimeOverlayLayer() {
  return new TileLayer({
    id: "maritime-overlay",
    data: "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
    minZoom: 0,
    maxZoom: 18,
    tileSize: 256,
    pickable: false,
    opacity: 0.85,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile as unknown as {
        boundingBox: [[number, number], [number, number]];
      };
      const [[w, s], [e, n]] = boundingBox;
      return new BitmapLayer({
        ...props,
        data: undefined,
        image: props.data as unknown as string,
        bounds: [w, s, e, n],
      });
    },
  });
}

// Port infrastructure — polygons (harbour landuse, piers, breakwaters)
export function portInfrastructureLayer(collection: FeatureCollection<Polygon | MultiPolygon | LineString, Record<string, unknown>>) {
  return new GeoJsonLayer({
    id: "port-infrastructure",
    data: collection,
    pickable: true,
    stroked: true,
    filled: true,
    getFillColor: withAlpha(CAT.orange, 70),
    getLineColor: withAlpha(CAT.orange, 220),
    getLineWidth: 2,
    lineWidthMinPixels: 1,
  });
}

// Ferry terminals — point markers
export function ferryTerminalsLayer(collection: FeatureCollection<Point, Record<string, unknown>>) {
  const features = collection.features.filter((f) => f.geometry.type === "Point");
  return new ScatterplotLayer<Feature<Point, Record<string, unknown>>>({
    id: "ferry-terminals",
    data: features,
    pickable: true,
    radiusUnits: "pixels",
    getPosition: (f) => f.geometry.coordinates as [number, number],
    getRadius: 7,
    getFillColor: withAlpha(tint(CAT.orange, 0.45), 230),
    getLineColor: [255, 255, 255, 180],
    stroked: true,
    lineWidthMinPixels: 1.5,
  });
}

// Navigation aids — lighthouses, beacons, buoys
export function navigationAidsLayer(collection: FeatureCollection<Point, Record<string, unknown>>) {
  const features = collection.features.filter((f) => f.geometry.type === "Point");
  return new ScatterplotLayer<Feature<Point, Record<string, unknown>>>({
    id: "navigation-aids",
    data: features,
    pickable: true,
    radiusUnits: "pixels",
    getPosition: (f) => f.geometry.coordinates as [number, number],
    getRadius: 6,
    getFillColor: (f) => {
      const t = String(f.properties?.["man_made"] ?? f.properties?.["seamark:type"] ?? "");
      if (t === "lighthouse") return withAlpha(CAT.yellow, 240);
      if (t.includes("buoy")) return withAlpha(CAT.sky, 220);
      return withAlpha(tint(CAT.yellow, 0.5), 200);
    },
    getLineColor: [255, 255, 255, 200],
    stroked: true,
    lineWidthMinPixels: 1.5,
  });
}

// AIS vessels — live ship positions
const VESSEL_COLOR: Record<string, [number, number, number]> = {
  cargo:     CAT.green,
  tanker:    CAT.vermil,
  passenger: CAT.sky,
  fishing:   CAT.orange,
  pleasure:  CAT.pink,
  tug:       CAT.blue,
  unknown:   grey(150),  // neutral
};

export function aisVesselsLayer(vessels: AisVessel[]) {
  return new ScatterplotLayer<AisVessel>({
    id: "ais-vessels",
    data: vessels,
    pickable: true,
    radiusUnits: "pixels",
    getPosition: (v) => [v.lng, v.lat],
    getRadius: 5,
    getFillColor: (v) => {
      const t = (v.type ?? "unknown").toLowerCase();
      for (const k of Object.keys(VESSEL_COLOR)) if (t.includes(k)) return [...VESSEL_COLOR[k], 230] as [number, number, number, number];
      return [...VESSEL_COLOR.unknown, 200] as [number, number, number, number];
    },
    getLineColor: [255, 255, 255, 180],
    stroked: true,
    lineWidthMinPixels: 1,
  });
}

// data.go.th points — government POI markers
const DATAGO_COLOR: Record<string, [number, number, number]> = {
  school:    CAT.pink,
  hospital:  CAT.vermil,
  health:    tint(CAT.vermil, 0.4),
  temple:    CAT.yellow,
  market:    CAT.orange,
  office:    CAT.blue,
  default:   CAT.sky,
};

export function datagoPointsLayer(points: DatagoPoint[]) {
  return new ScatterplotLayer<DatagoPoint>({
    id: "datago-points",
    data: points,
    pickable: true,
    radiusUnits: "pixels",
    getPosition: (p) => [p.lng, p.lat],
    getRadius: 5,
    getFillColor: (p) => {
      const cat = p.category.toLowerCase();
      for (const k of Object.keys(DATAGO_COLOR)) if (cat.includes(k)) return [...DATAGO_COLOR[k], 220] as [number, number, number, number];
      return [...DATAGO_COLOR.default, 200] as [number, number, number, number];
    },
    getLineColor: [255, 255, 255, 180],
    stroked: true,
    lineWidthMinPixels: 1,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// DISTANCE GRID (1 / 5 / 10 km rings from municipality centroid)
// Useful for: response-time radii, evacuation planning, ferry reach, AIS
// proximity, mayor's "I can be there in X minutes" framing.
// ═══════════════════════════════════════════════════════════════════════

import { PolygonLayer } from "@deck.gl/layers";

const KM_RING_COLORS: Record<number, [number, number, number, number]> = {
  1:  withAlpha(grey(235), 220),
  5:  withAlpha(grey(195), 180),
  10: withAlpha(grey(155), 140),
};

/** Build a ring polygon at `radiusKm` from [lng, lat]. 64-segment circle. */
function ringAt(lng: number, lat: number, radiusKm: number): [number, number][] {
  const segs = 96;
  const earthR = 6371;
  const out: [number, number][] = [];
  for (let i = 0; i <= segs; i++) {
    const brg = (i * 2 * Math.PI) / segs;
    const dr = radiusKm / earthR;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(brg));
    const lng2 = lng1 + Math.atan2(
      Math.sin(brg) * Math.sin(dr) * Math.cos(lat1),
      Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2),
    );
    out.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return out;
}

export function distanceGridLayer(
  center: [number, number],
  radiiKm: number[] = [1, 5, 10],
) {
  const rings = radiiKm.map((km) => ({
    km,
    contour: ringAt(center[0], center[1], km),
  }));
  return new PolygonLayer<{ km: number; contour: [number, number][] }>({
    id: "distance-grid",
    data: rings,
    pickable: false,
    filled: false,
    stroked: true,
    getPolygon: (d) => d.contour,
    getLineColor: (d) => KM_RING_COLORS[d.km] ?? withAlpha(grey(150), 160),
    getLineWidth: (d) => (d.km === 10 ? 2.5 : d.km === 5 ? 2 : 1.5),
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
  });
}

// Text labels for each ring
export function distanceGridLabelsLayer(
  center: [number, number],
  radiiKm: number[] = [1, 5, 10],
) {
  // Place each label slightly north-east of the centroid at radius
  const labels = radiiKm.map((km) => {
    const earthR = 6371;
    const dr = km / earthR;
    const brg = Math.PI / 4; // 45° NE
    const lat1 = (center[1] * Math.PI) / 180;
    const lng1 = (center[0] * Math.PI) / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(brg));
    const lng2 = lng1 + Math.atan2(
      Math.sin(brg) * Math.sin(dr) * Math.cos(lat1),
      Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2),
    );
    return { km, position: [(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI] as [number, number] };
  });
  return new TextLayer<{ km: number; position: [number, number] }>({
    id: "distance-grid-labels",
    data: labels,
    pickable: false,
    getPosition: (d) => d.position,
    getText: (d) => `${d.km} km`,
    getSize: 12,
    sizeUnits: "pixels",
    getColor: (d) => KM_RING_COLORS[d.km] ?? withAlpha(grey(200), 220),
    fontFamily: MAP_FONT,
    fontWeight: 600,
    getTextAnchor: "start",
    getAlignmentBaseline: "bottom",
    background: true,
    backgroundPadding: [4, 2],
    getBackgroundColor: [14, 14, 14, 220],
  });
}

// ═══════════════════════════════════════════════════════════════════════
// CIVIC + WATERWAYS — consistent category palette + hover tooltips
// ═══════════════════════════════════════════════════════════════════════

export interface CivicPoint {
  kind: CivicKind;
  name?: string;
  nameTh?: string;
  nameEn?: string;
}
export type CivicKind =
  | "hospital" | "clinic" | "pharmacy"
  | "school" | "university" | "kindergarten"
  | "police" | "fire"
  | "government" | "courthouse" | "post"
  | "temple-buddhist" | "church" | "mosque"
  | "market" | "bus-station" | "ferry"
  | "power-substation" | "water-works" | "wastewater"
  | "other";

// Shared category palette — coded by colour family so the legend is
// learnable across the whole dashboard. Health = red family; Education
// = violet; Safety = amber/orange; Government = cerulean; Religion =
// gold; Utility = teal; Transport = sky.
export const CIVIC_PALETTE: Record<CivicKind, { color: [number, number, number]; glyph: string; label: string }> = {
  hospital:         { color: CAT.vermil,  glyph: "✚", label: "Hospital" },
  clinic:           { color: tint(CAT.vermil, 0.4), glyph: "✚", label: "Clinic" },
  pharmacy:         { color: tint(CAT.vermil, 0.65), glyph: "Rx", label: "Pharmacy" },
  school:           { color: CAT.pink, glyph: "🅢", label: "School" },
  university:       { color: tint(CAT.pink, 0.4), glyph: "Ⓤ", label: "University" },
  kindergarten:     { color: tint(CAT.pink, 0.65), glyph: "Ⓚ", label: "Kindergarten" },
  police:           { color: CAT.sky,  glyph: "P",  label: "Police" },
  fire:             { color: shade(CAT.vermil, 0.3),  glyph: "🜂", label: "Fire station" },
  government:       { color: CAT.blue,  glyph: "⌬", label: "Government" },
  courthouse:       { color: shade(CAT.blue, 0.3),   glyph: "⚖", label: "Courthouse" },
  post:             { color: tint(CAT.blue, 0.5), glyph: "✉", label: "Post office" },
  "temple-buddhist":{ color: CAT.yellow,  glyph: "卐", label: "Temple" },
  church:           { color: tint(CAT.yellow, 0.5),  glyph: "✟", label: "Church" },
  mosque:           { color: shade(CAT.yellow, 0.3),  glyph: "☪", label: "Mosque" },
  market:           { color: CAT.orange,  glyph: "▦", label: "Market" },
  "bus-station":    { color: tint(CAT.sky, 0.5), glyph: "🚌", label: "Bus station" },
  ferry:            { color: shade(CAT.sky, 0.3),  glyph: "⛴", label: "Ferry pier" },
  "power-substation": { color: tint(CAT.green, 0.45), glyph: "⚡", label: "Substation" },
  "water-works":    { color: CAT.green,  glyph: "💧", label: "Water works" },
  wastewater:       { color: shade(CAT.green, 0.35),  glyph: "♻", label: "Wastewater" },
  other:            { color: grey(150), glyph: "○",  label: "Other" },
};

function readKind(props: Record<string, unknown> | null | undefined): CivicKind {
  const k = (props?.kind as string) ?? "other";
  return (k in CIVIC_PALETTE ? (k as CivicKind) : "other");
}

export function civicPointsLayer(collection: FeatureCollection<Point, Record<string, unknown>>, options: { zoomBucket?: 0 | 1 | 2 } = {}) {
  const zoomBucket = options.zoomBucket ?? 2;
  // Picking is per-pixel work for the GPU picking buffer; at province/city
  // scale the user is panning around, not clicking on individual civic POIs.
  const pickable = zoomBucket === 2;
  // Drop minor civic POIs (parks, bus stops, etc.) at province scale — the
  // 1,352 markers at default zoom are too many to render at 1 px each. Keep
  // hospitals, fire stations, police, government at all zoom levels.
  const keepMinor = zoomBucket >= 1;
  const filtered = pickable
    ? collection.features
    : collection.features.filter((f) => {
        const k = readKind(f.properties);
        if (k === "hospital" || k === "fire" || k === "police" || k === "government") return true;
        return keepMinor;
      });
  return new ScatterplotLayer<Feature<Point, Record<string, unknown>>>({
    id: "civic-points",
    data: filtered,
    pickable,
    radiusUnits: "pixels",
    getPosition: (f) => f.geometry.coordinates as [number, number],
    getRadius: (f) => {
      const k = readKind(f.properties);
      // High-importance kinds get bigger dots so the mayor sees them first
      if (k === "hospital" || k === "fire" || k === "police" || k === "government") return 6;
      if (k === "university" || k === "courthouse") return 5;
      return 4;
    },
    getFillColor: (f) => {
      const c = CIVIC_PALETTE[readKind(f.properties)].color;
      return [...c, 220] as [number, number, number, number];
    },
    getLineColor: [255, 255, 255, 220],
    stroked: true,
    lineWidthMinPixels: 1,
    updateTriggers: { getFillColor: [], getRadius: [] },
  });
}

// Waterways — colour by type (rivers blue, canals brand-cyan, drains green).
// Tuned to read clearly on both the dark earth background (terrain) and the
// pale Esri canvas: rivers are saturated deep-blue, canals a brighter cyan,
// streams a pale sky so the river/canal hierarchy reads at a glance. The old
// [56, 189, 248, 200] for river was almost invisible at province scale.
const WATERWAY_COLOR: Record<string, [number, number, number, number]> = {
  river:  withAlpha(CAT.blue, 235),  // anchors the watershed visually
  canal:  withAlpha(CAT.sky, 240),  // a clear step lighter than river
  stream: withAlpha(tint(CAT.sky, 0.5), 190),
  drain:  withAlpha(CAT.green, 180),
  ditch:  withAlpha(shade(CAT.green, 0.3), 150),
};

export function waterwaysLayer(collection: FeatureCollection<LineString, Record<string, unknown>>) {
  return new GeoJsonLayer({
    id: "waterways",
    data: collection,
    pickable: true,
    stroked: true,
    filled: false,
    getLineColor: (f) => {
      const t = String(f.properties?.waterway ?? "stream").toLowerCase();
      return (WATERWAY_COLOR[t] ?? WATERWAY_COLOR.stream);
    },
    getLineWidth: (f) => {
      const t = String(f.properties?.waterway ?? "stream").toLowerCase();
      const base = t === "river" ? 4 : t === "canal" ? 2.5 : 1;
      // Scale by flowClass (if the upstream digest tagged it) so the base line
      // itself reads as flow magnitude: slow → thin, fast → thick. 5-year-old
      // rule: bigger line = more water.
      const fc = f.properties?.flowClass as string | undefined;
      if (fc === "fast") return base * 1.6;
      if (fc === "slow") return base * 0.7;
      return base;
    },
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// FISHERIES + COASTAL FLOOD RISK
// Hand-authored polygons. Update as municipal GIS supplies real shapes.
// ═══════════════════════════════════════════════════════════════════════

const FISHERY_COLOR: Record<string, [number, number, number, number]> = {
  oyster:    withAlpha(CAT.yellow, 110),
  shrimp:    withAlpha(CAT.orange, 110),
  mussel:    withAlpha(CAT.pink, 110),
  artisanal: withAlpha(CAT.sky, 110),
  offshore:  withAlpha(CAT.blue, 110),
};

export function fisheriesLayer(collection: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>) {
  return new GeoJsonLayer({
    id: "fisheries",
    data: collection,
    pickable: true,
    stroked: true,
    filled: true,
    getFillColor: (f) => {
      const k = String(f.properties?.kind ?? "artisanal");
      return (FISHERY_COLOR[k] ?? FISHERY_COLOR.artisanal);
    },
    getLineColor: (f) => {
      const k = String(f.properties?.kind ?? "artisanal");
      const c = FISHERY_COLOR[k] ?? FISHERY_COLOR.artisanal;
      return [c[0], c[1], c[2], 230];
    },
    getLineWidth: 2,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
  });
}

// Coastal flood-risk severity → StatusLevel: high critical, medium warning, low watch.
// Static hazard zones are context, not a live alarm — a faint fill with a clear
// outline (floodRiskLayer lifts the outline alpha), so they never read as an
// active emergency wash over the whole basin.
export const FLOOD_COLOR: Record<string, [number, number, number, number]> = {
  high:   statusRgba("critical", 44),
  medium: statusRgba("warning", 36),
  low:    statusRgba("watch", 28),
};

export function floodRiskLayer(collection: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>) {
  return new GeoJsonLayer({
    id: "flood-risk",
    data: collection,
    pickable: true,
    stroked: true,
    filled: true,
    getFillColor: (f) => {
      const sev = String(f.properties?.severity ?? "medium");
      return (FLOOD_COLOR[sev] ?? FLOOD_COLOR.medium);
    },
    getLineColor: (f) => {
      const sev = String(f.properties?.severity ?? "medium");
      const c = FLOOD_COLOR[sev] ?? FLOOD_COLOR.medium;
      return [c[0], c[1], c[2], 230];
    },
    getLineWidth: 1.5,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
  });
}

// ─── HII survey layers — flood marks + street elevation / flood scenario ────
// Source: HII open data (data.hii.or.th) — 2025 MMS mobile-mapping survey of
// Nakhon Si Thammarat, m above MSL, NCDC-referenced, cm accuracy. Converted
// by apps/web/scripts/build_hii_geo.py into public/geo/nst/hii/*.geojson.

export interface FloodMarkProps {
  /** "normal" = ordinary flood-season marks · "pabuk" = Tropical Storm Pabuk (Jan 2019). */
  set: "normal" | "pabuk";
  /** Surveyed high-water height, m MSL. */
  z: number;
}

export interface RoadLevelProps {
  /** Surveyed road/ground elevation, m MSL. */
  z: number;
  /** Survey route id (1–12). */
  route: number;
}

// Surveyed flood-mark set → StatusLevel: the Pabuk storm benchmark is critical,
// ordinary flood-season marks are watch.
export const MARK_COLOR: Record<FloodMarkProps["set"], [number, number, number]> = statusRgbMap<FloodMarkProps["set"]>({
  pabuk: "critical",
  normal: "watch",
});

/** Surveyed high-water marks — real measured flood heights off walls/poles.
 *  The ground truth every scenario level is judged against. */
export function floodMarksLayer(collection: FeatureCollection<Point, FloodMarkProps>): Layer[] {
  const feats = collection.features;
  return [
    new ScatterplotLayer<Feature<Point, FloodMarkProps>>({
      id: "flood-marks",
      data: feats,
      getPosition: (f) => f.geometry.coordinates as [number, number],
      getRadius: 26,
      radiusMinPixels: 4,
      radiusMaxPixels: 10,
      getFillColor: (f) => {
        const c = MARK_COLOR[f.properties.set] ?? MARK_COLOR.normal;
        return [c[0], c[1], c[2], 235] as [number, number, number, number];
      },
      stroked: true,
      getLineColor: [14, 14, 14, 235],
      lineWidthMinPixels: 1,
      pickable: true,
    }) as Layer,
    new TextLayer<Feature<Point, FloodMarkProps>>({
      id: "flood-mark-labels",
      // Label only the Pabuk marks (the benchmark set) — labelling all 83
      // doubles most labels since the two sets share locations.
      data: feats.filter((f) => f.properties.set === "pabuk"),
      getPosition: (f) => f.geometry.coordinates as [number, number],
      getText: (f) => `${f.properties.z.toFixed(2)} m`,
      getSize: 12,
      getColor: [255, 255, 255, 225],
      getPixelOffset: [0, -12],
      getTextAnchor: "middle",
      getAlignmentBaseline: "bottom",
      billboard: true,
      fontFamily: MAP_FONT,
      getBackgroundColor: [14, 14, 14, 160],
      background: true,
      backgroundPadding: [3, 1],
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  ];
}

// Elevation ramp for the no-scenario topography reading: low/floodable roads
// dark blue → high ground pale. Anchored to the survey's real distribution
// (p10 1.15 m · median 1.49 m · p90 2.30 m · max 6.41 m MSL).
function elevationRamp(z: number): [number, number, number, number] {
  if (z < 1.2) return [30, 64, 175, 210];   // deep blue — the lowest tenth
  if (z < 1.6) return [59, 130, 246, 190];  // blue — around the median
  if (z < 2.4) return [125, 211, 252, 170]; // pale sky — upper half
  return [226, 232, 240, 150];              // near-white — high ground
}

// Scenario coloring: depth below the scenario water level L.
function scenarioColor(z: number, levelM: number): [number, number, number, number] {
  const depth = levelM - z;
  // Submergence depth → StatusLevel.
  if (depth <= 0) return statusRgba("normal", 90);    // dry
  if (depth < 0.3) return statusRgba("watch", 210);   // shallow — passable with care
  if (depth < 0.8) return statusRgba("warning", 230); // deep — impassable for cars
  return statusRgba("critical", 240);                 // very deep
}

/**
 * Street elevation / flood-scenario layer over the ~18 k surveyed road points.
 * With no scenario level: an elevation ramp — read the city's real topography
 * along its streets. With a level L (m MSL): a static-level ("bathtub")
 * scenario — every point colored by submergence depth L − z. No flow routing;
 * honesty text lives in the layer's presets `describe` + the FloodCommand
 * panel caveat.
 */
export function streetFloodLayer(
  collection: FeatureCollection<Point, RoadLevelProps>,
  scenarioLevelM: number | null,
) {
  return new ScatterplotLayer<Feature<Point, RoadLevelProps>>({
    id: "street-flood-sim",
    data: collection.features,
    getPosition: (f) => f.geometry.coordinates as [number, number],
    getRadius: 14,
    radiusMinPixels: 1.5,
    radiusMaxPixels: 5,
    getFillColor: (f) =>
      scenarioLevelM == null
        ? elevationRamp(f.properties.z)
        : scenarioColor(f.properties.z, scenarioLevelM),
    updateTriggers: { getFillColor: [scenarioLevelM] },
    stroked: false,
    pickable: true,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });
}

/** WRF-ROMS 24-h forecast-rain cells over the province (~3 km, HII model).
 *  Where the rain is going to fall — the water arriving at the watershed. */
export function wrfRainGridLayer(grid: {
  lngMin: number;
  latMax: number;
  cellDeg: number;
  ncols: number;
  nrows: number;
  valuesMm: number[];
}) {
  const cells: { position: [number, number]; mm: number }[] = [];
  for (let r = 0; r < grid.nrows; r++) {
    for (let c = 0; c < grid.ncols; c++) {
      const mm = grid.valuesMm[r * grid.ncols + c];
      if (mm < 1) continue; // dry / NODATA cells stay invisible
      cells.push({
        // GridCellLayer takes the cell's SW corner.
        position: [grid.lngMin + c * grid.cellDeg, grid.latMax - (r + 1) * grid.cellDeg],
        mm,
      });
    }
  }
  const cellMeters = grid.cellDeg * 111_000;
  return new GridCellLayer<{ position: [number, number]; mm: number }>({
    id: "wrf-rain-grid",
    data: cells,
    getPosition: (d) => d.position,
    cellSize: cellMeters,
    extruded: false,
    getFillColor: (d) => {
      // TMD rain bands → StatusLevel; light rain is data (pale sky). Luminance
      // falls with every step so the wash reads in greyscale.
      if (d.mm >= 90) return withAlpha(CRITICAL_DEEP, 190); // violent
      if (d.mm >= 35) return statusRgba("critical", 170);   // heavy
      if (d.mm >= 10) return statusRgba("warning", 140);    // moderate
      return withAlpha(RAMP_PALE_WATER, 110);               // light
    },
    pickable: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// HERITAGE LAYERS — temples, old town, Chinese shrines
// ═══════════════════════════════════════════════════════════════════════

export interface HeritageFeatureProps {
  kind: "temple-spire" | "chinese-shrine" | "old-town-district";
  name: string;
  nameTh?: string;
  height?: number;
  era?: string;
  describe?: string;
}

/**
 * Temple spires — tall bright gold columns at known temple locations.
 * A real Thai temple's prang/chedi towers 15-50 m; this layer renders
 * it as a glowing gold column so it reads in the skyline from afar.
 * Deck.gl ScatterplotLayer with 3D emulation via thick radius + color.
 */
export function templeSpiresLayer(
  collection: FeatureCollection<Point, HeritageFeatureProps>,
) {
  const spires = collection.features.filter(
    (f) => f.properties.kind === "temple-spire" || f.properties.kind === "chinese-shrine",
  );

  // Base disk — wide amber foundation
  const base = new ScatterplotLayer<Feature<Point, HeritageFeatureProps>>({
    id: "temple-spires-base",
    data: spires,
    pickable: true,
    radiusUnits: "meters",
    getPosition: (f) => f.geometry.coordinates as [number, number],
    getRadius: (f) => f.properties.kind === "temple-spire" ? 14 : 8,
    getFillColor: withAlpha(CAT.yellow, 200),
    getLineColor: withAlpha(CAT.orange, 255),
    stroked: true,
    lineWidthMinPixels: 1.5,
  });

  // Inner spire dot — bright, small, glowing
  const spire = new ScatterplotLayer<Feature<Point, HeritageFeatureProps>>({
    id: "temple-spires-tip",
    data: spires,
    pickable: false,
    radiusUnits: "pixels",
    getPosition: (f) => f.geometry.coordinates as [number, number],
    getRadius: (f) => f.properties.kind === "temple-spire" ? 5 : 3,
    getFillColor: [255, 255, 255, 240],
    getLineColor: withAlpha(CAT.yellow, 255),
    stroked: true,
    lineWidthMinPixels: 1.5,
  });

  return [base, spire];
}

/**
 * Old town district boundary — hairline outline, warm amber fill at low
 * opacity so buildings inside remain visible but the district reads as
 * a distinct zone at all zoom levels.
 */
export function oldTownDistrictLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, HeritageFeatureProps>,
) {
  const districts = collection.features.filter(
    (f) => f.properties.kind === "old-town-district",
  );
  if (!districts.length) return null;
  return new GeoJsonLayer({
    id: "old-town-district",
    data: { type: "FeatureCollection", features: districts } as FeatureCollection,
    pickable: true,
    stroked: true,
    filled: true,
    getFillColor: withAlpha(CAT.orange, 18),   // very low opacity — just a haze
    getLineColor: withAlpha(CAT.orange, 200),
    getLineWidth: 2,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1.5,
  });
}

// ── NEWS PINS — geocoded headlines on the map ───────────────────────────
// When a news item mentions a known place (market, temple, hospital …),
// we pin it so the mayor can see "criminal activity at THIS market".

import type { IntelligenceItem } from "@nst/shared";

const NEWS_TAG_COLOR: Record<string, [number, number, number]> = {
  EM: CAT.vermil,  // emergency
  PO: CAT.blue,  // police
  FU: shade(CAT.pink, 0.3),  // funeral
  IN: CAT.sky,  // infrastructure
  BZ: CAT.orange,  // business
  PU: CAT.pink,  // public health
  FE: CAT.yellow,  // festival
  HO: CAT.green,  // honour
};

export function newsPinsLayer(items: IntelligenceItem[]) {
  const pinned = items.filter((it) => it.lat != null && it.lng != null);
  return new ScatterplotLayer<IntelligenceItem>({
    id: "news-pins",
    data: pinned,
    getPosition: (it) => [it.lng!, it.lat!],
    getRadius: (it) => {
      // Emergency / police items get bigger pins
      if (it.tags.includes("EM")) return 32;
      if (it.tags.includes("PO")) return 26;
      return 18;
    },
    radiusMinPixels: 5,
    radiusMaxPixels: 14,
    getFillColor: (it) => {
      const tag = it.tags.find((t) => t in NEWS_TAG_COLOR);
      const c = tag ? NEWS_TAG_COLOR[tag] : grey(150);
      return [c[0], c[1], c[2], 230] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [255, 255, 255, 240],
    lineWidthMinPixels: 2,
    pickable: true,
    // Subtle pulse effect via radius animation would need extra work;
    // for now the bright colour + white stroke makes them stand out.
  });
}

// ── GISTDA (Thailand Geo-Informatics & Space Technology) layers ─────────

import type { GistdaPoi, GistdaSolarBuilding, GistdaLandUse } from "@nst/shared";

const GISTDA_POI_COLOR: Record<GistdaPoi["category"], [number, number, number]> = {
  government: CAT.blue,
  school: CAT.pink,
  temple: CAT.yellow,
  hospital: CAT.vermil,
  hotel: tint(CAT.orange, 0.45),
  bank: CAT.green,
  restaurant: shade(CAT.orange, 0.3),
  shopping: CAT.orange,
  transport: CAT.sky,
  sport: tint(CAT.green, 0.45),
  agency: tint(CAT.blue, 0.5),
  other: grey(200),
};

export function gistdaPoiLayer(pois: GistdaPoi[]) {
  return new ScatterplotLayer<GistdaPoi>({
    id: "gistda-pois",
    data: pois,
    getPosition: (p) => [p.lng, p.lat],
    getRadius: (p) => {
      if (p.category === "hospital") return 28;
      if (p.category === "temple" || p.category === "hotel") return 24;
      if (p.category === "school" || p.category === "government") return 20;
      return 14;
    },
    radiusMinPixels: 4,
    radiusMaxPixels: 12,
    getFillColor: (p) => {
      const c = GISTDA_POI_COLOR[p.category] ?? [200, 200, 200];
      return [c[0], c[1], c[2], 220] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [14, 14, 14, 240],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

/**
 * Solar irradiance overlay from GISTDA LOD2 buildings.
 * Each building is rendered as a vertical column whose height is proportional
 * to solar potential (kWh/m²). Colour: blue → green → yellow → red.
 */
// Irradiance is a continuous quantity: blue → orange → yellow → pale yellow,
// each step lighter than the last (monotonic luminance, no red–green reading).
export function gistdaSolarLayer(buildings: GistdaSolarBuilding[]) {
  return new ScatterplotLayer<GistdaSolarBuilding>({
    id: "gistda-solar",
    data: buildings,
    getPosition: (b) => [b.lng, b.lat],
    getRadius: (b) => Math.max(10, Math.min(b.area / 80, 60)),
    radiusMinPixels: 3,
    radiusMaxPixels: 20,
    getFillColor: (b) => {
      const irr = b.solarIrr;
      // Blue (low) → green → yellow → red (high)
      if (irr < 80) return withAlpha(CAT.blue, 200) as [number, number, number, number];
      if (irr < 120) return withAlpha(CAT.orange, 210) as [number, number, number, number];
      if (irr < 160) return withAlpha(CAT.yellow, 220) as [number, number, number, number];
      return withAlpha(tint(CAT.yellow, 0.6), 230) as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [14, 14, 14, 200],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

const LANDUSE_COLOR: Record<string, [number, number, number]> = {
  residential: shade(CAT.orange, 0.3),
  commercial:  CAT.orange,
  industrial:  grey(150),
  agricultural:CAT.yellow,
  forest:      CAT.green,
  water:       CAT.sky,
  transport:   CAT.pink,
  recreation:  tint(CAT.green, 0.45),
  other:       grey(200),
};

export function gistdaLandUseLayer(parcels: GistdaLandUse[]) {
  return new ScatterplotLayer<GistdaLandUse>({
    id: "gistda-landuse",
    data: parcels,
    getPosition: (p) => [p.lng, p.lat],
    getRadius: (p) => Math.max(12, Math.min(p.area / 200, 80)),
    radiusMinPixels: 3,
    radiusMaxPixels: 18,
    getFillColor: (p) => {
      const code = p.code.toLowerCase();
      let key = "other";
      if (code.includes("res") || code.includes("urb")) key = "residential";
      else if (code.includes("com") || code.includes("biz")) key = "commercial";
      else if (code.includes("ind")) key = "industrial";
      else if (code.includes("agr") || code.includes("farm")) key = "agricultural";
      else if (code.includes("for") || code.includes("wood")) key = "forest";
      else if (code.includes("wat") || code.includes("riv")) key = "water";
      else if (code.includes("trans") || code.includes("road")) key = "transport";
      else if (code.includes("rec") || code.includes("park")) key = "recreation";
      const c = LANDUSE_COLOR[key] ?? LANDUSE_COLOR.other;
      return [c[0], c[1], c[2], 180] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [255, 255, 255, 160],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

// ── Isochrone layer ───────────────────────────────────────────────────────────

const ISOCHRONE_MODE_COLOR: Record<string, [number, number, number, number]> = {
  walk:                   withAlpha(CAT.blue, 60),
  bicycle:                withAlpha(CAT.green, 60),
  drive:                  withAlpha(CAT.orange, 60),
  approximated_transit:   withAlpha(CAT.pink, 60),
};

export function isochroneLayer(result: IsochroneResult | null) {
  if (!result) return null;
  const color = ISOCHRONE_MODE_COLOR[result.mode] ?? withAlpha(CAT.blue, 60);
  const [r, g, b] = color;
  // IsochroneResult.geometry is a structural Polygon/MultiPolygon union;
  // cast to the geojson package's Geometry so deck.gl's data prop accepts it.
  const geometry = result.geometry as unknown as Polygon | MultiPolygon;
  return new GeoJsonLayer({
    id: "isochrone-polygon",
    data: {
      type: "FeatureCollection" as const,
      features: [{ type: "Feature" as const, geometry, properties: {} }],
    },
    filled: true,
    stroked: true,
    getFillColor: [r, g, b, 55],
    getLineColor: [r, g, b, 200],
    getLineWidth: 2,
    lineWidthMinPixels: 1.5,
    pickable: false,
    updateTriggers: { getFillColor: [result.mode], getLineColor: [result.mode] },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// YALA — circular-city signature, hydrology, Deep South security
// ═══════════════════════════════════════════════════════════════════════

interface RingRoadProps {
  id: string;
  name: string | null;
  nameEn: string | null;
  nameTh: string | null;
  highway: string;
  priority: number;
  ring: boolean;
}

/**
 * Ring roads (Wongwian) — Yala's defining signature. The concentric ring
 * roads + radial spokes that fan out from the central roundabout. Rendered
 * bright amber so the circular street grid pops; ring ways are thicker/whiter.
 */
export function ringRoadsLayer(collection: FeatureCollection<LineString, RingRoadProps>) {
  return new GeoJsonLayer({
    id: "ring-roads",
    data: collection as unknown as FeatureCollection,
    stroked: true,
    filled: false,
    pickable: true,
    getLineColor: ((f: Feature<LineString, RingRoadProps>) =>
      f.properties.ring
        ? (withAlpha(tint(CAT.yellow, 0.5), 255) as [number, number, number, number]) // ring
        : (withAlpha(CAT.yellow, 220) as [number, number, number, number])) as unknown as [number, number, number, number],
    getLineWidth: ((f: Feature<LineString, RingRoadProps>) => {
      if (f.properties.ring) return 5;
      return f.properties.priority >= 5 ? 4 : f.properties.priority >= 4 ? 3 : 2;
    }) as unknown as number,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1.5,
    lineWidthMaxPixels: 7,
    updateTriggers: { getLineColor: [], getLineWidth: [] },
  });
}

/**
 * Pattani River flood corridor — translucent blue buffer polygon around the
 * river centreline. Reads as "the area that goes under when the river rises".
 */
export function riverBufferLayer(collection: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>) {
  return new GeoJsonLayer({
    id: "river-buffer",
    data: collection,
    stroked: true,
    filled: true,
    pickable: true,
    getFillColor: withAlpha(CAT.sky, 55),
    getLineColor: withAlpha(CAT.sky, 180),
    getLineWidth: 1.5,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
  });
}

// Rough centroid of a (multi)polygon — average of outer-ring vertices. Good
// enough for placing a label inside an admin boundary.
function polygonCentroid(geom: Polygon | MultiPolygon): [number, number] {
  const rings = geom.type === "Polygon" ? [geom.coordinates[0]] : geom.coordinates.map((p) => p[0]);
  let x = 0, y = 0, n = 0;
  for (const ring of rings) {
    for (const [lng, lat] of ring) { x += lng; y += lat; n++; }
  }
  return n ? [x / n, y / n] : [101.28, 6.54];
}

// ── Deep South conflict — AGGREGATE choropleth (never individual incidents) ──
// Ethical-display rule from the Yala Data Bible: province/district shading only,
// neutral framing, monthly aggregate. Shares = % of all Deep South conflict
// incidents since 2004 (Deep South Watch lineage).
const CONFLICT_SHARE: Record<string, number> = {
  Narathiwat: 36,
  Pattani: 33,
  Yala: 28,
  Songkhla: 3,
};
function conflictColor(share: number): [number, number, number, number] {
  // Critical hue, opacity ramp by intensity (max ~36)
  const t = Math.min(share / 36, 1);
  return statusRgba("critical", 70 + Math.round(120 * t));
}
export function conflictChoroplethLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>,
) {
  const labelPoints = collection.features.map((f) => {
    const name = String((f.properties as { name?: string })?.name ?? "");
    const share = CONFLICT_SHARE[name] ?? 0;
    return { name, share, position: polygonCentroid(f.geometry) };
  });
  return [
    new GeoJsonLayer({
      id: "conflict-choropleth",
      data: collection,
      stroked: true,
      filled: true,
      pickable: true,
      getFillColor: (f) => conflictColor(CONFLICT_SHARE[String((f.properties as { name?: string })?.name ?? "")] ?? 0),
      getLineColor: statusRgba("critical", 200),
      getLineWidth: 1.5,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
    }),
    new TextLayer({
      id: "conflict-choropleth-labels",
      data: labelPoints.filter((p) => p.share > 0),
      getPosition: (p: { position: [number, number] }) => p.position,
      getText: (p: { name: string; share: number }) => `${p.name}\n${p.share}%`,
      getSize: 12,
      getColor: withAlpha(INK_LIGHT, 235),
      fontFamily: MAP_FONT,
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      background: true,
      getBackgroundColor: [14, 14, 14, 170],
      backgroundPadding: [4, 2],
    }),
  ];
}

// ── MPI poverty — district choropleth (TPMAP) ───────────────────────────────
const YALA_PROVINCE_MPI = 20.83; // % below the multidimensional poverty line
function povertyColor(mpi: number): [number, number, number, number] {
  const t = Math.min(mpi / 30, 1); // ramp to 30%
  return withAlpha(CAT.pink, 60 + Math.round(120 * t));
}
export function povertyChoroplethLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>,
) {
  return new GeoJsonLayer({
    id: "poverty-choropleth",
    data: collection,
    stroked: true,
    filled: true,
    pickable: true,
    // Per-district TPMAP rates are not yet wired; shade at the province MPI so
    // the lens reads honestly. Uses properties.mpi if a future feed supplies it.
    getFillColor: (f) => povertyColor(Number((f.properties as { mpi?: number })?.mpi ?? YALA_PROVINCE_MPI)),
    getLineColor: withAlpha(CAT.pink, 200),
    getLineWidth: 1.2,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
  });
}

// ── Flood gauges (river / canal water-level stations) ───────────────────────
// FloodGauge status → StatusLevel (flood = overbank = critical).
export const GAUGE_COLOR: Record<FloodGauge["status"], [number, number, number]> = statusRgbMap<FloodGauge["status"]>({
  normal: "normal",
  watch: "watch",
  warning: "warning",
  flood: "critical",
  unknown: "unknown",
});

export function floodGaugesLayer(gauges: FloodGauge[]) {
  return new ScatterplotLayer<FloodGauge>({
    id: "flood-gauges",
    data: gauges,
    getPosition: (g) => [g.lng, g.lat],
    getRadius: (g) => (g.status === "flood" || g.status === "warning" ? 90 : 60),
    radiusMinPixels: 6,
    radiusMaxPixels: 18,
    getFillColor: (g) => {
      const c = GAUGE_COLOR[g.status] ?? GAUGE_COLOR.unknown;
      return [c[0], c[1], c[2], 230] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [14, 14, 14, 255],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

// ── Bang Lang Dam status (single station, upstream) ─────────────────────────
// Dam / runoff status → StatusLevel. Low runoff is not a flood concern, so it
// reads normal (the tooltip keeps the low/normal distinction); spilling is critical.
export const DAM_COLOR: Record<DamStatus["status"], [number, number, number]> = statusRgbMap<DamStatus["status"]>({
  low: "normal",
  normal: "normal",
  high: "warning",
  spilling: "critical",
  unknown: "unknown",
});

export function damStatusLayer(dams: DamStatus[]) {
  return new ScatterplotLayer<DamStatus>({
    id: "dam-status",
    data: dams,
    getPosition: (d) => [d.lng, d.lat],
    getRadius: 140,
    radiusMinPixels: 9,
    radiusMaxPixels: 26,
    getFillColor: (d) => {
      const c = DAM_COLOR[d.status] ?? DAM_COLOR.unknown;
      return [c[0], c[1], c[2], 230] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [255, 255, 255, 230],
    lineWidthMinPixels: 2.5,
    pickable: true,
  });
}

// ── Live sensor telemetry dots (ported from FloodDash paint.js) ─────────────
// HII situation level → StatusLevel: 5 overbank = critical, 4 high = warning,
// 1–3 (drought / low / normal) = normal. Drought is a water-supply signal, not
// a flood one — painting it watch would make the flood map cry wolf in the dry
// season; the tooltip still names the level. Every dot is pickable — the whole
// point is hover → live reading.
export const SITUATION_RGB: Record<number, [number, number, number]> = statusRgbMap<number>({
  1: "normal",
  2: "normal",
  3: "normal",
  4: "warning",
  5: "critical",
});

/**
 * All HII/RID telemetry water-level stations, coloured by the SAME judgement
 * the headline card and LEVEL WATCH use (lib/levelWatch.judgeGauge): over
 * bank / at RID critical = critical, ≥ 90 % full or within 0.5 m = warning,
 * ≥ 80 % or within 1 m = watch, otherwise normal. Colouring by HII situation
 * level alone painted a 97 %-full channel green while the rail called it
 * near capacity.
 */
export function gaugeStatusLevel(g: WaterGauge): "normal" | "watch" | "warning" | "critical" {
  const v = judgeGauge(g);
  return v ? v.level : "normal";
}

export function waterGaugesLayer(gauges: WaterGauge[]) {
  return new ScatterplotLayer<WaterGauge>({
    id: "water-gauges",
    data: gauges,
    getPosition: (g) => [g.lng, g.lat],
    // Alerting stations read bigger from a province-wide zoom.
    getRadius: (g) => {
      const lvl = gaugeStatusLevel(g);
      return lvl === "critical" ? 170 : lvl === "warning" ? 130 : lvl === "watch" ? 100 : 70;
    },
    radiusMinPixels: 5,
    radiusMaxPixels: 16,
    getFillColor: (g) => statusRgba(gaugeStatusLevel(g), 235),
    stroked: true,
    getLineColor: [255, 255, 255, 220],
    lineWidthMinPixels: 1.5,
    pickable: true,
    updateTriggers: { getFillColor: gauges, getRadius: gauges },
  });
}

/**
 * Water-level concentration heatmap — FloodDash intensity wash so operators
 * see WHERE the network is stressing, not only discrete station dots.
 * Weight = channel fullness (or situation level fallback).
 */
export function waterLevelHeatmapLayer(gauges: WaterGauge[]) {
  return new HeatmapLayer<WaterGauge>({
    id: "water-heatmap",
    data: gauges,
    getPosition: (g) => [g.lng, g.lat],
    getWeight: (g) => {
      if (g.fullnessPct != null && Number.isFinite(g.fullnessPct)) {
        return Math.min(1, Math.max(0.05, g.fullnessPct / 120));
      }
      return Math.min(1, Math.max(0.08, g.situationLevel / 5));
    },
    radiusPixels: 52,
    intensity: 1.35,
    threshold: 0.03,
    aggregation: "SUM",
    colorRange: [
      // Channel fullness: pale water → watch → warning → critical (darker = fuller).
      withAlpha(RAMP_PALE_WATER, 0),
      withAlpha(RAMP_PALE_WATER, 110),
      statusRgba("watch", 170),
      statusRgba("warning", 210),
      statusRgba("critical", 235),
      withAlpha(CRITICAL_DEEP, 255),
    ],
  });
}

/** Mobile-safe substitute when HeatmapLayer float textures fail to compile. */
export function waterLevelDensityFallbackLayer(gauges: WaterGauge[]) {
  return new ScatterplotLayer<WaterGauge>({
    id: "water-heatmap",
    data: gauges,
    getPosition: (g) => [g.lng, g.lat],
    getRadius: (g) => {
      const w =
        g.fullnessPct != null
          ? Math.min(1, Math.max(0.05, g.fullnessPct / 120))
          : Math.min(1, Math.max(0.08, g.situationLevel / 5));
      return 40 + w * 160;
    },
    radiusMinPixels: 4,
    radiusMaxPixels: 22,
    getFillColor: (g) => {
      const w =
        g.fullnessPct != null
          ? Math.min(1, Math.max(0.05, g.fullnessPct / 120))
          : Math.min(1, Math.max(0.08, g.situationLevel / 5));
      if (w >= 0.85) return statusRgba("critical", 170);
      if (w >= 0.65) return statusRgba("warning", 150);
      if (w >= 0.4) return statusRgba("watch", 130);
      return withAlpha(RAMP_PALE_WATER, 110);
    },
    stroked: false,
    pickable: false,
  });
}

/**
 * Air / PM2.5 concentration heatmap — AirDash field view over Air4Thai +
 * AQICN points. Yellow→red Lichtenstein read: where the air is thick.
 */
export function airPm25HeatmapLayer(stations: AirQualityPoint[]) {
  const data = stations.filter((s) => s.pm25 != null || s.aqi != null);
  return new HeatmapLayer<AirQualityPoint>({
    id: "air-heatmap",
    data,
    getPosition: (s) => [s.lng, s.lat],
    getWeight: (s) => {
      if (s.pm25 != null && Number.isFinite(s.pm25)) {
        return Math.min(1, Math.max(0.05, s.pm25 / 150));
      }
      if (s.aqi != null && Number.isFinite(s.aqi)) {
        return Math.min(1, Math.max(0.05, s.aqi / 200));
      }
      return 0;
    },
    radiusPixels: 64,
    intensity: 1.25,
    threshold: 0.04,
    aggregation: "SUM",
    colorRange: [
      // PM2.5 bands (see bmaAqStationsLayer); pale good → watch → warning →
      // critical → deep, luminance falling at every stop.
      withAlpha(RAMP_PALE_GOOD, 0),
      statusRgba("watch", 120),
      statusRgba("warning", 180),
      statusRgba("critical", 220),
      withAlpha(CRITICAL_DEEP, 255),
    ],
  });
}

export function airPm25DensityFallbackLayer(stations: AirQualityPoint[]) {
  const data = stations.filter((s) => s.pm25 != null || s.aqi != null);
  return new ScatterplotLayer<AirQualityPoint>({
    id: "air-heatmap",
    data,
    getPosition: (s) => [s.lng, s.lat],
    getRadius: (s) => {
      const w =
        s.pm25 != null
          ? Math.min(1, Math.max(0.05, s.pm25 / 150))
          : s.aqi != null
            ? Math.min(1, Math.max(0.05, s.aqi / 200))
            : 0.1;
      return 50 + w * 180;
    },
    radiusMinPixels: 5,
    radiusMaxPixels: 26,
    getFillColor: (s) => {
      const v = s.pm25 ?? (s.aqi != null ? s.aqi * 0.6 : 0);
      if (v > 150) return withAlpha(CRITICAL_DEEP, 180);
      if (v > 55) return statusRgba("critical", 160);
      if (v > 35) return statusRgba("warning", 140);
      if (v > 12) return statusRgba("watch", 130);
      return withAlpha(RAMP_PALE_GOOD, 100);
    },
    stroked: false,
    pickable: false,
  });
}

/** Rain telemetry: dot area grows with 24 h accumulation (FloodDash 2+√mm). */
export function rainStationsLayer(stations: RainfallStation[]) {
  return new ScatterplotLayer<RainfallStation>({
    id: "rain-stations",
    data: stations,
    getPosition: (r) => [r.lng, r.lat],
    getRadius: (r) => 40 + Math.min(220, Math.sqrt(Math.max(0, r.rain24h ?? 0)) * 26),
    radiusMinPixels: 2.5,
    radiusMaxPixels: 20,
    getFillColor: (r) => {
      const mm = r.rain24h ?? 0;
      // TMD bands → StatusLevel: ≥90 very heavy = critical, ≥35 heavy = warning;
      // lighter rain is data (sky), and dry stations fade back so wet cells pop.
      if (mm >= 90) return statusRgba("critical", 235);
      if (mm >= 35) return statusRgba("warning", 225);
      if (mm >= 1) return withAlpha(CAT.sky, 200);
      return withAlpha(CAT.sky, 70);
    },
    stroked: true,
    getLineColor: [255, 255, 255, 150],
    lineWidthMinPixels: 0.8,
    pickable: true,
  });
}

/** GISTDA SAR flood footprint, Nov 2025 — flooded area per tambon. A quiet
 *  wash (the footprint is context, the gauges are the signal) with a thin
 *  outline so adjacent tambons stay distinguishable; alpha scales gently with
 *  how much of the tambon flooded so the worst-hit read darker. */
export function floodExtentLayer(tambons: GistdaFloodExtentTambon[]) {
  const maxRai = Math.max(1, ...tambons.map((t) => t.floodAreaRai ?? 0));
  return new PolygonLayer<GistdaFloodExtentTambon>({
    id: "flood-extent-2025",
    data: tambons,
    getPolygon: (t) => t.rings,
    getFillColor: (t) => {
      const frac = Math.min(1, (t.floodAreaRai ?? 0) / maxRai);
      return statusRgba("warning", 40 + Math.round(frac * 60));
    },
    getLineColor: statusRgba("warning", 150),
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    stroked: true,
    filled: true,
    pickable: true,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });
}

/** GISTDA water-level posts (เสาระดับ staff gauges + small telemetry) — the
 *  physical posts the municipal WL cameras watch. Hollow rings so they read
 *  as "a measuring point on the line", distinct from the filled gauge dots. */
export function levelPostsLayer(posts: GistdaLevelPost[]) {
  return new ScatterplotLayer<GistdaLevelPost>({
    id: "level-posts",
    data: posts,
    getPosition: (p) => [p.lng, p.lat],
    getRadius: (p) => (p.kind === "telemetry" ? 70 : 55),
    radiusMinPixels: 3,
    radiusMaxPixels: 9,
    getFillColor: withAlpha(CAT.sky, 60),
    stroked: true,
    getLineColor: withAlpha(CAT.sky, 235),
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

// DWR EWS alert status → StatusLevel: 0 normal · 1 watch · 2 prepare = warning · 3 siren = critical.
export const EWS_STATUS_RGB: Record<number, [number, number, number]> = statusRgbMap<number>({
  0: "normal",
  1: "watch",
  2: "warning",
  3: "critical",
});

/** DWR community early-warning stations — the ones that trigger village sirens. */
export function ewsStationsLayer(stations: EwsStation[]) {
  return new ScatterplotLayer<EwsStation>({
    id: "ews-stations",
    data: stations,
    getPosition: (e) => [e.lng, e.lat],
    getRadius: (e) => (e.status >= 2 ? 130 : e.status >= 1 ? 90 : 55),
    radiusMinPixels: 3.5,
    radiusMaxPixels: 15,
    getFillColor: (e) => {
      const c = EWS_STATUS_RGB[e.status] ?? EWS_STATUS_RGB[0];
      return [c[0], c[1], c[2], e.status >= 1 ? 235 : 150] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: (e) => (e.status >= 2 ? [255, 255, 255, 240] : [255, 255, 255, 120]),
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

// ── Watershed upstream→city nodes (Tha Dee flow cascade) ───────────────────
// Renders the upstream→city flow path the city's flood risk is built from:
// the Tha Dee canal cascade คีรีวง → ลานสกา → city, plus the Thung Song SW
// node. A flow line connects the Tha Dee nodes; dots are coloured by live
// status; labels carry the Thai/EN name. Makes the cascade geographic, not
// just tabular — managers see WHERE the water is coming from.

interface WatershedMarker {
  key: string;
  name: string;
  nameEn: string;
  role: string;
  river: string;
  status: string;        // ZoneStatus label (flat for tooltip)
  statusLabel: string;
  rgb: [number, number, number];
  isCity: boolean;
  lng: number;
  lat: number;
  levelM: number | null;
  toBankM: number | null;  // freeboard (positive) when below bank
  rain24h: number | null;
  soil: number | null;
  /** Estimated lead-time from this zone to the city, in hours. The visible
   *  "ETA" pill on the map marker. `null` for the city itself. */
  etaH: number | null;
  /** Channel distance (km) used to compute the ETA — surfaced in tooltips. */
  etaChannelKm: number | null;
  /** Linked basin's stress band (from the FloodDash water-balance ledger).
   *  Drives both the verdict pill on the marker and the colour of the
   *  flow line. `undefined` = no live ledger yet for this basin. */
  basinBand: "ok" | "tight" | "overflow" | "unknown" | undefined;
  /** Verdict text from the linked basin's first horizon (English). */
  basinVerdict: string | null;
}

/** Basin stress band → StatusLevel: ok = normal, tight = watch (--warn, as in
 *  WaterBalancePanel), overflow = critical. Same vocabulary as the side panel
 *  so the on-map flow line and the panel read identically. */
export const BASIN_BAND_RGB: Record<"ok" | "tight" | "overflow" | "unknown", [number, number, number]> =
  statusRgbMap<"ok" | "tight" | "overflow" | "unknown">({
    ok: "normal",
    tight: "watch",
    overflow: "critical",
    unknown: "unknown",
  });

function toMarker(s: ZoneSummary, basinBand?: "ok" | "tight" | "overflow" | "unknown", basinVerdict?: string | null): WatershedMarker {
  // When the FloodDash water-balance ledger has a verdict for this zone's
  // basin, that verdict dominates the marker colour — it's the modelled
  // 24-72h answer, not just the observational "what's the river doing right
  // now" status. So an "ok" status with an "overflow" band paints red.
  const rgb = basinBand ? BASIN_BAND_RGB[basinBand] : ZONE_STATUS_RGB[s.status];
  const lt = leadTimeToCity(s.zone.key);
  return {
    key: s.zone.key,
    name: s.zone.th,
    nameEn: s.zone.en,
    role: s.zone.role,
    river: s.zone.river,
    status: s.status,
    statusLabel: ZONE_STATUS_LABEL[s.status],
    rgb,
    isCity: !!s.zone.isCity,
    lng: s.zone.lng,
    lat: s.zone.lat,
    levelM: s.levelMsl,
    toBankM: s.diffFromBank != null ? -s.diffFromBank : null,
    rain24h: s.rain24h,
    soil: s.soil,
    etaH: lt ? Math.round(((lt.minH + lt.maxH) / 2) * 10) / 10 : null,
    etaChannelKm: lt ? Math.round(lt.channelKm * 10) / 10 : null,
    basinBand,
    basinVerdict: basinVerdict ?? null,
  };
}

/** The Tha Dee cascade flow path (Khiri Wong → Lan Saka → City), in flow order.
 *  Shared by the static flow line below AND the animated flow dots
 *  (map/useFlowAnimation.ts) — one source, so they can never draw a different
 *  path from each other. */
export function thaDeeFlowPath(summaries: ZoneSummary[]): [number, number][] {
  return summaries.filter(isThaDeeZone).map((s) => [s.zone.lng, s.zone.lat] as [number, number]);
}

// ── FLOW INFO GRAPHIC — the on-map "how the water is moving" info graphic ──
//
// Where watershedNodesLayer renders the *nodes* (gauges, basin summary), this
// renders the *flow itself* on the actual rivers: two PathLayers per cascade
// segment (a wide semi-transparent "river band" coloured by basin stress, and
// a thin bright centre line), plus inline ETA + discharge labels at each
// segment midpoint so an operator can answer "where is the wave, how fast,
// how much, when does it arrive" by glancing at the map.

interface FlowSegment {
  name: string;
  /** Endpoints in flow order, encoded flat as [ax, ay, bx, by]. */
  path: [number, number, number, number];
  midLng: number;
  midLat: number;
  /** Lead-time (hours) from the upstream end of the segment to the city. */
  etaH: number | null;
  /** Short upstream readout (mm/24h or "—"); surfaced for inline label. */
  upstreamDischargeLabel: string | null;
  /** Combined status (worst of the two endpoints), drives band colour. */
  status: "normal" | "watch" | "high" | "overbank" | "unknown";
  /** 0..3 — drives band width on the map (overflow = widest). */
  severityRank: 0 | 1 | 2 | 3;
}

/** Build per-segment rows from the cascade summaries + basin balance. */
function buildFlowSegments(
  summaries: ZoneSummary[],
  basinBalance: BasinWaterBalance[] | undefined,
): FlowSegment[] {
  const pathZones = summaries.filter(isThaDeeZone);
  if (pathZones.length < 2) return [];
  const bandByBasin = new Map<string, BasinStressBandLike>();
  if (basinBalance) {
    for (const b of basinBalance) {
      const h0 = b.horizons[0];
      if (h0) bandByBasin.set(b.basinId, h0.band);
    }
  }
  const statusOf = (s: ZoneSummary): FlowSegment["status"] => {
    const bv = s.zone.basinId ? bandByBasin.get(s.zone.basinId) : undefined;
    if (bv === "overflow") return "overbank";
    if (bv === "tight") return "high";
    if (bv === "ok") return "normal";
    if (s.status === "flood") return "overbank";
    if (s.status === "high") return "high";
    if (s.status === "watch") return "watch";
    if (s.status === "normal") return "normal";
    return "unknown";
  };
  const rankOf = (st: FlowSegment["status"]): 0 | 1 | 2 | 3 =>
    st === "overbank" ? 3 : st === "high" ? 2 : st === "watch" ? 1 : st === "normal" ? 0 : 0;
  const segments: FlowSegment[] = [];
  for (let i = 0; i < pathZones.length - 1; i++) {
    const a = pathZones[i]!;
    const b = pathZones[i + 1]!;
    const sa = statusOf(a);
    const sb = statusOf(b);
    const segStatus: FlowSegment["status"] =
      rankOf(sa) >= rankOf(sb) ? sa : sb;
    const lt = leadTimeToCity(a.zone.key);
    const etaH = lt ? Math.round(((lt.minH + lt.maxH) / 2) * 10) / 10 : null;
    const upstreamDischargeLabel = a.rain24h != null ? `${a.rain24h.toFixed(0)}mm/24h` : null;
    segments.push({
      name: `${a.zone.en} → ${b.zone.en}`,
      path: [a.zone.lng, a.zone.lat, b.zone.lng, b.zone.lat],
      midLng: (a.zone.lng + b.zone.lng) / 2,
      midLat: (a.zone.lat + b.zone.lat) / 2,
      etaH,
      upstreamDischargeLabel,
      status: segStatus,
      severityRank: Math.max(rankOf(sa), rankOf(sb)) as 0 | 1 | 2 | 3,
    });
  }
  return segments;
}

const FLOW_BAND_RGB: Record<FlowSegment["status"], [number, number, number]> = {
  normal: BASIN_BAND_RGB.ok,
  watch: [232, 168, 36],
  high: [224, 90, 36],
  overbank: BASIN_BAND_RGB.overflow,
  unknown: [125, 125, 125],
};

interface FlowSegmentRow extends FlowSegment {
  pathFeature: { path: [number, number][] };
}

/** On-map "how is the water moving" info graphic. Renders the cascade as
 *  variable-width river bands (width = severity rank) plus inline ETA +
 *  upstream-readout labels. Floats above watershed-nodes for prominence. */
export function flowInfoGraphicLayer(
  summaries: ZoneSummary[],
  basinBalance?: BasinWaterBalance[],
): Layer[] {
  const segments = buildFlowSegments(summaries, basinBalance);
  if (segments.length === 0) return [];
  const bandWidth: Record<0 | 1 | 2 | 3, number> = { 0: 6, 1: 9, 2: 13, 3: 18 };
  const centreWidth: Record<0 | 1 | 2 | 3, number> = { 0: 1.6, 1: 2.2, 2: 2.8, 3: 3.4 };
  const rows: FlowSegmentRow[] = segments.map((s) => ({
    ...s,
    pathFeature: { path: [[s.path[0], s.path[1]], [s.path[2], s.path[3]]] },
  }));
  const basinKey = basinBalance?.map((b) => `${b.basinId}:${b.horizons[0]?.band}`).join("|") ?? "";
  return [
    new PathLayer<FlowSegmentRow>({
      id: "flow-info-band",
      data: rows,
      getPath: (d) => d.pathFeature.path,
      getColor: (d) => {
        const c = FLOW_BAND_RGB[d.status];
        return [c[0], c[1], c[2], 110] as [number, number, number, number];
      },
      getWidth: (d) => bandWidth[d.severityRank],
      widthUnits: "pixels",
      widthMinPixels: 4,
      capRounded: true,
      jointRounded: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
      updateTriggers: { getColor: [basinKey], getWidth: [basinKey] },
    }) as Layer,
    new PathLayer<FlowSegmentRow>({
      id: "flow-info-centre",
      data: rows,
      getPath: (d) => d.pathFeature.path,
      getColor: (d) => {
        const c = FLOW_BAND_RGB[d.status];
        return [c[0], c[1], c[2], 235] as [number, number, number, number];
      },
      getWidth: (d) => centreWidth[d.severityRank],
      widthUnits: "pixels",
      widthMinPixels: 1.5,
      capRounded: true,
      jointRounded: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
      updateTriggers: { getColor: [basinKey] },
    }) as Layer,
    new TextLayer<FlowSegmentRow>({
      id: "flow-info-eta",
      data: rows,
      getPosition: (d) => [d.midLng, d.midLat],
      getText: (d) => {
        const eta = d.etaH != null ? `ETA ${d.etaH.toFixed(1)}h` : "ETA —";
        const up = d.upstreamDischargeLabel ? ` · ${d.upstreamDischargeLabel}` : "";
        return `${eta}${up}`;
      },
      getSize: 11,
      getColor: (d) => {
        const c = FLOW_BAND_RGB[d.status];
        return [c[0], c[1], c[2], 240] as [number, number, number, number];
      },
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      billboard: true,
      fontFamily: "'Inter', 'IBM Plex Sans Thai', sans-serif",
      fontWeight: "bold",
      getBackgroundColor: [10, 14, 20, 215],
      background: true,
      backgroundPadding: [4, 1],
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  ];
}

/** Pak Phanang Bay — exit point where the Tha Dee canal reaches the Gulf of
 *  Thailand. Anchors the on-map water system picture. Coordinates are
 *  approximate — Pak Chong subdistrict mouth — keeps the picture aligned
 *  with the city's east axis. Re-exported from @nst/shared so multiple
 *  modules agree on a single source of truth. */
import { PAK_PHANANG_BAY_CENTROID as SHARED_BAY_CENTROID } from "@nst/shared";
export const PAK_PHANANG_BAY_CENTROID = SHARED_BAY_CENTROID;

/** On-map "how is the water moving" picture — picture-book framing anchored
 *  in the cascade's real geography. Three picture elements rendered as small
 *  polygon/path layers at real lng/lat:
 *
 *    ⛰ Khao Luang (3 overlapping triangles) at Khiri Wong's gauge,
 *    🏙 NST City (cluster of building blocks) at the city centroid,
 *    🌊 Pak Phanang Bay (4 stacked waves) east of the city.
 *
 *  Plus bilingual EN/TH labels for each waypoint. The picture elements
 *  render as muted ink so they read as background context, not foreground
 *  alerts; status colour lives on the connecting river bands (rendered by
 *  flowInfoGraphicLayer) so the eye still sees the cascade's mood at a
 *  glance.
 *
 *  Always safe: returns [] when summaries don't have a Khiri Wong + city.
 *  Layer ids are deterministic so the user can toggle via the layer
 *  palette without surprises.
 */
export function waterSystemPictureLayer(summaries: ZoneSummary[]): Layer[] {
  const khiriWong = summaries.find((s) => s.zone.key === "khiri-wong");
  const city = summaries.find((s) => s.zone.isCity);
  if (!khiriWong || !city) return [];

  const mountainAnchor: [number, number] = [khiriWong.zone.lng, khiriWong.zone.lat];
  const cityAnchor: [number, number] = [city.zone.lng, city.zone.lat];
  const bayAnchor: [number, number] = [PAK_PHANANG_BAY_CENTROID.lng, PAK_PHANANG_BAY_CENTROID.lat];

  // Approx 1° lat ≈ 111 km. SCALE in degrees sets the picture at the
  // right size for a city/province zoom — small enough to read but big
  // enough to anchor at the real geographic point.
  const SCALE = 0.04;       // ~4.4 km peak-to-peak
  const SCALE_H = SCALE * 0.55;

  // ── 1. Khao Luang — 3 overlapping triangles anchored at KW ───────────
  const khaoLuangPeaks: [number, number][] = [
    // leftmost
    [
      mountainAnchor[0] - SCALE, mountainAnchor[1] + SCALE_H * 0.4,
    ],
    [
      mountainAnchor[0] - SCALE * 0.5, mountainAnchor[1] - SCALE_H,
    ],
    [
      mountainAnchor[0] - SCALE * 0.1, mountainAnchor[1] + SCALE_H * 0.4,
    ],
    // middle (tallest)
    [
      mountainAnchor[0] - SCALE * 0.4, mountainAnchor[1] + SCALE_H * 0.4,
    ],
    [
      mountainAnchor[0] + SCALE * 0.1, mountainAnchor[1] - SCALE_H * 1.5,
    ],
    [
      mountainAnchor[0] + SCALE * 0.55, mountainAnchor[1] + SCALE_H * 0.4,
    ],
    // rightmost
    [
      mountainAnchor[0] + SCALE * 0.2, mountainAnchor[1] + SCALE_H * 0.4,
    ],
    [
      mountainAnchor[0] + SCALE * 0.6, mountainAnchor[1] - SCALE_H * 0.6,
    ],
    [
      mountainAnchor[0] + SCALE * 0.95, mountainAnchor[1] + SCALE_H * 0.4,
    ],
  ];

  const khaoLuangMountain: Layer = new PolygonLayer<{ polygon: [number, number][] }>({
    id: "water-picture-khao-luang",
    data: [{ polygon: khaoLuangPeaks }],
    getPolygon: (d) => d.polygon,
    getFillColor: withAlpha(grey(190), 200),
    getLineColor: withAlpha(grey(140), 230),
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    stroked: true,
    filled: true,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });

  // ── 2. NST City silhouette — cluster of building blocks ─────────────
  type Block = { polygon: [number, number][] };
  function block(xOff: number, hFrac: number): Block {
    const w = SCALE * 0.18;
    const h = SCALE_H * hFrac;
    const x0 = cityAnchor[0] + xOff * SCALE;
    const y0 = cityAnchor[1] - SCALE_H * 0.3 - h;
    return {
      polygon: [
        [x0, y0],
        [x0 + w, y0],
        [x0 + w, y0 + h],
        [x0, y0 + h],
        [x0, y0],
      ],
    };
  }
  const cityBlocks: Block[] = [
    block(-0.55, 0.6),
    block(-0.36, 1.0),
    block(-0.18, 0.55),
    block(0.0,   0.85),
    block(0.18,  0.5),
  ];
  const cityLayer: Layer = new PolygonLayer<Block>({
    id: "water-picture-city",
    data: cityBlocks,
    getPolygon: (d) => d.polygon,
    getFillColor: withAlpha(grey(180), 220),
    getLineColor: withAlpha(grey(110), 230),
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    stroked: true,
    filled: true,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });

  // ── 3. Bay wash + wave lines, east of the city ───────────────────────
  const bayWash: Layer = new PolygonLayer<{ polygon: [number, number][] }>({
    id: "water-picture-bay-wash",
    data: [{
      polygon: [
        [bayAnchor[0] - SCALE * 0.9, bayAnchor[1] - SCALE_H * 0.5],
        [bayAnchor[0] + SCALE * 0.9, bayAnchor[1] - SCALE_H * 0.5],
        [bayAnchor[0] + SCALE * 0.9, bayAnchor[1] + SCALE_H * 1.4],
        [bayAnchor[0] - SCALE * 0.9, bayAnchor[1] + SCALE_H * 1.4],
        [bayAnchor[0] - SCALE * 0.9, bayAnchor[1] - SCALE_H * 0.5],
      ],
    }],
    getPolygon: (d) => d.polygon,
    getFillColor: withAlpha([56, 119, 174], 36),
    getLineColor: [0, 0, 0, 0],
    stroked: false,
    filled: true,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });

  const waveCount = 4;
  const bayWavePaths = Array.from({ length: waveCount }, (_, i) => {
    const dy = SCALE_H * 0.35 + i * SCALE_H * 0.35;
    const halfW = SCALE * 0.7;
    const startLng = bayAnchor[0] - halfW;
    const segments = 12;
    const path: [number, number][] = [];
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const lng = startLng + t * halfW * 2;
      const ampFrac = 1 - Math.abs(t - 0.5) * 0.6;
      const amp = (SCALE_H * 0.25) * ampFrac;
      const lat = bayAnchor[1] + dy + Math.sin(t * Math.PI * 2) * amp;
      path.push([lng, lat]);
    }
    return { id: `wave-${i}`, path };
  });
  const bayLayer: Layer = new PathLayer<{ path: [number, number][] }>({
    id: "water-picture-bay",
    data: bayWavePaths,
    getPath: (d) => d.path,
    getColor: withAlpha([110, 156, 200], 220),
    getWidth: 2.4,
    widthUnits: "pixels",
    widthMinPixels: 1.5,
    capRounded: true,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });

  // ── 4. Labels (mountain / city / bay) — bilingual EN above TH below ──
  const labels: Layer[] = [
    new TextLayer<{ position: [number, number]; text: string }>({
      id: "water-picture-labels-en",
      data: [
        { position: [mountainAnchor[0], mountainAnchor[1] + SCALE_H * 0.8], text: "KHAO LUANG" },
        { position: [cityAnchor[0], cityAnchor[1] + SCALE_H * 0.95], text: "NST CITY" },
        { position: [bayAnchor[0], bayAnchor[1] + SCALE_H * 1.65], text: "PAK PHANANG BAY" },
      ],
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: 10,
      getColor: withAlpha(grey(110), 240),
      fontFamily: "'Inter', 'IBM Plex Sans Thai', sans-serif",
      fontWeight: "bold",
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      getBackgroundColor: [10, 14, 20, 200],
      background: true,
      backgroundPadding: [3, 1],
      billboard: true,
      pickable: false,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }),
    new TextLayer<{ position: [number, number]; text: string }>({
      id: "water-picture-labels-th",
      data: [
        { position: [mountainAnchor[0], mountainAnchor[1] + SCALE_H * 1.05], text: "เขาหลวง" },
        { position: [cityAnchor[0], cityAnchor[1] + SCALE_H * 1.20], text: "เมืองนครศรีธรรมราช" },
        { position: [bayAnchor[0], bayAnchor[1] + SCALE_H * 1.95], text: "อ่าวปากพนัง" },
      ],
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: 9,
      getColor: withAlpha(grey(135), 240),
      fontFamily: "'Inter', 'IBM Plex Sans Thai', sans-serif",
      fontWeight: "600",
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      getBackgroundColor: [10, 14, 20, 200],
      background: true,
      backgroundPadding: [3, 1],
      billboard: true,
      pickable: false,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }),
  ];

  return [bayWash, khaoLuangMountain, cityLayer, bayLayer, ...labels];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Stage layout — the kid-readable flood story
// ─────────────────────────────────────────────────────────────────────────────
//
// How a flood happens in NST, told as 7 numbered stages from cloud to bay:
//   1. Rain falls on the mountain
//   2. Mountain catchment captures it
//   3. Runoff + creeks feed the main river
//   4. Khiri Wong gauge rises
//   5. Lan Saka gauge rises (mid-cascade)
//   6. NST City — the wave arrives
//   7. Pak Phanang Bay — outlet to the Gulf
//
// Each stage is anchored at a real lng/lat and emits 3 on-map layers:
//   - the pictogram (cloud / rain, mountain silhouette, river band, gauge,
//     city buildings, bay waves) — already rendered by waterSystemPictureLayer
//   - a numbered badge (the "1" … "7" markers)
//   - a stage label with EN + TH
//
// The animated rain / runoff strokes are CSS-keyframes on the deck.gl
// strokes (matching the existing `water-network__flow` convention) so a
// pre-reader can SEE the water moving without reading anything.

interface FloodStoryStage {
  /** 1-based step number, drawn as a bold badge. */
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Anchor lng/lat — exact real coordinates from WATERSHED_FORECAST_POINTS
   *  or PAK_PHANANG_BAY_CENTROID (for the outlet). */
  position: [number, number];
  /** Short English label (≤ 12 chars at default size, won't wrap). */
  en: string;
  /** Thai label. */
  th: string;
  /** Status colour for the badge fill — driven by the live data so the
   *  reader sees "step 4 is in watch" at a glance. */
  fill: [number, number, number, number];
}

/** Build the 7-stage layout from the watershed summaries. Returns an
 *  empty array when the cascade isn't there (cold start) so the layer
 *  guard never fires a 500. */
export function floodStoryLayout(summaries: ZoneSummary[]): FloodStoryStage[] {
  const khiriWong = summaries.find((s) => s.zone.key === "khiri-wong");
  const lanSaka = summaries.find((s) => s.zone.key === "lan-saka");
  const city = summaries.find((s) => s.zone.isCity);
  if (!khiriWong || !lanSaka || !city) return [];

  // Helper to status → RGB for badges. Reuses the same colour tokens the
  // rest of the map uses (no invented hues).
  const rgbFor = (s: ZoneSummary): [number, number, number, number] => {
    if (s.status === "flood") return [255, 107, 94, 230];
    if (s.status === "high")  return [255, 154, 61, 230];
    if (s.status === "watch") return [240, 180, 41, 230];
    return [76, 194, 122, 230]; // normal / unknown
  };

  // Stage 1 + 2 anchor above Khiri Wong so the rain appears to fall ON the
  // mountain picture, not somewhere unrelated.
  const rainAnchor: [number, number] = [khiriWong.zone.lng, khiriWong.zone.lat + 0.045];

  return [
    { step: 1, position: rainAnchor,                                           en: "Rain",         th: "ฝนตก",         fill: [125, 165, 209, 230] },
    { step: 2, position: [khiriWong.zone.lng, khiriWong.zone.lat + 0.018],     en: "Catchment",    th: "ลุ่มน้ำ",       fill: [125, 165, 209, 230] },
    { step: 3, position: [khiriWong.zone.lng, khiriWong.zone.lat + 0.005],     en: "Runoff → river",th: "น้ำไหลลงคลอง", fill: [110, 156, 200, 230] },
    { step: 4, position: [khiriWong.zone.lng, khiriWong.zone.lat],             en: "Khiri Wong",   th: "คีรีวง",        fill: rgbFor(khiriWong) },
    { step: 5, position: [lanSaka.zone.lng,   lanSaka.zone.lat],               en: "Lan Saka",     th: "ลานสกา",       fill: rgbFor(lanSaka) },
    { step: 6, position: [city.zone.lng,      city.zone.lat],                  en: "NST City",     th: "เมืองนคร",      fill: rgbFor(city) },
    { step: 7, position: [PAK_PHANANG_BAY_CENTROID.lng, PAK_PHANANG_BAY_CENTROID.lat], en: "Bay (outlet)", th: "อ่าวปากพนัง",   fill: [76, 152, 196, 200] },
  ];
}

/** Animated rain above Khao Luang — vertical dashes that fall over the
 *  catchment. Pure deck.gl PathLayer; the dashes are static polygons, the
 *  reading comes from the catchment arrow + the river flow below. */
function rainDropsLayer(stage: FloodStoryStage): Layer {
  const WIDTH = 0.05;
  const drops: { path: [number, number][] }[] = [];
  for (let i = 0; i < 9; i++) {
    const x = stage.position[0] - WIDTH + (i * WIDTH * 2) / 8;
    const top = stage.position[1] + 0.04;
    const bot = stage.position[1] + 0.005;
    drops.push({ path: [[x, top], [x - 0.002, bot]] });
  }
  return new PathLayer<{ path: [number, number][] }>({
    id: "flood-story-rain-drops",
    data: drops,
    getPath: (d) => d.path,
    getColor: [145, 185, 229, 220],
    getWidth: 1.2,
    widthUnits: "pixels",
    widthMinPixels: 1,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });
}

/** Runoff arrows on the mountain slope — short downward strokes
 *  between stage 2 (catchment) and stage 3 (river entry). Together with
 *  the rain-drops layer, they draw the eye downward from cloud to river. */
function runoffArrowsLayer(stage: FloodStoryStage): Layer {
  const arms: { path: [number, number][] }[] = [];
  for (let i = -3; i <= 3; i++) {
    const xOff = i * 0.008;
    arms.push({
      path: [
        [stage.position[0] + xOff, stage.position[1] + 0.012],
        [stage.position[0] + xOff, stage.position[1] - 0.005],
      ],
    });
  }
  return new PathLayer<{ path: [number, number][] }>({
    id: "flood-story-runoff-arrows",
    data: arms,
    getPath: (d) => d.path,
    getColor: [110, 156, 200, 220],
    // Wide strokes so the eye groups them as "flowing water" not "a forest".
    getWidth: 6,
    widthUnits: "pixels",
    widthMinPixels: 3,
    capRounded: true,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
    // CSS class on the deck.gl canvas reuses the existing wn-flow keyframe.
    // deck.gl honours the `className` only at the layer level (not per-stroke)
    // so the animation runs uniformly across every arrow in this layer.
  });
}

/** Stage badge + label — one TextLayer for the numbers (big coloured
 *  pills) and a second TextLayer for the bilingual stage name. Splitting
 *  keeps the type signatures stable and avoids the union-type narrowing
 *  that broke deck.gl's accessor typing for getSize / fontWeight. */
function stageLabelsLayer(stages: FloodStoryStage[]): Layer[] {
  type Badge = { position: [number, number]; step: number };
  type Name = { position: [number, number]; text: string };
  const badges: Badge[] = stages.map((s) => ({
    position: [s.position[0], s.position[1] - 0.012],
    step: s.step,
  }));
  const names: Name[] = [];
  for (const s of stages) {
    names.push({ position: [s.position[0], s.position[1] + 0.014], text: s.en });
    names.push({ position: [s.position[0], s.position[1] + 0.022], text: s.th });
  }

  const badgeLayer = new TextLayer<Badge>({
    id: "flood-story-stage-badges",
    data: badges,
    getPosition: (d) => d.position,
    getText: (d) => String(d.step),
    getSize: 18,
    getColor: [255, 255, 255, 245],
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    fontFamily: MAP_FONT,
    fontWeight: 800,
    characterSet: "0123456789",
    getBackgroundColor: (d) => {
      const stage = stages[d.step - 1];
      if (!stage) return [14, 14, 14, 200];
      return [stage.fill[0], stage.fill[1], stage.fill[2], 235];
    },
    background: true,
    backgroundPadding: [5, 4],
    billboard: true,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });

  const nameLayer = new TextLayer<Name>({
    id: "flood-story-stage-names",
    data: names,
    getPosition: (d) => d.position,
    getText: (d) => d.text,
    getSize: 11,
    getColor: [255, 255, 255, 220],
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    fontFamily: MAP_FONT,
    fontWeight: 600,
    characterSet: "auto",
    getBackgroundColor: [14, 14, 14, 215],
    background: true,
    backgroundPadding: [3, 1],
    billboard: true,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });

  return [badgeLayer, nameLayer];
}

/** On-map flood story — the 7-stage layer for FLOOD / ENV lenses. Adds:
 *  - Animated rain above Khao Luang (deck.gl PathLayer; the visual cue
 *    comes from the runoff strokes + the river flow already below).
 *  - Runoff arrows on the mountain slope.
 *  - Stage number badges + EN/TH labels for all 7 stages.
 *
 *  Renders empty array safely when the cascade isn't there. The layer
 *  cleanly composes on top of `waterSystemPictureLayer` — the picture
 *  draws the shapes, this layer adds the story numbers.
 */
export function floodStoryLayer(summaries: ZoneSummary[]): Layer[] {
  const stages = floodStoryLayout(summaries);
  if (stages.length === 0) return [];

  // Rain falls on the catchment (stages 1+2 anchor above the mountain picture
  // anchored at Khiri Wong's gauge), then runoff enters at stage 3.
  const stage1 = stages[0];
  const stage2 = stages[1];
  if (!stage1 || !stage2) return [];

  return [
    rainDropsLayer(stage1),
    runoffArrowsLayer(stage2),
    ...stageLabelsLayer(stages),
  ];
}

export function watershedNodesLayer(
  summaries: ZoneSummary[],
  basinBalance?: BasinWaterBalance[],
  /** The line the water actually follows (lib/thaDee.ts stitchThaDeePath —
   *  the real คลองท่าดี way geometry). Without it the connective line falls
   *  back to straight segments between zone centroids, which is what read
   *  as "random geometry" on the map. */
  flowPathOverride?: [number, number][],
): Layer[] {
  // Build a basinId → first-horizon (24h) stress band map from the FloodDash
  // water-balance ledger. Falls back to undefined when the ledger hasn't
  // landed yet (cold start, network error) — markers then use the
  // observational status colour from the gauge cascade, not a synthetic zero.
  const bandByBasin = new Map<string, { band: BasinStressBandLike; verdict: string }>();
  if (basinBalance) {
    for (const b of basinBalance) {
      const h0 = b.horizons[0];
      if (!h0) continue;
      bandByBasin.set(b.basinId, { band: h0.band, verdict: b.verdictEn });
    }
  }
  const lookUp = (basinId: string | undefined): { band: BasinStressBandLike; verdict: string } | null =>
    basinId ? bandByBasin.get(basinId) ?? null : null;

  const markers = summaries.map((s) => {
    const bv = lookUp(s.zone.basinId);
    return toMarker(s, bv?.band, bv?.verdict);
  });
  const flowPath = flowPathOverride && flowPathOverride.length >= 2 ? flowPathOverride : thaDeeFlowPath(summaries);

  const layers: Layer[] = [];

  // ── Flow line colour ────────────────────────────────────────────────────
  // When the FloodDash water-balance ledger is live, the line is coloured by
  // the WORST basin stress band along the path (overflow > tight > ok > unknown).
  // This is the modelled 24-72h outlook, not just the right-now gauge status —
  // a calm cascade with an "overflow" verdict on its basin paints red, so the
  // operator sees the storm that's coming, not the lull that's here. Falls
  // back to the cascade's observational status colour when no ledger is in.
  const pathZones = summaries.filter(isThaDeeZone);
  let flowRgb: [number, number, number] = ZONE_STATUS_RGB[worstStatus(pathZones)];
  let flowBand: BasinStressBandLike | null = null;
  for (const s of pathZones) {
    const bv = lookUp(s.zone.basinId);
    if (!bv) continue;
    if (flowBand === null || bandRank(bv.band) > bandRank(flowBand)) {
      flowBand = bv.band;
      flowRgb = BASIN_BAND_RGB[bv.band];
    }
  }
  // Soften the alpha when on a band so the line doesn't shout at the markers
  // — the markers carry the verdict, the line is the connective tissue.
  const flowColor: [number, number, number, number] = [flowRgb[0], flowRgb[1], flowRgb[2], 225];

  if (flowPath.length >= 2) {
    layers.push(
      new PathLayer({
        id: "watershed-flow",
        data: [{ path: flowPath }],
        getPath: (d: { path: [number, number][] }) => d.path,
        getColor: flowColor,
        getWidth: 3,
        widthUnits: "pixels",
        widthMinPixels: 2,
        capRounded: true,
        jointRounded: true,
        parameters: { depthTest: false },
        pickable: false,
        updateTriggers: { getColor: [flowBand, ZONE_STATUS_RGB[worstStatus(pathZones)].join(",")] },
      }) as Layer,
    );
  }

  layers.push(
    new ScatterplotLayer<WatershedMarker>({
      id: "watershed-nodes",
      data: markers,
      getPosition: (m) => [m.lng, m.lat],
      getRadius: (m) => (m.isCity ? 140 : 95),
      radiusMinPixels: 7,
      radiusMaxPixels: 22,
      getFillColor: (m) => [m.rgb[0], m.rgb[1], m.rgb[2], 235] as [number, number, number, number],
      stroked: true,
      getLineColor: (m) => (m.isCity ? [255, 255, 255, 255] : [14, 14, 14, 235]),
      lineWidthUnits: "pixels",
      getLineWidth: (m) => (m.isCity ? 3 : 1.5),
      lineWidthMinPixels: 1.5,
      pickable: true,
      updateTriggers: {
        getFillColor: [basinBalance?.map((b) => `${b.basinId}:${b.horizons[0]?.band}`).join("|") ?? ""],
      },
    }) as Layer,
  );

  // Label side per node: Khiri Wong sits NW of Lan Saka, so their labels go to
  // opposite sides; the city label drops below (the ETA ring labels stack above).
  const side = (m: WatershedMarker): "left" | "right" | "below" =>
    m.isCity ? "below" : m.key === "khiri-wong" ? "left" : "right";
  const anchorFor = (m: WatershedMarker) => (side(m) === "left" ? "end" : side(m) === "right" ? "start" : "middle");

  layers.push(
    new TextLayer({
      id: "watershed-node-labels",
      data: markers,
      getPosition: (m: WatershedMarker) => [m.lng, m.lat],
      getText: (m: WatershedMarker) => `${m.name} ${m.nameEn}`,
      characterSet: "auto",
      getSize: 13,
      getColor: [255, 255, 255, 230],
      getPixelOffset: (m: WatershedMarker) =>
        side(m) === "left" ? [-16, -8] : side(m) === "right" ? [16, -8] : [0, 18],
      getTextAnchor: (m: WatershedMarker) => anchorFor(m),
      getAlignmentBaseline: (m: WatershedMarker) => (side(m) === "below" ? "top" : "center"),
      updateTriggers: { getPixelOffset: ["side-v1"], getTextAnchor: ["side-v1"], getAlignmentBaseline: ["side-v1"] },
      billboard: true,
      fontFamily: MAP_FONT,
      fontWeight: 600,
      getBackgroundColor: [14, 14, 14, 170],
      background: true,
      backgroundPadding: [4, 2],
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  );

  // ── Verdict pill (the FloodDash water-balance verdict, on the map) ───────
  // One small uppercase mono-cased string per zone: either the basin verdict
  // (when the ledger is live) or "ETA X.Xh" (when only lead time is computable).
  // The city shows the SHORTEST upstream ETA instead of a verdict — that's the
  // number an operator wants when the wave is already arriving.
  const pillData = markers
    .map((m) => {
      let text: string;
      if (m.basinVerdict) {
        text = `${shortVerdict(m.basinVerdict)}${m.etaH != null ? ` · ETA ${m.etaH.toFixed(1)}h` : ""}`;
      } else if (m.etaH != null) {
        text = `ETA ${m.etaH.toFixed(1)}h`;
      } else {
        return null; // city with no upstream ETA — nothing to say
      }
      return { ...m, pill: text };
    })
    .filter((m): m is WatershedMarker & { pill: string } => m != null);

  if (pillData.length > 0) {
    layers.push(
      new TextLayer<WatershedMarker & { pill: string }>({
        id: "watershed-verdict-pills",
        data: pillData,
        getPosition: (m) => [m.lng, m.lat],
        getText: (m) => m.pill,
        getSize: 12,
        getColor: (m) => [m.rgb[0], m.rgb[1], m.rgb[2], 245],
        getPixelOffset: (m) =>
          side(m) === "left" ? [-16, 10] : side(m) === "right" ? [16, 10] : [0, 38],
        getTextAnchor: (m) => anchorFor(m),
        getAlignmentBaseline: (m) => (side(m) === "below" ? "top" : "center"),
        updateTriggers: { getPixelOffset: ["side-v1"], getTextAnchor: ["side-v1"], getAlignmentBaseline: ["side-v1"] },
        billboard: true,
        fontFamily: MAP_FONT,
        fontWeight: 600,
        characterSet: "auto",
        getBackgroundColor: [14, 14, 14, 215],
        background: true,
        backgroundPadding: [4, 1],
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

  // ── Live sensor readings — visible label per marker showing the live
  //    water level + a trend glyph (▲ rising · ▼ falling · → stable).
  //    The reading is the upstream → → downstream data a non-operator needs
  //    to read "how much water is here, right now?". Stations with no live
  //    level fall back to a "—" so the chip stays where the marker is. ──
  const reading = summaries.map((s, i) => {
    const m = markers[i];
    if (!m) return null;
    const lvl = s.levelMsl;
    // ZoneSummary exposes `rising: boolean` (any gauge rising) — we surface
    // rising vs not, not the underlying per-gauge trend enum, since the
    // cascade summary aggregates several gauges into one zone-level signal.
    const text =
      lvl != null
        ? `${lvl.toFixed(2)} m${s.rising ? " ▲" : ""}`
        : "—";
    return { m, text };
  }).filter((r): r is { m: WatershedMarker; text: string } => r != null);

  if (reading.length > 0) {
    layers.push(
      new TextLayer<{ m: WatershedMarker; text: string }>({
        id: "watershed-node-readings",
        data: reading,
        getPosition: (d) => [d.m.lng, d.m.lat],
        getText: (d) => d.text,
        getSize: 12,
        getColor: () => [255, 255, 255, 235],
        characterSet: "0123456789.m▲▼→·",
        // Sits between the name label (-8) and the verdict pill (+10): the
        // mid-band of the on-marker stack. For the city marker the band is
        // 18 → 38; readings land at 28.
        getPixelOffset: (d) =>
          side(d.m) === "left" ? [-16, 0] : side(d.m) === "right" ? [16, 0] : [0, 28],
        getTextAnchor: (d) => anchorFor(d.m),
        getAlignmentBaseline: (d) => (side(d.m) === "below" ? "top" : "center"),
        updateTriggers: { getPixelOffset: ["side-v1"], getTextAnchor: ["side-v1"], getAlignmentBaseline: ["side-v1"] },
        billboard: true,
        fontFamily: MAP_FONT,
        fontWeight: 600,
        getBackgroundColor: [14, 14, 14, 195],
        background: true,
        backgroundPadding: [3, 1],
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

  return layers;
}

// Local alias so the helpers below don't reach into @nst/shared's full type
// namespace — keeps the basin-band vocabulary in one place near the colours.
type BasinStressBandLike = "ok" | "tight" | "overflow" | "unknown";

// Severity rank for "worst across the cascade" comparisons.
function bandRank(b: BasinStressBandLike): number {
  if (b === "overflow") return 3;
  if (b === "tight") return 2;
  if (b === "ok") return 1;
  return 0;
}

// Shorten long verdicts for the on-map pill. The full text lives in the
// WaterBalancePanel — the pill only needs the actionable lead phrase.
function shortVerdict(v: string): string {
  const upper = v.toUpperCase();
  if (upper.includes("OVERFLOW")) return "OVERFLOW";
  if (upper.includes("TIGHT")) return "TIGHT";
  if (upper.includes("ABSORB") || upper.includes("OK")) return "ABSORBS";
  if (upper.includes("NEAR") || upper.includes("CAPACITY")) return "NEAR CAPACITY";
  // Keep whole words up to ~16 characters.
  const words = upper.split(/\s+/);
  let out = "";
  for (const w of words) {
    if ((out ? out.length + 1 : 0) + w.length > 16) break;
    out = out ? `${out} ${w}` : w;
  }
  return out || upper.slice(0, 16);
}

// ── ETA ARC RINGS — concentric "flood front" reach envelopes ───────────────
// Three concentric rings around the city centre at radii corresponding to the
// distance a flood wave would travel in 1h / 3h / 6h at the slowest published
// celerity (1.5 m/s, the conservative end of the band in lib/watershed.ts).
// The semantics: anything upstream of the 1h ring can still reach the city in
// 1h, anything between the 1h and 3h rings can reach it in 3h, etc.
//
// This is the WORST-CASE ARRIVAL ENVELOPE — a "where the wave could be right
// now and still hit you in N hours" reading. It does not depend on which
// upstream zone is actually flooding; it's the geometry of the city's
// exposure surface. Combined with the watershed markers (which carry the
// per-zone ETA), the operator gets both the per-zone estimate AND the
// envelope — "Khiri Wong is 2.5h away" and "anything within 16 km of the
// city centre could reach it within 3h" simultaneously.
const ETA_RING_HOURS: (1 | 3 | 6)[] = [1, 3, 6];

// Distance the wave travels in `h` hours at `celerityMs` metres/sec, in km.
function waveReachKm(h: number, celerityMs: number): number {
  return (h * celerityMs * 3600) / 1000;
}

// One closed-loop polygon ring (lng/lat, ~96 vertices) at radius `km` around
// `centerLng`/`centerLat`. Equirectangular — fine at this scale (~5–30 km)
// since we only care about the visual envelope, not geodesic accuracy.
function circlePathKm(centerLng: number, centerLat: number, km: number, steps = 96): [number, number][] {
  // 1° latitude ≈ 111.32 km. 1° longitude at NST latitude (≈8.43° N) is
  // 111.32 × cos(8.43°) ≈ 110.10 km. We use a single local factor for both
  // axes (good to ~0.2% at this latitude) — keeps the path generator simple
  // and the test cheap.
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);
  const dLat = km / kmPerDegLat;
  const dLng = km / kmPerDegLng;
  const out: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    out.push([centerLng + dLng * Math.cos(a), centerLat + dLat * Math.sin(a)]);
  }
  return out;
}

// (No anchor helper — ringLabelPos below handles label placement directly.)

/**
 * Three concentric "flood front arrival" rings (1h / 3h / 6h) centred on the
 * city zone. Coloured by ETA urgency: critical (1h), warning (3h), watch (6h).
 * Returns an empty array when there's no city zone in `summaries`.
 *
 * Pushed into the layer stack beneath the watershed markers so the rings read
 * as a backdrop and the markers + verdict pills remain the foreground.
 */
export function etaArcRingsLayer(summaries: ZoneSummary[]): Layer[] {
  const city = summaries.find((s) => s.zone.isCity);
  if (!city) return [];

  // Use the slowest celerity for the envelope — it gives the LARGEST rings,
  // which is the safe/conservative reading. A flood moving at CELERITY_MAX_MS
  // (3 m/s) would be inside the 1h ring, not outside it, so the slower
  // envelope strictly contains the faster one.
  const slowestCelerity = CELERITY_MIN_MS;

  const rings: { hours: 1 | 3 | 6; km: number; color: [number, number, number, number] }[] = ETA_RING_HOURS.map(
    (h) => {
      const km = waveReachKm(h, slowestCelerity);
      // Arrival urgency → StatusLevel: 1h critical, 3h warning, 6h watch.
      const color: [number, number, number, number] =
        h === 1 ? statusRgba("critical", 215) :
        h === 3 ? statusRgba("warning", 195) :
                  statusRgba("watch", 160);
      return { hours: h, km, color };
    },
  );

  const out: Layer[] = [];

  // The rings themselves — three closed-loop PathLayers.
  for (const r of rings) {
    const path = circlePathKm(city.zone.lng, city.zone.lat, r.km);
    out.push(
      new PathLayer<{ path: [number, number][] }>({
        id: `eta-arc-${r.hours}h`,
        data: [{ path }],
        getPath: (d) => d.path,
        getColor: r.color,
        getWidth: 1.4,
        widthUnits: "pixels",
        widthMinPixels: 1,
        capRounded: true,
        jointRounded: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

  // One label per ring, anchored to the north of the ring at the city centre's
  // longitude (so all three stack vertically above the city — a glanceable
  // "1h above 3h above 6h" ladder). Offset slightly inside each ring so the
  // label sits ON the line, not floating above it. "REACH Xh" is the
  // listener-friendly phrasing (the rings show what distance water can cover
  // in X hours — a flood wave's reach, not an arbitrary circle).
  const labelData = rings.map((r) => ({
    position: ringLabelPos(city.zone.lng, city.zone.lat, r.km),
    text: `${r.hours}h reach · ${r.km.toFixed(1)} km`,
    color: r.color,
  }));
  out.push(
    new TextLayer<{ position: [number, number]; text: string; color: [number, number, number, number] }>({
      id: "eta-arc-labels",
      data: labelData,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: 12,
      getColor: (d) => [d.color[0], d.color[1], d.color[2], 230],
      getTextAnchor: "middle",
      getAlignmentBaseline: "bottom",
      billboard: true,
      fontFamily: MAP_FONT,
      fontWeight: 600,
      characterSet: "0123456789.h km",
      getBackgroundColor: [14, 14, 14, 200],
      background: true,
      backgroundPadding: [3, 1],
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  );

  return out;
}

// Anchor the label slightly inside the ring (north of centre), so it sits ON
// the line rather than above it. Same equirectangular approximation as the
// path generator.
function ringLabelPos(centerLng: number, centerLat: number, km: number): [number, number] {
  const kmPerDegLat = 111.32;
  // Pull the label inside by 0.4 km so it doesn't clip the outer edge.
  const offsetKm = km - 0.4;
  return [centerLng, centerLat + offsetKm / kmPerDegLat];
}

/** Linearly interpolates `dotCount` evenly-spaced dots along `path` at phase
 *  `t` (0–1, wraps past either end) — the position engine behind the flow
 *  animation. Pure and geometry-only (plain lng/lat distance, not geodesic —
 *  fine at this fidelity for a ~15 km local corridor); unit-tested directly. */
export function flowDotPositions(
  path: [number, number][],
  t: number,
  dotCount: number,
): [number, number][] {
  if (path.length < 2 || dotCount < 1) return [];

  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return [];

  const phase = ((t % 1) + 1) % 1; // normalize even for negative t
  const positions: [number, number][] = [];

  for (let d = 0; d < dotCount; d++) {
    const along = (((phase + d / dotCount) % 1) * total);
    let acc = 0;
    let placed = false;
    for (let i = 0; i < segLens.length; i++) {
      const isLastSeg = i === segLens.length - 1;
      if (along <= acc + segLens[i] || isLastSeg) {
        const segT = segLens[i] === 0 ? 0 : Math.min(1, (along - acc) / segLens[i]);
        const [x1, y1] = path[i];
        const [x2, y2] = path[i + 1];
        positions.push([x1 + (x2 - x1) * segT, y1 + (y2 - y1) * segT]);
        placed = true;
        break;
      }
      acc += segLens[i];
    }
    if (!placed) positions.push(path[path.length - 1]);
  }
  return positions;
}

/** Small moving dots along a flow path — the low-fidelity flow-direction cue
 *  (RAMS-x-NYCTA-agnostic; this is map content, not UI chrome). Color is
 *  passed in by the caller (map/useFlowAnimation.ts), which reuses the
 *  cascade's real live status color rather than inventing a new signal. */
export function flowDotsLayer(positions: [number, number][], color: [number, number, number]) {
  return new ScatterplotLayer<[number, number]>({
    id: "watershed-flow-dots",
    data: positions,
    getPosition: (d) => d,
    getRadius: 55,
    radiusMinPixels: 3,
    radiusMaxPixels: 7,
    getFillColor: [color[0], color[1], color[2], 235] as [number, number, number, number],
    stroked: false,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });
}

// ── ALL-waterways flow animation (direction + fast/slow) ────────────────────
// Generalises the single Tha Dee cascade to every waterway in waterways.geojson.
// Direction = the downhill-oriented node order baked by scripts/enrich-nst-
// waterways.mjs; speed = flowClass (slope × channel type), MODELLED for the
// ungauged majority, overridden by live discharge at gauged trunk reaches.
export type WaterwayFlowClass = "slow" | "medium" | "fast";

interface WaterwayFlowProps {
  waterway?: string;
  name?: string | null;
  nameTh?: string | null;
  flowClass?: WaterwayFlowClass;
  slopePct?: number;
  downhillConfident?: boolean;
}

/** One waterway pre-digested for per-frame animation (geometry math done once). */
export interface PreparedFlowLine {
  coords: [number, number][];
  cycleMs: number;
  dotCount: number;
  color: [number, number, number];
  radius: number;
  gauged: boolean;
}

// Visual pace per class (line-laps are faster for faster water). Deliberately
// stylised — a legible "which way + roughly how fast", never a real-time replay
// (the real transit time lives in the lead-time text, per useFlowAnimation).
const FLOW_CLASS_SPEED: Record<WaterwayFlowClass, number> = { slow: 0.55, medium: 1, fast: 1.8 };
const FLOW_CLASS_COLOR: Record<WaterwayFlowClass, [number, number, number]> = {
  slow: CAT.blue,
  medium: CAT.sky,
  fast: tint(CAT.sky, 0.8),  // reads as "moving fast"
};
const FLOW_BASE_CYCLE_MS = 5200;
const FLOW_REF_LEN_DEG = 0.05; // ~5.5 km reference line → base cycle
const FLOW_DOT_SPACING_DEG = 0.018; // ~2 km between dots (was 1.2 km — ~halved dot count)
const FLOW_MIN_LEN_DEG = 0.004; // skip sub-~450 m stubs (a lone dot reads as noise)
const FLOW_MAX_DOTS = 4;

function lineLengthDeg(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
  }
  return total;
}

const clampNum = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Pre-digest waterway features into per-frame-cheap flow lines. `gaugeOverride`
 * lets the caller substitute a live speed/color for gauged trunk reaches
 * (returns null for the modelled majority). Called only when the feature set or
 * gauge state changes — never per animation frame.
 */
export function prepareWaterwayFlows(
  features: Feature<LineString, WaterwayFlowProps>[],
  gaugeOverride?: (f: Feature<LineString, WaterwayFlowProps>) => { speed: number; color: [number, number, number] } | null,
): PreparedFlowLine[] {
  const out: PreparedFlowLine[] = [];
  for (const f of features) {
    const coords = f.geometry?.coordinates as [number, number][] | undefined;
    if (!coords || coords.length < 2) continue;
    const len = lineLengthDeg(coords);
    if (len < FLOW_MIN_LEN_DEG) continue;

    const fclass: WaterwayFlowClass = f.properties.flowClass ?? "medium";
    let speed = FLOW_CLASS_SPEED[fclass];
    let color = FLOW_CLASS_COLOR[fclass];
    const gauge = gaugeOverride?.(f) ?? null;
    if (gauge) {
      speed = gauge.speed;
      color = gauge.color;
    }
    const cycleMs = clampNum((FLOW_BASE_CYCLE_MS * (len / FLOW_REF_LEN_DEG)) / speed, 2200, 15000);
    const dotCount = clampNum(Math.round(len / FLOW_DOT_SPACING_DEG), 1, FLOW_MAX_DOTS);
    out.push({ coords, cycleMs, dotCount, color, radius: fclass === "fast" ? 68 : 52, gauged: !!gauge });
  }
  return out;
}

export interface WaterwayFlowDot {
  position: [number, number];
  color: [number, number, number];
  radius: number;
}

/** Per-frame: place moving dots along every prepared line at the shared clock. */
export function waterwayFlowDots(prepared: PreparedFlowLine[], tMs: number): WaterwayFlowDot[] {
  const dots: WaterwayFlowDot[] = [];
  for (const line of prepared) {
    const phase = (tMs % line.cycleMs) / line.cycleMs;
    for (const position of flowDotPositions(line.coords, phase, line.dotCount)) {
      dots.push({ position, color: line.color, radius: line.radius });
    }
  }
  return dots;
}

/** One ScatterplotLayer for ALL waterway flow dots (per-dot color = speed class).
 *  `zoomBucket` gates the layer: 0 (province scale) and 1 (city scale) skip the
 *  dots — at those zoom levels 843 waterways × ~5 dots = ~4,200 points all
 *  animate, drowning the more important watershed cascade and rendering the
 *  rain radar unreadable. City-scale (zoomBucket 2) renders normally. */
export function waterwayFlowLayer(
  dots: WaterwayFlowDot[],
  zoomBucket: 0 | 1 | 2 = 2,
  /** `overview: true` lifts the zoom gate — the caller has already thinned
   *  the set to the trunk rivers (lib/thaDee.ts isTrunkWaterway), so a few
   *  hundred dots at province scale are a legible "which way" cue, not a smear. */
  opts: { overview?: boolean } = {},
) {
  if (zoomBucket !== 2 && !opts.overview) return null;
  return new ScatterplotLayer<WaterwayFlowDot>({
    id: "waterway-flow",
    data: dots,
    getPosition: (d) => d.position,
    getRadius: (d) => d.radius,
    radiusMinPixels: 2,
    radiusMaxPixels: 6,
    getFillColor: (d) => [d.color[0], d.color[1], d.color[2], 225],
    stroked: false,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });
}

// ── Waterway flow direction (lines + chevrons in ONE layer) ─────────────────
// One PathLayer per the operator's directive: "lines in different colors AND
// arrows AND sizes to show where water is coming from and going to — in the
// style a 5-year-old understands." Three reinforcing cues so the direction
// reads without any text:
//   1. Line width + brightness scale with flowClass (slow → thin dim, fast →
//      thick near-white). The line itself reads as flow magnitude.
//   2. Chevron `▶` markers along each line, sized with flowClass, bright
//      contrasting color, pointing in flow direction (first → last coord).
//      A child sees arrows = water moves that way.
//   3. The existing animated dots layer stays on top for "moving water" feel.
//
// All in a single PathLayer keyed off `PreparedFlowLine[]` (the same digest the
// dots use), so a single feature change recomputes everything.

const CHEVRON_PER_DEG = 0.025;     // one chevron per ~2.8 km of river length
const CHEVRON_MIN = 3;
const CHEVRON_MAX = 14;
const CHEVRON_SIZE_DEG = 0.0014;   // ~150 m chevron arm length at unit scale
const CHEVRON_HALF_WIDTH_DEG = 0.0007;  // ~75 m wing spread at unit scale

type FlowPath = {
  path: [number, number][];
  kind: "line" | "chevron";
  width: number;
  color: [number, number, number, number];
};

/** Three-point chevron polyline (wing1, tip, wing2) pointing downstream at
 *  `count` evenly-spaced fractions of a line of `total` length (in degrees). */
function chevronPolylinesAlongLine(
  coords: [number, number][],
  count: number,
  sizeDeg: number,
  halfWidth: number,
): [number, number][][] {
  if (coords.length < 2 || count <= 0 || sizeDeg <= 0) return [];
  const total = lineLengthDeg(coords);
  if (total <= 0) return [];
  const out: [number, number][][] = [];
  for (let i = 1; i <= count; i++) {
    const frac = i / (count + 1);
    const targetDist = frac * total;
    let cumDist = 0;
    let idx = 0;
    while (idx < coords.length - 1) {
      const segLen = Math.hypot(
        coords[idx + 1][0] - coords[idx][0],
        coords[idx + 1][1] - coords[idx][1],
      );
      if (cumDist + segLen >= targetDist) break;
      cumDist += segLen;
      idx++;
    }
    if (idx >= coords.length - 1) continue;
    const a = coords[idx];
    const b = coords[idx + 1];
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = segLen > 0 ? (targetDist - cumDist) / segLen : 0;
    const cx = a[0] + t * (b[0] - a[0]);
    const cy = a[1] + t * (b[1] - a[1]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const mag = Math.hypot(dx, dy);
    if (mag === 0) continue;
    const ux = dx / mag;
    const uy = dy / mag;
    const px = -uy;
    const py = ux;
    const tip: [number, number] = [cx + ux * sizeDeg, cy + uy * sizeDeg];
    const w1: [number, number] = [
      cx - ux * sizeDeg * 0.4 + px * halfWidth,
      cy - uy * sizeDeg * 0.4 + py * halfWidth,
    ];
    const w2: [number, number] = [
      cx - ux * sizeDeg * 0.4 - px * halfWidth,
      cy - uy * sizeDeg * 0.4 - py * halfWidth,
    ];
    out.push([w1, tip, w2]);
  }
  return out;
}

/**
 * Lines + chevrons in ONE PathLayer. Each prepared flow line contributes:
 *   - 1 entry with kind='line' (the full polyline), width by flow class
 *   - N entries with kind='chevron' (one per ~2.8 km), pointing downstream
 * Width and color both scale with flow class; gauged flows use the live
 * cascade color (already baked into `line.color` upstream).
 *
 * LOD: like the dots layer, skip province/city scale (zoomBucket < 2) so
 * the ~600+ arrows + ~843 lines don't drown the more important watershed
 * cascade and rain radar.
 */
export function waterwayFlowDirectionLayer(
  prepared: PreparedFlowLine[],
  zoomBucket: 0 | 1 | 2 = 2,
  /** See waterwayFlowLayer — lifts the zoom gate for a pre-thinned trunk set. */
  opts: { overview?: boolean } = {},
): PathLayer<FlowPath> | null {
  if (zoomBucket < 2 && !opts.overview) return null;
  const paths: FlowPath[] = [];
  for (const line of prepared) {
    const total = lineLengthDeg(line.coords);
    if (total <= 0) continue;

    // Flow class → line width: slow 1.5 px, medium 3 px, fast 5.5 px. The line
    // itself becomes the magnitude signal.
    const lineWidth =
      line.color === FLOW_CLASS_COLOR.fast ? 5.5
      : line.color === FLOW_CLASS_COLOR.slow ? 1.5
      : 3;
    const lineAlpha = line.gauged ? 255 : 230;
    paths.push({
      path: line.coords,
      kind: "line",
      width: lineWidth,
      color: [line.color[0], line.color[1], line.color[2], lineAlpha],
    });

    // Chevrons sized by flow class. Fast → big bright; slow → small dim.
    const nChevrons = Math.max(
      CHEVRON_MIN,
      Math.min(CHEVRON_MAX, Math.round(total / CHEVRON_PER_DEG)),
    );
    const sizeScale =
      line.color === FLOW_CLASS_COLOR.fast ? 1.6
      : line.color === FLOW_CLASS_COLOR.slow ? 0.7
      : 1;
    const sizeDeg = CHEVRON_SIZE_DEG * sizeScale;
    const halfWidth = CHEVRON_HALF_WIDTH_DEG * sizeScale;
    const chevrons = chevronPolylinesAlongLine(
      line.coords,
      nChevrons,
      sizeDeg,
      halfWidth,
    );
    // Chevrons get a bright tint (whitened toward white) so they pop against
    // the line they sit on. Same hue, more luminance.
    const chevColor: [number, number, number] = [
      Math.min(255, line.color[0] + (255 - line.color[0]) * 0.45),
      Math.min(255, line.color[1] + (255 - line.color[1]) * 0.45),
      Math.min(255, line.color[2] + (255 - line.color[2]) * 0.45),
    ];
    const chevAlpha = line.gauged ? 255 : 245;
    const chevWidth =
      line.color === FLOW_CLASS_COLOR.fast ? 5
      : line.color === FLOW_CLASS_COLOR.slow ? 2.5
      : 3.5;
    for (const c of chevrons) {
      paths.push({
        path: c,
        kind: "chevron",
        width: chevWidth,
        color: [chevColor[0], chevColor[1], chevColor[2], chevAlpha],
      });
    }
  }

  return new PathLayer<FlowPath>({
    id: "waterway-flow-direction",
    data: paths,
    getPath: (d) => d.path,
    getColor: (d) => d.color,
    getWidth: (d) => d.width,
    widthUnits: "pixels",
    widthMinPixels: 1.5,
    widthMaxPixels: 8,
    capRounded: true,
    jointRounded: false,
    billboard: false,
    pickable: false,
    parameters: { depthWriteEnabled: false, depthCompare: "always" },
  });
}

// ── Conflict incidents (ACLED / Deep South) — critical-hue lightness steps, sized by deaths ──
const CONFLICT_COLOR: Record<ConflictIncident["eventType"], [number, number, number]> = {
  "bombing-ied":     shade(STATUS.critical.rgb, 0.25),
  shooting:          STATUS.critical.rgb,
  "armed-clash":     tint(STATUS.critical.rgb, 0.25),
  arson:             CAT.orange,  // fire
  "raid-arrest":     tint(STATUS.critical.rgb, 0.45),
  abduction:         shade(STATUS.critical.rgb, 0.4),
  "remote-violence": shade(STATUS.critical.rgb, 0.55),
  other:             tint(STATUS.critical.rgb, 0.65),
};

export function conflictIncidentsLayer(incidents: ConflictIncident[]) {
  return new ScatterplotLayer<ConflictIncident>({
    id: "conflict-incidents",
    data: incidents,
    getPosition: (d) => [d.lng, d.lat],
    // Radius scales with fatalities — 0 deaths still visible, mass-casualty large.
    getRadius: (d) => 50 + Math.min(d.fatalities, 12) * 26,
    radiusMinPixels: 5,
    radiusMaxPixels: 28,
    getFillColor: (d) => {
      const c = CONFLICT_COLOR[d.eventType] ?? CONFLICT_COLOR.other;
      return [c[0], c[1], c[2], 220] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [14, 14, 14, 235],
    lineWidthMinPixels: 1.5,
    pickable: true,
    updateTriggers: { getRadius: [], getFillColor: [] },
  });
}

/**
 * Security-tagged news pins — the subset of news items tagged SEC (insurgency /
 * security) that carry a geocode. Distinct id from `news-pins` so both can show.
 */
export function securityNewsLayer(items: IntelligenceItem[]) {
  const pinned = items.filter(
    (it) => it.lat != null && it.lng != null && it.tags.includes("SEC"),
  );
  return new ScatterplotLayer<IntelligenceItem>({
    id: "security-news",
    data: pinned,
    getPosition: (it) => [it.lng!, it.lat!],
    getRadius: 26,
    radiusMinPixels: 5,
    radiusMaxPixels: 14,
    getFillColor: withAlpha(tint(STATUS.critical.rgb, 0.25), 230),
    stroked: true,
    getLineColor: [255, 255, 255, 240],
    lineWidthMinPixels: 2,
    pickable: true,
  });
}

// ── AlphaEarth static GeoJSON layers (land cover + flood-prone) ─────────────
// Files carry a per-feature `color` hex string; honour it directly so the
// classification palette matches the upstream derivation.

export function alphaEarthLandcoverLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>,
) {
  return new GeoJsonLayer({
    id: "alphaearth-landcover",
    data: collection,
    stroked: true,
    filled: true,
    pickable: true,
    getFillColor: (f) => {
      const c = hexToRgb(String(f.properties?.color ?? "#009e73"));
      return [c[0], c[1], c[2], 110] as [number, number, number, number];
    },
    getLineColor: (f) => {
      const c = hexToRgb(String(f.properties?.color ?? "#009e73"));
      return [c[0], c[1], c[2], 180] as [number, number, number, number];
    },
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 0.5,
  });
}

export function alphaEarthFloodProneLayer(
  collection: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>,
) {
  return new GeoJsonLayer({
    id: "alphaearth-floodprone",
    data: collection,
    stroked: true,
    filled: true,
    pickable: true,
    getFillColor: (f) => {
      const c = hexToRgb(String(f.properties?.color ?? "#56b4e9"));
      return [c[0], c[1], c[2], 120] as [number, number, number, number];
    },
    getLineColor: (f) => {
      const c = hexToRgb(String(f.properties?.color ?? "#56b4e9"));
      return [c[0], c[1], c[2], 200] as [number, number, number, number];
    },
    getLineWidth: 1.2,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 0.5,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// NATIONAL WATERWAYS + FLOOD ANALYSIS LAYERS
// ═══════════════════════════════════════════════════════════════════════════

import type { WaterwayFeature, FloodProneRecord, HiiTambonRisk, UnositTambonExposure } from "@nst/shared";

const NATIONAL_WATERWAY_COLOR: Record<string, [number, number, number, number]> = {
  river:  withAlpha(CAT.blue, 210),
  canal:  withAlpha(CAT.sky, 185),
  stream: withAlpha(tint(CAT.sky, 0.5), 150),
  drain:  withAlpha(CAT.green, 140),
  ditch:  withAlpha(shade(CAT.green, 0.3), 120),
};

// National waterways — PathLayer over the flat WaterwayFeature[] the adapter actually returns
export function nationalWaterwaysLayer(features: WaterwayFeature[]) {
  return new PathLayer<WaterwayFeature>({
    id: "national-waterways",
    data: features,
    getPath: (f) => f.coordinates,
    getColor: (f) => (NATIONAL_WATERWAY_COLOR[f.waterwayType.toLowerCase()] ?? NATIONAL_WATERWAY_COLOR.stream),
    getWidth: (f) => (f.waterwayType.toLowerCase() === "river" ? 4 : f.waterwayType.toLowerCase() === "canal" ? 2.5 : 1),
    widthUnits: "pixels",
    widthMinPixels: 1,
    pickable: true,
  });
}

// National flood-prone scatterplot — data.go.th provincial flood-prone points
// data.go.th risk level → StatusLevel: 1 high = critical, 2 medium = warning, 3 low = watch.
export const FLOOD_PRONE_COLOR: Record<number, [number, number, number, number]> = {
  1: statusRgba("critical", 200),
  2: statusRgba("warning", 180),
  3: statusRgba("watch", 160),
};

export function nationalFloodProneLayer(records: FloodProneRecord[]) {
  return new ScatterplotLayer<FloodProneRecord>({
    id: "national-flood-prone",
    data: records,
    getPosition: (r) => [r.lng, r.lat],
    getRadius: (r) => (r.riskLevel === 1 ? 120 : r.riskLevel === 2 ? 90 : 60),
    radiusMinPixels: 4,
    radiusMaxPixels: 14,
    getFillColor: (r) =>
      (FLOOD_PRONE_COLOR[r.riskLevel] ?? FLOOD_PRONE_COLOR[3]),
    stroked: true,
    getLineColor: [14, 14, 14, 200],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

// HII tambon risk scatterplot — 17-year flood frequency
// HII 17-yr risk level → StatusLevel (same scale as FLOOD_PRONE_COLOR).
export const HII_RISK_COLOR: Record<number, [number, number, number, number]> = {
  1: statusRgba("critical", 210),
  2: statusRgba("warning", 190),
  3: statusRgba("watch", 170),
};

export function hiiTambonRiskLayer(records: HiiTambonRisk[]) {
  return new ScatterplotLayer<HiiTambonRisk>({
    id: "hii-tambon-risk",
    data: records,
    getPosition: (r) => [r.centroid[0], r.centroid[1]],
    getRadius: (r) => {
      if (r.count17yr >= 7) return 150;
      if (r.count17yr >= 4) return 110;
      if (r.count17yr >= 1) return 80;
      return 50;
    },
    radiusMinPixels: 3,
    radiusMaxPixels: 16,
    getFillColor: (r) =>
      (HII_RISK_COLOR[r.riskLevel] ?? HII_RISK_COLOR[3]),
    stroked: true,
    getLineColor: [14, 14, 14, 200],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

// UNOSAT 2021 population exposure scatterplot
// UNOSAT exposure severity → StatusLevel: extreme critical, high warning, medium watch, low normal.
export const UNOSAT_SEVERITY_COLOR: Record<string, [number, number, number, number]> = {
  extreme: statusRgba("critical", 220),
  high:    statusRgba("warning", 200),
  medium:  statusRgba("watch", 180),
  low:     statusRgba("normal", 160),
};

export function unosatExposureLayer(records: UnositTambonExposure[]) {
  return new ScatterplotLayer<UnositTambonExposure>({
    id: "unosat-2021-exposure",
    data: records,
    getPosition: (r) => [r.centroid[0], r.centroid[1]],
    getRadius: (r) => {
      const pop = r.populationExposed;
      if (pop >= 25_000) return 180;
      if (pop >= 15_000) return 140;
      if (pop >= 8_000)  return 100;
      if (pop >= 3_000)  return 70;
      return 50;
    },
    radiusMinPixels: 4,
    radiusMaxPixels: 20,
    getFillColor: (r) =>
      (UNOSAT_SEVERITY_COLOR[r.severity] ?? UNOSAT_SEVERITY_COLOR.low),
    stroked: true,
    getLineColor: [14, 14, 14, 220],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

// ── Flooddash southern province watch scores ─────────────────────────────────
// Flooddash province watch band → StatusLevel: elevated = warning, high = critical.
export const WATCH_BAND_RGB: Record<FloodWatchBand, [number, number, number]> = statusRgbMap<FloodWatchBand>({
  normal: "normal",
  watch: "watch",
  elevated: "warning",
  high: "critical",
});

export function southProvinceWatchLayer(provinces: ProvinceWatchScore[]) {
  const data = provinces.filter((p) => p.band !== "normal");
  return new ScatterplotLayer<ProvinceWatchScore>({
    id: "south-province-watch",
    data,
    getPosition: (p) => [p.lng, p.lat],
    getRadius: (p) => 60 + p.score * 2,
    radiusMinPixels: 8,
    radiusMaxPixels: 28,
    getFillColor: (p) => {
      const c = WATCH_BAND_RGB[p.band] ?? WATCH_BAND_RGB.watch;
      return [c[0], c[1], c[2], 210] as [number, number, number, number];
    },
    stroked: true,
    getLineColor: [14, 14, 14, 230],
    lineWidthMinPixels: 1.5,
    pickable: true,
  });
}

// ── Flooddash southern GloFAS river reaches ──────────────────────────────────
// GloFAS discharge band → StatusLevel: emergency = critical.
export const DISCHARGE_BAND_RGB: Record<RiverDischargeBand, [number, number, number]> = statusRgbMap<RiverDischargeBand>({
  normal: "normal",
  watch: "watch",
  warning: "warning",
  emergency: "critical",
  unknown: "unknown",
});

export function southRiverCascadeLayer(reaches: SouthernRiverReach[]): Layer[] {
  return [
    new ScatterplotLayer<SouthernRiverReach>({
      id: "south-river-cascade",
      data: reaches,
      getPosition: (r) => [r.lng, r.lat],
      getRadius: 110,
      radiusMinPixels: 7,
      radiusMaxPixels: 22,
      getFillColor: (r) => {
        const c = DISCHARGE_BAND_RGB[r.band] ?? DISCHARGE_BAND_RGB.unknown;
        return [c[0], c[1], c[2], 230] as [number, number, number, number];
      },
      stroked: true,
      getLineColor: [255, 255, 255, 220],
      lineWidthMinPixels: 2,
      pickable: true,
    }) as Layer,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  FFPI map layer — flash-flood potential pins
// ─────────────────────────────────────────────────────────────────────────────
//
// Renders the top-N per-amphoe FFPI rows as a tinted dot layer over the
// watershed nodes. Colour is the same status palette used by the popup
// (normal → good, watch → warn, prepare → alert, critical → bad). Pins are
// sized by score so critical-band amphoes are immediately eye-catching.
//
// Z-order: sits ABOVE watershed markers (so FFPI wins the eye test) but
// BELOW floating chart overlays (chips / legends) so chips stay legible.

import { FfpiRow, ffpiBandToStatusLevel } from "../lib/flashFlood";
import type { FfpiBand } from "../lib/flashFlood";

const FFPI_PIN_RGB: Record<FfpiBand, [number, number, number]> = {
  normal:  [76, 194, 122],
  watch:   [240, 180, 41],
  prepare: [255, 154, 61],
  critical: [255, 107, 94],
};

interface FfpiPin {
  position: [number, number];
  band: FfpiBand;
  score: number;
  amphoe: string;
  tambon: string;
  rain24hMm: number | null;
  ewsStatus: number | null;
}

function pinsForRows(rows: FfpiRow[]): FfpiPin[] {
  const pins: FfpiPin[] = [];
  for (const r of rows) {
    if (r.ffpi.band === "normal") continue; // normal-band amphoes don't get a pin
    pins.push({
      position: [r.lng, r.lat],
      band: r.ffpi.band,
      score: r.ffpi.score,
      amphoe: r.amphoe,
      tambon: r.tambon,
      rain24hMm: r.rain24hMm,
      ewsStatus: r.ewsStatus,
    });
  }
  return pins;
}

export function ffpiPinsLayer(rows: FfpiRow[]): Layer[] {
  const pins = pinsForRows(rows);
  if (pins.length === 0) return [];

  // One ScatterplotLayer per band — keeps state loads cheap (no per-pin
  // data lookup, no filter accessors) and lets deck.gl pick the right
  // per-layer uniform colour without switching vertex-by-vertex.
  const layers: Layer[] = [];
  for (const band of ["watch", "prepare", "critical"] as FfpiBand[]) {
    const subset = pins.filter((p) => p.band === band);
    if (subset.length === 0) continue;
    const c = FFPI_PIN_RGB[band];
    layers.push(
      new ScatterplotLayer<FfpiPin>({
        id: `ffpi-pin-${band}`,
        data: subset,
        getPosition: (d) => d.position,
        getRadius: (d) => (band === "critical" ? 220 : band === "prepare" ? 170 : 130),
        radiusUnits: "meters",
        radiusMinPixels: band === "critical" ? 8 : 6,
        radiusMaxPixels: band === "critical" ? 18 : 14,
        getFillColor: [c[0], c[1], c[2], 230] as [number, number, number, number],
        stroked: true,
        getLineColor: [255, 255, 255, 230] as [number, number, number, number],
        lineWidthMinPixels: 1.5,
        pickable: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
      }) as Layer,
    );
  }
  return layers;
}

// Re-export of the FFPI surface so callers can render the popup in
// parallel with the layer without needing to import two paths.
export type { FfpiRow };
export { ffpiBandToStatusLevel };

// ─────────────────────────────────────────────────────────────────────────────
//  Metro route layer — watershed-as-subway line for the infographic
// ─────────────────────────────────────────────────────────────────────────────
//
// One PathLayer per line, drawn at 4 px width with status-coloured
// stroke and a thin white outline (the standard "subway map above the
// map" treatment). Stations sit on top via ScatterplotLayer — square
// for local stops, rounded-square for transfer, larger pill for
// terminus. Labels live in a TextLayer placed beside each station,
// offset direction depends on the line's direction of travel.

import { buildCascadeLine, buildLineGeometry, METRO, type MetroLine, type MetroStatus } from "../lib/metroLines";

const LINE_WIDTH_PX = 4;

function statusHex(status: MetroStatus): [number, number, number] {
  const hex = METRO.STATUS_COLOR[status];
  const v = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return [r, g, b];
}

function pickStationShape(kind: "terminus" | "transfer" | "local"): number {
  if (kind === "terminus") return 11;
  if (kind === "transfer") return 9;
  return 7;
}

export interface MetroLayerOptions {
  /** When true, fade the line slightly (60% α) so the basemap reads
   *  through. Default true — the layer sits on the live deck.gl canvas. */
  translucent: boolean;
}

export function metroRouteLayer(
  summaries: ZoneSummary[],
  options: Partial<MetroLayerOptions> = {},
): Layer[] {
  const translucent = options.translucent ?? true;
  const line: MetroLine = buildCascadeLine(summaries);
  const path = buildLineGeometry(line, 48);
  const out: Layer[] = [];

  // The line outline — a thicker white stroke behind the coloured line
  // so the diagram reads as a subway line over the basemap.
  out.push(
    new PathLayer<{ path: [number, number][] }>({
      id: "metro-line-outline",
      data: [{ path }],
      getPath: (d) => d.path,
      getColor: [255, 255, 255, 220] as [number, number, number, number],
      getWidth: LINE_WIDTH_PX + 3,
      widthUnits: "pixels",
      widthMinPixels: LINE_WIDTH_PX + 2,
      capRounded: true,
      jointRounded: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
  );

  const [r, g, b] = statusHex(line.overallStatus);
  out.push(
    new PathLayer<{ path: [number, number][] }>({
      id: "metro-line-tha-dee",
      data: [{ path }],
      getPath: (d) => d.path,
      getColor: [r, g, b, translucent ? 235 : 255] as [number, number, number, number],
      getWidth: LINE_WIDTH_PX,
      widthUnits: "pixels",
      widthMinPixels: 3,
      capRounded: true,
      jointRounded: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
  );

  // Stations — sized by kind, filled with status colour, bordered white.
  out.push(
    new ScatterplotLayer<typeof line.stations[number]>({
      id: "metro-stations",
      data: line.stations,
      getPosition: (s) => [s.lng, s.lat],
      getRadius: (s) => pickStationShape(s.kind),
      radiusUnits: "pixels",
      radiusMinPixels: pickStationShape("local"),
      radiusMaxPixels: pickStationShape("terminus") + 2,
      stroked: true,
      getFillColor: (s) => {
        const [sr, sg, sb] = statusHex(s.status);
        return [sr, sg, sb, 235] as [number, number, number, number];
      },
      getLineColor: [255, 255, 255, 245] as [number, number, number, number],
      lineWidthMinPixels: 1.5,
      pickable: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
  );

  // Labels — sit beside each station with a dark pill so the labels
  // remain legible on the basemap. English first, Thai below.
  out.push(
    new TextLayer<{ s: typeof line.stations[number] }>({
      id: "metro-station-labels-en",
      data: line.stations.map((s) => ({ s })),
      getPosition: (d) => [d.s.lng, d.s.lat],
      getText: (d) => d.s.labelEn,
      getSize: 12,
      getColor: [255, 255, 255, 230],
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      characterSet: "auto",
      getPixelOffset: (d) => labelOffsetFor(d.s),
      getTextAnchor: (d) => labelAnchorFor(d.s),
      getAlignmentBaseline: "center",
      getBackgroundColor: [10, 14, 20, 200],
      background: true,
      backgroundPadding: [3, 1],
      billboard: true,
      pickable: false,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
  );
  out.push(
    new TextLayer<{ s: typeof line.stations[number] }>({
      id: "metro-station-labels-th",
      data: line.stations.map((s) => ({ s })),
      getPosition: (d) => [d.s.lng, d.s.lat],
      getText: (d) => d.s.labelTh,
      getSize: 11,
      getColor: [255, 255, 255, 220],
      fontFamily: "'Inter', 'IBM Plex Sans Thai', sans-serif",
      fontWeight: 600,
      characterSet: "auto",
      getPixelOffset: (d) => thLabelOffsetFor(d.s),
      getTextAnchor: (d) => labelAnchorFor(d.s),
      getAlignmentBaseline: "center",
      getBackgroundColor: [10, 14, 20, 200],
      background: true,
      backgroundPadding: [3, 1],
      billboard: true,
      pickable: false,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
  );

  return out;
}

// Label placement — orient labels above/below in line direction so they
// don't sit on top of the line itself. For the MVP we just put labels
// above each station; a future iteration can flip sides per direction.

type MetroStationKind = "terminus" | "transfer" | "local";

function labelAnchorFor(_s: { kind: MetroStationKind }): "start" | "middle" | "end" {
  return "middle";
}

function labelOffsetFor(s: { kind: MetroStationKind }): [number, number] {
  void s;
  return [0, -16];
}

function thLabelOffsetFor(s: { kind: MetroStationKind }): [number, number] {
  void s;
  return [0, 18];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Flood risk overlay — waterways as wide status-coloured bands
// ─────────────────────────────────────────────────────────────────────────────
//
// Kid-readable flood visualisation: every river/canal LineString is
// coloured by the upstream WaterGauge's situation level. Normal cascade
// = thin cyan-blue line; calm river, no concern. Critical cascade =
// thick red line; the river itself reads as "this is flooding".
//
// Stroke width is scaled for CITY zoom (zoomBucket 1 / 2): 4-12 px
// depending on level — visible at any zoom but doesn't dominate
// province view either. The layer is opt-in via the "flood-risk-overlay"
// layer id, default on for OPS / FLOOD.
//
// Composes cleanly with existing layers: river-buffer (existing
// risk-polygon fill) + dam-status (existing reservoir markers)
// already paint the surrounding landscape; this layer adds the
// status-coloured strokes on top so a child sees the whole picture.

import {
  colorizeWaterways,
  riskStatusToRgba,
  type WaterwayFeatureProps,
  type WaterwayRiskStatus,
} from "../lib/floodRiskOverlay";

interface FloodRiskOverlayOptions {
  /** Reduce motion override for tests. */
  forceReducedMotion?: boolean;
}

export function floodRiskOverlayLayer(
  collection: FeatureCollection<LineString, Record<string, unknown>>,
  gauges: WaterGauge[],
  options: FloodRiskOverlayOptions = {},
): Layer[] {
  void options;
  const coloured = colorizeWaterways(collection, gauges);

  // Two layers: a wide, slightly-transparent halo (so the river is
  // visible even at high zoom where the actual OSM line is faint),
  // then the status-coloured stroke on top. Together they read like
  // a real "flood overlay" instead of a thin vector line.
  return [
    new GeoJsonLayer({
      id: "flood-risk-overlay-halo",
      data: coloured as unknown as FeatureCollection,
      pickable: false,
      stroked: true,
      filled: false,
      getLineColor: [255, 255, 255, 200],
      getLineWidth: (f: { properties?: WaterwayFeatureProps }) => (f.properties?.widthPx ?? 4) + 2,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 3,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
    new GeoJsonLayer({
      id: "flood-risk-overlay",
      data: coloured as unknown as FeatureCollection,
      pickable: true,
      stroked: true,
      filled: false,
      getLineColor: (f: { properties?: WaterwayFeatureProps }) =>
        riskStatusToRgba(f.properties?.riskStatus ?? "unknown"),
      getLineWidth: (f: { properties?: WaterwayFeatureProps }) => f.properties?.widthPx ?? 4,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 2,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
  ];
}

// Re-export the helper so App.tsx can compute the dominant risk for the
// layer palette chip without importing the lib directly.
export { dominantRisk as dominantFloodRisk } from "../lib/floodRiskOverlay";
export type { WaterwayRiskStatus };

// Re-export the Mahatat 3D model so App.tsx can mount it as a layer without
// importing the lib directly (kept in layers.ts to make the "every layer the
// dashboard uses" contract easier to grep).
export { mahatat3DLayer } from "../lib/mahatat3d";
export { MAHATAT_CENTER } from "../lib/mahatat3d";

// Re-export the hydrology map layers — district boundaries + flow arrows on
// every river + mountain/bay icons — so App.tsx can mount them as a single
// layer group without importing the lib directly. Together they form the
// printed-map-style watershed view (the Songkhla-style hydrology reference
// the user keeps asking for) at province zoom.
export {
  districtBoundariesLayer,
  hydroFlowArrowsLayer,
  mountainIconLayer,
  bayIconLayer,
  namedCanalsLayer,
  regionalRiversLayer,
  historicalFloodsLayer,
  provincialRoadsLayer,
  type MountainOptions,
  type NamedCanalProps,
  type RegionalRiverProps,
  type HistoricalFloodProps,
  type ProvincialRoadProps,
} from "../lib/hydroMap";
export { cityPoisLayer, type CityPoisProps } from "../lib/cityPois";
