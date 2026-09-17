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
import { ColumnLayer, GeoJsonLayer, PolygonLayer, PathLayer, TextLayer } from "@deck.gl/layers";
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
// River blues — vivid, NOT a faded pastel that disappears over the dark
// Carto basemap. The province-scale map needs the river network to read
// as the dominant visual element, so the trunk rivers get a darker core
// stroke AND a bright halo stroke (two-stroke technique = readable at
// any zoom + any background).
const RIVER_CORE: [number, number, number] = [38, 95, 195];      // trunk core: dark vivid blue
const RIVER_HALO: [number, number, number] = [130, 190, 255];    // bright halo around every river
const RIVER_BLUE_TRUNK: [number, number, number] = [38, 95, 195];
const ARROW_RED: [number, number, number] = [232, 50, 35];       // brighter red
const ARROW_RED_HALO: [number, number, number] = [255, 200, 195]; // pale halo for readability
const DISTRICT_BORDER: [number, number, number] = [120, 80, 160];
const DISTRICT_LABEL: [number, number, number] = [60, 50, 80];

// ─── Layer factories ──────────────────────────────────────────────────────

export function districtBoundariesLayer(
  collection: FeatureCollection<Polygon, { id: string; name: string | null; nameTh: string | null; admin_level: number }>,
): Layer[] {
  const out: Layer[] = [];

  // ── Pastel district fills — one deterministic colour per district id ──
  // The user wanted the printed-map look where each district reads as its
  // own pastel block (like the Songkhla reference). We hash the district
  // id to pick from a fixed Okabe–Ito-friendly palette so adjacent
  // districts never share a colour but the same district is always the
  // same colour across reloads.
  const PASTEL_PALETTE: [number, number, number][] = [
    [255, 230, 220], // peach
    [220, 240, 230], // mint
    [225, 225, 245], // lilac
    [245, 235, 210], // sand
    [220, 230, 245], // sky
    [240, 220, 235], // rose
    [225, 245, 225], // sage
    [235, 220, 220], // salmon
    [230, 235, 215], // cream-green
    [240, 230, 245], // pale-pink
    [220, 235, 235], // pale-teal
    [245, 225, 220], // apricot
    [220, 245, 230], // pale-mint
    [230, 220, 240], // lavender
    [245, 240, 215], // cream
  ];
  function hashDistrictId(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }
  out.push(
    new GeoJsonLayer<{ id: string; name: string | null; nameTh: string | null; admin_level: number }>({
      id: "district-boundaries-fill",
      data: collection,
      stroked: false,
      filled: true,
      pickable: false,
      getFillColor: (f) => {
        const id = (f.properties as { id?: string }).id ?? "0";
        const idx = hashDistrictId(id) % PASTEL_PALETTE.length;
        const [r, g, b] = PASTEL_PALETTE[idx]!;
        return [r, g, b, 175] as [number, number, number, number];
      },
    }) as Layer,
  );
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
 * Named canals — the major Thai-named channels in NST City Municipality.
 * Drawn THICKER than the OSM waterways so they read as the headline
 * features of the watershed. The Royal Project Canal (คลองพระราชดำริ)
 * is flagged as "under construction" and rendered with a dashed planned
 * reach + a solid built reach so the user can see which segment exists
 * and which is still in the works.
 */
export interface NamedCanalProps {
  id: string;
  name: string | null;
  nameEn: string | null;
  nameTh: string | null;
  waterway: string;
  flowClass: string;
  _canalStatus?: "complete" | "under-construction" | "planned";
  _plannedReach?: [number, number] | null;
}

export function namedCanalsLayer(
  collection: FeatureCollection<LineString, NamedCanalProps>,
): Layer[] {
  const out: Layer[] = [];

  // Split each canal into a "solid" reach (built) and a "dashed" reach
  // (planned / under construction). Most canals have only solid; the
  // Royal Project Canal has both — its plannedReach property marks the
  // vertex indices that are NOT YET built.
  const solidFeatures: { path: [number, number][]; name: string; class: string }[] = [];
  const dashedFeatures: { path: [number, number][]; name: string; class: string }[] = [];
  const labelFeatures: { pos: [number, number]; name: string; status: string | undefined }[] = [];
  for (const f of collection.features) {
    const g = f.geometry;
    if (g.type !== "LineString") continue;
    const coords = g.coordinates as [number, number][];
    if (coords.length < 2) continue;
    const props = f.properties;
    const isUnderConstruction = props._canalStatus === "under-construction";
    const planned = props._plannedReach;
    if (isUnderConstruction && planned && planned.length === 2) {
      const [lo, hi] = planned;
      // Planned reach (dashed) — from lo to hi
      const plannedSlice = coords.slice(lo, hi + 1);
      if (plannedSlice.length >= 2) {
        dashedFeatures.push({
          path: plannedSlice,
          name: props.nameTh ?? props.name ?? "",
          class: props.flowClass ?? "medium",
        });
      }
      // Built reach (solid) — everything else. If planned is [0, n], the
      // built portion is from n onwards; if planned is [0, k], built is k..end.
      const built1 = coords.slice(0, lo + 1);
      const built2 = coords.slice(hi);
      if (built1.length >= 2 && hi > 0) {
        solidFeatures.push({
          path: built1,
          name: props.nameTh ?? props.name ?? "",
          class: props.flowClass ?? "medium",
        });
      }
      if (built2.length >= 2) {
        solidFeatures.push({
          path: built2,
          name: props.nameTh ?? props.name ?? "",
          class: props.flowClass ?? "medium",
        });
      }
    } else {
      solidFeatures.push({
        path: coords,
        name: props.nameTh ?? props.name ?? "",
        class: props.flowClass ?? "medium",
      });
    }
    // Label at midpoint of full canal
    if (coords.length >= 2) {
      const mid = Math.floor(coords.length / 2);
      labelFeatures.push({
        pos: [coords[mid]![0], coords[mid]![1]],
        name: props.nameTh ?? props.name ?? "",
        status: props._canalStatus,
      });
    }
  }

  // Dashed planned reach (only the Royal Project Canal today)
  if (dashedFeatures.length > 0) {
    out.push(
      new GeoJsonLayer<{ path: [number, number][]; name: string; class: string }>({
        id: "named-canals-planned",
        data: { type: "FeatureCollection", features: dashedFeatures.map((d) => ({
          type: "Feature",
          properties: { name: d.name, class: d.class },
          geometry: { type: "LineString", coordinates: d.path },
        })) } as FeatureCollection<LineString, { name: string; class: string }>,
        stroked: true,
        filled: false,
        pickable: false,
        getLineColor: [220, 130, 30, 235] as [number, number, number, number], // orange — "under construction"
        getLineWidth: 4,
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 6,
        ...({ lineDashArray: [6, 4] } as Record<string, unknown>),
      } as unknown as Layer) as Layer,
    );
  }

  // Solid built canals (every canal + the built reach of the Royal Project)
  out.push(
    new GeoJsonLayer<{ path: [number, number][]; name: string; class: string }>({
      id: "named-canals",
      data: { type: "FeatureCollection", features: solidFeatures.map((d) => ({
        type: "Feature",
        properties: { name: d.name, class: d.class },
        geometry: { type: "LineString", coordinates: d.path },
      })) } as FeatureCollection<LineString, { name: string; class: string }>,
      stroked: true,
      filled: false,
      pickable: false,
      getLineColor: [25, 85, 195, 250] as [number, number, number, number],
      getLineWidth: 4.5,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 2.5,
      lineWidthMaxPixels: 7,
    }) as Layer,
  );

  // Thai name labels — small white pill, no halo (already thick enough)
  if (labelFeatures.length > 0) {
    out.push(
      new TextLayer<{ pos: [number, number]; name: string; status: string | undefined }>({
        id: "named-canals-labels",
        data: labelFeatures,
        getPosition: (d) => d.pos,
        getText: (d) => d.name,
        getSize: 12,
        getColor: [15, 50, 100, 245] as [number, number, number, number],
        fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
        fontWeight: 700,
        characterSet: "auto",
        background: true,
        backgroundPadding: [3, 2],
        getBackgroundColor: [255, 255, 255, 220],
        billboard: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

  // Special "under construction" badge for the Royal Project Canal so the
  // user sees the status at a glance.
  const rpc = collection.features.find((f) => (f.properties as NamedCanalProps)._canalStatus === "under-construction");
  if (rpc && rpc.geometry.type === "LineString") {
    const coords = rpc.geometry.coordinates as [number, number][];
    const mid = Math.floor(coords.length / 2);
    out.push(
      new TextLayer<{ pos: [number, number] }>({
        id: "named-canals-rpc-badge",
        data: [{ pos: [coords[mid]![0], coords[mid]![1]] }],
        getPosition: (d) => d.pos,
        getText: () => "(ระหว่างก่อสร้าง · under construction)",
        getSize: 10,
        getColor: [180, 80, 0, 245] as [number, number, number, number],
        fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
        fontWeight: 600,
        characterSet: "auto",
        background: true,
        backgroundPadding: [3, 1],
        getBackgroundColor: [255, 240, 220, 235],
        getPixelOffset: [0, -22],
        billboard: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

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
  // Two-stroke rivers: a bright halo first, then a darker core on top. The
  // halo keeps thin trunk rivers readable against the dark basemap and the
  // hillshade; the core carries the actual river-blue colour. Width scales
  // by class so trunk rivers stand out without burying the tributaries.
  out.push(
    new GeoJsonLayer<{ waterway?: string; flowClass?: string; lengthM?: number }>({
      id: "hydro-rivers-halo",
      data: collection,
      stroked: true,
      filled: false,
      pickable: false,
      getLineColor: [...RIVER_HALO, 220] as [number, number, number, number],
      getLineWidth: (f) => {
        const cls = (f.properties as { flowClass?: string }).flowClass;
        const w = (f.properties as { waterway?: string }).waterway;
        const lM = (f.properties as { lengthM?: number }).lengthM ?? 0;
        const isTrunk = cls === "fast" || lM >= 8000;
        if (isTrunk) return 10;
        if (w === "river") return 6;
        if (w === "canal") return 4;
        return 2.5;
      },
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1.5,
      lineWidthMaxPixels: 14,
    }) as Layer,
  );
  out.push(
    new GeoJsonLayer<{ waterway?: string; flowClass?: string; lengthM?: number }>({
      id: "hydro-rivers",
      data: collection,
      stroked: true,
      filled: false,
      pickable: false,
      getLineColor: [...RIVER_CORE, 235] as [number, number, number, number],
      getLineWidth: (f) => {
        const cls = (f.properties as { flowClass?: string }).flowClass;
        const w = (f.properties as { waterway?: string }).waterway;
        const lM = (f.properties as { lengthM?: number }).lengthM ?? 0;
        const isTrunk = cls === "fast" || lM >= 8000;
        if (isTrunk) return 6;
        if (w === "river") return 3.5;
        if (w === "canal") return 2.2;
        return 1.4;
      },
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 10,
    }) as Layer,
  );

  // Flow arrows — every ~1.5 km on trunk rivers, ~3 km on tributaries.
  // 3-4x bigger than before so the cascade direction reads at a glance.
  // Each arrow gets a white halo via the lineWidth trick so it pops
  // against the river core + the basemap.
  const arrows: { polygon: [number, number][]; tip: [number, number]; size: number }[] = [];
  for (const f of collection.features) {
    const g = f.geometry;
    if (g.type !== "LineString") continue;
    const coords = g.coordinates as [number, number][];
    const cls = (f.properties as { flowClass?: string }).flowClass ?? "medium";
    const w = (f.properties as { waterway?: string }).waterway ?? "stream";
    const lM = (f.properties as { lengthM?: number }).lengthM ?? 0;
    const isTrunk = cls === "fast" || lM >= 8000;
    const spacing = isTrunk ? 0.012 : 0.025; // ~1.3 km vs ~2.8 km (3x more arrows than before)
    const arrowDeg = isTrunk ? 0.0042 : 0.0028; // ~3x bigger than before
    const items = arrowsAlongLine(coords, spacing, arrowDeg);
    for (const a of items) {
      arrows.push({ polygon: a.polygon, tip: a.tip, size: isTrunk ? 1.6 : 1 });
    }
  }
  if (arrows.length > 0) {
    // Halo pass — draw the arrows slightly larger in pale red so they pop
    // against the river core.
    out.push(
      new PolygonLayer<{ polygon: [number, number][]; tip: [number, number]; size: number }>({
        id: "hydro-flow-arrows-halo",
        data: arrows,
        getPolygon: (d) => d.polygon,
        getFillColor: [...ARROW_RED_HALO, 200] as [number, number, number, number],
        getLineColor: [...ARROW_RED_HALO, 200] as [number, number, number, number],
        lineWidthMinPixels: 0.8,
        stroked: true,
        filled: true,
        pickable: false,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
      }) as Layer,
    );
    out.push(
      new PolygonLayer<{ polygon: [number, number][]; tip: [number, number]; size: number }>({
        id: "hydro-flow-arrows",
        data: arrows,
        getPolygon: (d) => d.polygon,
        getFillColor: [...ARROW_RED, 245] as [number, number, number, number],
        getLineColor: [...ARROW_RED, 245] as [number, number, number, number],
        lineWidthMinPixels: 1,
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
        getSize: 12,
        getColor: [...RIVER_BLUE_TRUNK, 245] as [number, number, number, number],
        fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
        fontWeight: 700,
        characterSet: "auto",
        background: true,
        backgroundPadding: [3, 2],
        getBackgroundColor: [255, 255, 255, 220],
        billboard: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

  return out;
}

/**
 * Khao Luang summit — a 3D triangular "mountain" spike rendered as a column.
 * The summit is the source of every river in NST (1,835 m, the tallest peak
 * in southern Thailand); making it visually obvious on the province-scale
 * hydrology map is the difference between "rivers on a basemap" and "water
 * comes from the mountain". Visible at zoom ≥ 8 (province) — below that
 * zoom it's a single pixel.
 *
 * The column is tapered (radius shrinks with height) so the silhouette
 * reads as a peak, not a cylinder. Renders ON TOP of the basemap + rivers
 * + district labels so the user can't miss it.
 */
export interface MountainOptions {
  position: { lng: number; lat: number };
  heightM: number;
  labelEn: string;
  labelTh: string;
}

export function mountainIconLayer(
  opts: MountainOptions,
  elevationScale = 1,
): Layer[] {
  const out: Layer[] = [];
  // Three tiers: base (large), mid (medium), top (small) — stacked to
  // approximate a tapered peak.
  const tiers = [
    { rM: 0.012, hM: 800, baseM: 0,    rgb: [125, 110, 90] as [number, number, number] },  // dark stone
    { rM: 0.008, hM: 600, baseM: 800,  rgb: [165, 150, 130] as [number, number, number] }, // mid stone
    { rM: 0.004, hM: 435, baseM: 1400, rgb: [210, 195, 170] as [number, number, number] }, // pale peak
  ];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]!;
    out.push(
      new ColumnLayer<{ pos: [number, number] }>({
        id: `mountain-${i}`,
        data: [{ pos: [opts.position.lng, opts.position.lat] }],
        diskResolution: 16,
        getPosition: (d) => d.pos,
        getElevation: () => t.hM * elevationScale,
        getFillColor: () => [t.rgb[0], t.rgb[1], t.rgb[2], 245] as [number, number, number, number],
        radius: t.rM,
        extruded: true,
        pickable: false,
        stroked: false,
        elevationScale,
      }) as Layer,
    );
  }
  // Label
  out.push(
    new TextLayer<{ pos: [number, number] }>({
      id: "mountain-label",
      data: [{ pos: [opts.position.lng, opts.position.lat] }],
      getPosition: (d) => d.pos,
      getText: () => `${opts.labelEn}\n${opts.labelTh}\n${opts.heightM.toLocaleString()} m`,
      getSize: 14,
      getColor: [60, 50, 40, 245] as [number, number, number, number],
      fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
      fontWeight: 700,
      characterSet: "auto",
      background: true,
      backgroundPadding: [4, 3],
      getBackgroundColor: [255, 250, 240, 235],
      getPixelOffset: [0, -40],
      billboard: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  );
  return out;
}

/**
 * Pak Phanang Bay — a flat teal disc at sea level + label. The "destination"
 * of the cascade — water flows from Khao Luang through Tha Dee → NST City
 * → into this bay. Rendered alongside the mountain so the user sees both
 * ends of the watershed story.
 */
export function bayIconLayer(
  position: { lng: number; lat: number },
  labelEn: string,
  labelTh: string,
): Layer[] {
  const out: Layer[] = [];
  // Flat ellipse made of stacked very-thin discs to give a "shimmer" feel
  out.push(
    new ColumnLayer<{ pos: [number, number] }>({
      id: "bay-disc",
      data: [{ pos: [position.lng, position.lat] }],
      diskResolution: 24,
      getPosition: (d) => d.pos,
      getElevation: () => 0,
      getFillColor: () => [70, 165, 200, 220] as [number, number, number, number],
      radius: 0.018,
      extruded: true,
      pickable: false,
      stroked: true,
      getLineColor: () => [255, 255, 255, 220] as [number, number, number, number],
      lineWidthMinPixels: 1,
    }) as Layer,
  );
  out.push(
    new TextLayer<{ pos: [number, number] }>({
      id: "bay-label",
      data: [{ pos: [position.lng, position.lat] }],
      getPosition: (d) => d.pos,
      getText: () => `${labelEn}\n${labelTh}`,
      getSize: 13,
      getColor: [20, 50, 70, 245] as [number, number, number, number],
      fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
      fontWeight: 700,
      characterSet: "auto",
      background: true,
      backgroundPadding: [4, 3],
      getBackgroundColor: [220, 240, 250, 235],
      getPixelOffset: [0, 24],
      billboard: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  );
  return out;
}


/**
 * Regional rivers — major rivers that cross province boundaries (or are
 * larger than a municipal canal). Distinct from `namedCanalsLayer`:
 *  - drawn THICKER (regional rivers are the hydrological skeleton)
 *  - dark navy core instead of bright blue (so they don't compete with
 *    the canals visually)
 *  - carry a "longest in southern Thailand" or similar badge
 *
 * Currently ships: แม่น้ำตาปี (Tapi River, 230 km, longest in the south).
 */
export interface RegionalRiverProps {
  id: string;
  name: string | null;
  nameEn: string | null;
  nameTh: string | null;
  waterway: string;
  flowClass: string;
  _riverLengthKm?: number;
  _riverBadge?: string;
  _riverSource?: { en: string; th: string };
  _riverMouth?: { en: string; th: string };
}

export function regionalRiversLayer(
  collection: FeatureCollection<LineString, RegionalRiverProps>,
): Layer[] {
  const out: Layer[] = [];
  const labelFeatures: {
    pos: [number, number];
    name: string;
    nameEn: string;
    nameTh: string;
    lengthKm: number | undefined;
    badge: string | undefined;
  }[] = [];
  const strokeFeatures: { path: [number, number][]; lengthKm: number | undefined }[] = [];

  for (const f of collection.features) {
    const g = f.geometry;
    if (g.type !== "LineString") continue;
    const coords = g.coordinates as [number, number][];
    if (coords.length < 2) continue;
    const props = f.properties;
    strokeFeatures.push({ path: coords, lengthKm: props._riverLengthKm });
    const idx = Math.max(1, Math.floor(coords.length * 0.3));
    labelFeatures.push({
      pos: [coords[idx]![0], coords[idx]![1]],
      name: props.nameTh ?? props.nameEn ?? "",
      nameEn: props.nameEn ?? "",
      nameTh: props.nameTh ?? "",
      lengthKm: props._riverLengthKm,
      badge: props._riverBadge,
    });
  }

  if (strokeFeatures.length > 0) {
    out.push(
      new GeoJsonLayer<{ path: [number, number][]; lengthKm: number | undefined }>({
        id: "regional-rivers-halo",
        data: { type: "FeatureCollection", features: strokeFeatures.map((s) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: s.path },
        })) } as unknown as FeatureCollection<LineString, Record<string, unknown>>,
        stroked: true,
        filled: false,
        pickable: false,
        getLineColor: [180, 210, 240, 220] as [number, number, number, number],
        getLineWidth: 9,
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 4,
        lineWidthMaxPixels: 14,
      }) as Layer,
    );
    out.push(
      new GeoJsonLayer<{ path: [number, number][]; lengthKm: number | undefined }>({
        id: "regional-rivers",
        data: { type: "FeatureCollection", features: strokeFeatures.map((s) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: s.path },
        })) } as unknown as FeatureCollection<LineString, Record<string, unknown>>,
        stroked: true,
        filled: false,
        pickable: false,
        getLineColor: [22, 60, 150, 250] as [number, number, number, number],
        getLineWidth: 5.5,
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 3,
        lineWidthMaxPixels: 9,
      }) as Layer,
    );
  }

  for (const lf of labelFeatures) {
    out.push(
      new TextLayer<{ pos: [number, number]; text: string }>({
        id: `regional-river-label-${lf.nameEn}`,
        data: [{ pos: lf.pos }],
        getPosition: (d) => d.pos,
        getText: () => `${lf.nameTh}\n${lf.nameEn}${lf.lengthKm ? ` · ${lf.lengthKm} km` : ""}`,
        getSize: 13,
        getColor: [10, 35, 90, 245] as [number, number, number, number],
        fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
        fontWeight: 700,
        characterSet: "auto",
        background: true,
        backgroundPadding: [4, 3],
        getBackgroundColor: [240, 248, 255, 240],
        billboard: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
    if (lf.badge) {
      out.push(
        new TextLayer<{ pos: [number, number]; text: string }>({
          id: `regional-river-badge-${lf.nameEn}`,
          data: [{ pos: lf.pos }],
          getPosition: (d) => d.pos,
          getText: () => `★ ${lf.badge}`,
          getSize: 10,
          getColor: [40, 80, 160, 245] as [number, number, number, number],
          fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
          fontWeight: 600,
          characterSet: "auto",
          background: true,
          backgroundPadding: [3, 2],
          getBackgroundColor: [255, 250, 230, 235],
          getPixelOffset: [0, -32],
          billboard: true,
          parameters: { depthWriteEnabled: false, depthCompare: "always" },
          pickable: false,
        }) as Layer,
      );
    }
  }

  return out;
}


/**
 * Historical flood polygons — hand-traced from GISTDA Sentinel-1 SAR flood
 * detection rasters. Currently ships one event (16-18 December 2024,
 * พ.ศ. 2567 — the same event that flooded 632 lanes in the Pak Phanang
 * basin and damaged 2,570 households across 7 districts). The polygons
 * carry severity + household counts so the renderer can colour them
 * high / medium / low and label with the affected district.
 *
 * Renders ONLY at province zoom (bucket 0). At city/street scale the
 * historical flood overlay is too coarse — the modern live data is what
 * the operator needs at that resolution.
 */
export interface HistoricalFloodProps {
  id: string;
  name: string | null;
  nameEn: string | null;
  nameTh: string | null;
  district: string;
  severity: "high" | "medium" | "low";
  households: number;
  source: string;
  eventStart: string;
  eventEnd: string;
}

const FLOOD_SEVERITY_COLOR: Record<string, { fill: [number, number, number]; stroke: [number, number, number] }> = {
  high:   { fill: [220, 30, 30],   stroke: [200, 0, 0] },
  medium: { fill: [240, 130, 30],  stroke: [200, 90, 0] },
  low:    { fill: [250, 200, 60],  stroke: [210, 160, 0] },
};

export function historicalFloodsLayer(
  collection: FeatureCollection<Polygon, HistoricalFloodProps>,
): Layer[] {
  const out: Layer[] = [];

  out.push(
    new GeoJsonLayer<HistoricalFloodProps>({
      id: "historical-floods-fill",
      data: collection,
      stroked: true,
      filled: true,
      pickable: true,
      getFillColor: (f) => {
        const sev = f.properties.severity ?? "medium";
        const [r, g, b] = FLOOD_SEVERITY_COLOR[sev]!.fill;
        return [r, g, b, 40] as [number, number, number, number];
      },
      getLineColor: (f) => {
        const sev = f.properties.severity ?? "medium";
        const [r, g, b] = FLOOD_SEVERITY_COLOR[sev]!.stroke;
        return [r, g, b, 220] as [number, number, number, number];
      },
      getLineWidth: 1.5,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
    }) as Layer,
  );

  const labelFeatures: { pos: [number, number]; text: string; households: number; severity: string }[] = [];
  for (const f of collection.features) {
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
    labelFeatures.push({
      pos: [cx, cy],
      text: `${f.properties.nameTh ?? f.properties.nameEn ?? ""}`,
      households: f.properties.households,
      severity: f.properties.severity,
    });
  }
  if (labelFeatures.length > 0) {
    out.push(
      new TextLayer<{ pos: [number, number]; text: string; households: number; severity: string }>({
        id: "historical-floods-labels",
        data: labelFeatures,
        getPosition: (d) => d.pos,
        getText: (d) => d.text,
        getSize: 11,
        getColor: [140, 20, 20, 240] as [number, number, number, number],
        fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
        fontWeight: 700,
        characterSet: "auto",
        background: true,
        backgroundPadding: [3, 1],
        getBackgroundColor: [255, 245, 240, 220],
        billboard: true,
        parameters: { depthWriteEnabled: false, depthCompare: "always" },
        pickable: false,
      }) as Layer,
    );
  }

  return out;
}
