/**
 * hydroMap — province-scale hydrology rendering.
 *
 * Renders the watershed the way a printed hydrogeology map reads: every
 * river + canal drawn as a thin blue line, every district as a dashed
 * boundary with its name at the centroid, and red arrowheads along the
 * rivers pointing downstream so a 5-year-old can trace "water comes from
 * Khao Luang → flows through Khiri Wong → Lan Saka → NST City → Pak
 * Phanang Bay" without reading a label.
 *
 * Sibling to the kid-readable flood-risk-overlay (which colours rivers
 * by nearest-gauge status) and the metro subway line (which only renders
 * the cascade). This is the BASELINE provincial hydrology view, the way
 * RID's printed maps look. The other two add layers of interpretation
 * on top.
 *
 * The arrows are static triangle polygons computed from each waterway's
 * geometry — flow direction is taken from the OSM way order (mappers
 * conventionally trace upstream → downstream, and `flowClass: "fast"`
 * ways are flipped automatically when the downhill direction is
 * confidently reversed; see lib/thaDee.ts).
 */

import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import { GeoJsonLayer, PolygonLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

// ─── Geometry helpers ──────────────────────────────────────────────────────

function lineLength(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [x1, y1] = coords[i - 1]!;
    const [x2, y2] = coords[i]!;
    total += Math.hypot(x2 - x1, y2 - y1);
  }
  return total;
}

/**
 * Place N arrows along a line, spaced ~ARROW_SPACING_DEG apart. Each
 * arrow is a 3-point triangle whose tip points along the local line
 * direction. Returns the array of arrow polygons + their positions.
 */
function arrowsAlongLine(
  coords: [number, number][],
  spacingDeg: number,
  arrowDeg: number,
): { polygon: [number, number][]; tip: [number, number]; bearing: number }[] {
  if (coords.length < 2) return [];
  const total = lineLength(coords);
  if (total === 0) return [];
  const n = Math.max(2, Math.round(total / spacingDeg));
  const out: { polygon: [number, number][]; tip: [number, number]; bearing: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    // Find the line position at parameter t
    const target = t * total;
    let acc = 0;
    let segIdx = 0;
    for (; segIdx < coords.length - 1; segIdx++) {
      const [x1, y1] = coords[segIdx]!;
      const [x2, y2] = coords[segIdx + 1]!;
      const seg = Math.hypot(x2 - x1, y2 - y1);
      if (acc + seg >= target) break;
      acc += seg;
    }
    if (segIdx >= coords.length - 1) segIdx = coords.length - 2;
    const [x1, y1] = coords[segIdx]!;
    const [x2, y2] = coords[segIdx + 1]!;
    const localT = (target - acc) / Math.max(1e-12, Math.hypot(x2 - x1, y2 - y1));
    const tipX = x1 + (x2 - x1) * localT;
    const tipY = y1 + (y2 - y1) * localT;
    // Direction angle (atan2 of segment vector, 0 = east, +π/2 = north)
    const bearing = Math.atan2(y2 - y1, x2 - x1);
    // Triangle: tip at (tipX, tipY); base perpendicular to bearing, behind tip
    const cos = Math.cos(bearing);
    const sin = Math.sin(bearing);
    // Tip is forward; base centre is `arrowDeg` behind the tip
    const bx = tipX - cos * arrowDeg;
    const by = tipY - sin * arrowDeg;
    // Wings spread perpendicular by 0.6× arrowDeg
    const wing = arrowDeg * 0.55;
    const px1 = bx + (-sin) * wing;
    const py1 = by + cos * wing;
    const px2 = bx - (-sin) * wing;
    const py2 = by - cos * wing;
    out.push({
      polygon: [
        [tipX, tipY],
        [px1, py1],
        [px2, py2],
      ],
      tip: [tipX, tipY],
      bearing,
    });
  }
  return out;
}

// ─── Palette ──────────────────────────────────────────────────────────────

const RIVER_BLUE: [number, number, number] = [70, 130, 200];
const RIVER_BLUE_TRUNK: [number, number, number] = [50, 100, 180];
const ARROW_RED: [number, number, number] = [220, 50, 47];
const DISTRICT_BORDER: [number, number, number] = [120, 80, 160];
const DISTRICT_LABEL: [number, number, number] = [60, 50, 80];

// ─── Layer factories ──────────────────────────────────────────────────────

export function districtBoundariesLayer(
  collection: FeatureCollection<Polygon, { id: string; name: string | null; nameTh: string | null; admin_level: number }>,
): Layer[] {
  const out: Layer[] = [];
  // Dashed outline. The GeoJsonLayer type doesn't surface lineDashArray
  // in its props; deck.gl accepts it via the PathLayer it composes for
  // stroking, so we pass it through with a typed cast.
  out.push(
    new GeoJsonLayer<unknown>({
      id: "district-boundaries",
      data: collection,
      stroked: true,
      filled: false,
      pickable: false,
      getLineColor: [...DISTRICT_BORDER, 220] as [number, number, number, number],
      getLineWidth: 1.2,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      ...({ lineDashArray: [4, 3] } as Record<string, unknown>),
    } as unknown as Layer) as Layer,
  );
  // Labels at the centroid of each polygon
  const labelFeatures: { pos: [number, number]; text: string }[] = [];
  for (const f of collection.features) {
    const p = f.properties;
    const name = p.nameTh ?? p.name ?? null;
    if (!name) continue;
    // Compute polygon centroid (simple average of outer ring vertices — adequate
    // for OSM district polygons which are mostly convex).
    const ring = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : null;
    if (!ring || ring.length === 0) continue;
    let sx = 0;
    let sy = 0;
    for (const c of ring) {
      sx += c[0]!;
      sy += c[1]!;
    }
    const cx = sx / ring.length;
    const cy = sy / ring.length;
    labelFeatures.push({ pos: [cx, cy], text: name });
  }
  out.push(
    new TextLayer<{ pos: [number, number]; text: string }>({
      id: "district-boundaries-labels",
      data: labelFeatures,
      getPosition: (d) => d.pos,
      getText: (d) => d.text,
      getSize: 12,
      getColor: [...DISTRICT_LABEL, 230] as [number, number, number, number],
      fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
      fontWeight: 500,
      characterSet: "auto",
      background: true,
      backgroundPadding: [3, 1],
      getBackgroundColor: [255, 255, 255, 200],
      billboard: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  );
  return out;
}

/**
 * River lines + flow-direction arrows. Trunk rivers (Tha Dee, named
 * rivers, ≥8 km) get a thicker line + bigger arrows; the rest are thin
 * background hydrology.
 */
export function hydroFlowArrowsLayer(
  collection: FeatureCollection<LineString, { id?: string; name?: string | null; nameTh?: string | null; waterway?: string; flowClass?: string; lengthM?: number }>,
): Layer[] {
  const out: Layer[] = [];
  // All rivers as a single GeoJsonLayer — OSM-derived waterways.geojson
  // already has valid geometry, so we skip normalize.
  out.push(
    new GeoJsonLayer<{ waterway?: string; flowClass?: string; lengthM?: number }>({
      id: "hydro-rivers",
      data: collection,
      stroked: true,
      filled: false,
      pickable: false,
      getLineColor: [...RIVER_BLUE, 230] as [number, number, number, number],
      getLineWidth: (f) => {
        const cls = (f.properties as { flowClass?: string }).flowClass;
        const w = (f.properties as { waterway?: string }).waterway;
        if (w === "river" && cls === "fast") return 3.5;
        if (w === "river") return 2;
        return 1.2;
      },
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 5,
    }) as Layer,
  );

  // Flow arrows — sample every ~3 km of river length, draw a red triangle
  // pointing downstream. Trunk rivers get larger arrows.
  const arrows: { polygon: [number, number][]; tip: [number, number]; size: number }[] = [];
  for (const f of collection.features) {
    const g = f.geometry;
    if (g.type !== "LineString") continue;
    const coords = g.coordinates as [number, number][];
    const cls = (f.properties as { flowClass?: string }).flowClass ?? "medium";
    const w = (f.properties as { waterway?: string }).waterway ?? "stream";
    const isTrunk = cls === "fast" || (f.properties as { lengthM?: number }).lengthM! >= 8000;
    const spacing = isTrunk ? 0.025 : 0.05; // ~2.8 km vs ~5.5 km
    const arrowDeg = isTrunk ? 0.0014 : 0.0010;
    const items = arrowsAlongLine(coords, spacing, arrowDeg);
    for (const a of items) {
      arrows.push({ polygon: a.polygon, tip: a.tip, size: isTrunk ? 1.4 : 1 });
    }
  }
  if (arrows.length > 0) {
    out.push(
      new PolygonLayer<{ polygon: [number, number][]; tip: [number, number]; size: number }>({
        id: "hydro-flow-arrows",
        data: arrows,
        getPolygon: (d) => d.polygon,
        getFillColor: [...ARROW_RED, 235] as [number, number, number, number],
        getLineColor: [...ARROW_RED, 235] as [number, number, number, number],
        lineWidthMinPixels: 0.5,
        stroked: true,
        filled: true,
        pickable: false,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
      }) as Layer,
    );
  }

  // Major river labels (only named fast rivers — non-trunk rivers would
  // drown the map in text)
  const labelFeatures: { pos: [number, number]; text: string; cls: string }[] = [];
  for (const f of collection.features) {
    const p = f.properties;
    const nm = p.nameTh ?? p.name ?? null;
    const cls = p.flowClass ?? "medium";
    if (!nm || cls !== "fast") continue;
    const g = f.geometry;
    if (g.type !== "LineString") continue;
    const ring = g.coordinates as [number, number][];
    if (ring.length < 2) continue;
    // Label at 40% along the line (closer to the upstream end so it doesn't
    // collide with the city)
    const idx = Math.max(1, Math.floor(ring.length * 0.4));
    labelFeatures.push({
      pos: [ring[idx]![0], ring[idx]![1]],
      text: nm,
      cls,
    });
  }
  if (labelFeatures.length > 0) {
    out.push(
      new TextLayer<{ pos: [number, number]; text: string; cls: string }>({
        id: "hydro-river-labels",
        data: labelFeatures,
        getPosition: (d) => d.pos,
        getText: (d) => d.text,
        getSize: 11,
        getColor: [...RIVER_BLUE_TRUNK, 240] as [number, number, number, number],
        fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
        fontWeight: 600,
        characterSet: "auto",
        background: true,
        backgroundPadding: [2, 1],
        getBackgroundColor: [255, 255, 255, 200],
        billboard: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

  return out;
}
