import { CLASSIFIED_ROOF_COUNT } from "../lib/roofEvidence";
/**
 * MapLegend — one key for everything currently drawn, and nothing else.
 *
 * Rows appear only for layers that are on, so the key always matches the map.
 * Replaces the building-types-only legend that left dots, lines and polygons
 * unexplained. Collapsible so it can be tucked away over the map.
 */

import type { LayerId } from "../map/presets";
import { BUILDING_LEGEND, CCTV_CATEGORY_RGB, MAP_CAT, heightCensus } from "../map/layers";

type Mark = "dot" | "ring" | "line" | "arrow" | "fill";

interface Row {
  mark: Mark;
  color: string;
  label: string;
}

const rgb = (c: readonly number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
// Data colours come from the layer builders' own constants so the key can't drift.
const RIVER = rgb(MAP_CAT.blue);
const SKY = rgb(MAP_CAT.sky);
const GREEN = rgb(MAP_CAT.green);

const STATUS_DOTS: Row[] = [
  { mark: "dot", color: "var(--good)", label: "Gauge — normal" },
  { mark: "dot", color: "var(--warn)", label: "Gauge — watch (≥ 80% full)" },
  { mark: "dot", color: "var(--alert)", label: "Gauge — warning (≥ 90% full)" },
  { mark: "dot", color: "var(--bad)", label: "Gauge — over bank / critical" },
];

/** Legend rows per layer, in draw-meaning order. */
const LEGEND: Partial<Record<LayerId, Row[]>> = {
  waterways: [
    { mark: "line", color: RIVER, label: "River or canal (OpenStreetMap)" },
    { mark: "line", color: GREEN, label: "Drain or ditch" },
  ],
  "waterway-flow": [{ mark: "arrow", color: SKY, label: "Schematic channel orientation — not measured flow" }],
  "water-gauges": STATUS_DOTS,
  "level-posts": [{ mark: "ring", color: SKY, label: "GISTDA water-level post" }],
  "cctv-water-level": [{ mark: "dot", color: rgb(CCTV_CATEGORY_RGB.water), label: "Water-level camera" }],
  "cctv-cameras": [{ mark: "dot", color: rgb(CCTV_CATEGORY_RGB.traffic), label: "City camera (colour = camera type)" }],
  "dam-status": [{ mark: "dot", color: "var(--ink-2)", label: "Dam (colour = storage status)" }],
  "evac-villages": [
    { mark: "dot", color: "var(--bad)", label: "Village — urgent local assessment" },
    { mark: "dot", color: "var(--alert)", label: "Village — prepare local assessment" },
    { mark: "dot", color: "var(--warn)", label: "Village — watch (bigger = more people who need help)" },
    { mark: "ring", color: "var(--ink)", label: "White ring — register evacuation flag; verify locally" },
  ],
  "flood-extent-2025": [{ mark: "fill", color: "var(--alert)", label: "Flooded in Nov 2025 (GISTDA satellite)" }],
};

function Swatch({ mark, color }: { mark: Mark; color: string }) {
  return <span className={`map-legend__mark map-legend__mark--${mark}`} style={{ color }} aria-hidden="true" />;
}

export function MapLegend({ enabled }: { enabled: ReadonlySet<LayerId> }) {
  const rows = (Object.keys(LEGEND) as LayerId[]).filter((id) => enabled.has(id)).flatMap((id) => LEGEND[id]!);
  const buildings = enabled.has("municipality-buildings");
  const credit = enabled.has("satellite-esri") ? <p className="map-imagery-credit"><a href="https://goto.arcgisonline.com/maps/World_Imagery" target="_blank" rel="noreferrer">Imagery © Esri, Vantor, Earthstar Geographics, GIS User Community</a></p> : null;
  if (rows.length === 0 && !buildings) return credit;

  return (
    // Starts open on wide screens only — on laptops/tablets a long key would
    // cover the map it explains.
    <>
    <details className="map-legend" open={rows.length <= 5 || (typeof window !== "undefined" && window.innerWidth >= 1600)}>
      <summary>Map key</summary>
      <ul className="map-legend__rows">
        {rows.map((r) => (
          <li key={r.label}>
            <Swatch mark={r.mark} color={r.color} />
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
      {buildings && (
        <details className="map-legend__sub">
          <summary>Building types (visible when zoomed in)</summary>
          <ul className="map-legend__rows map-legend__rows--grid">
            {BUILDING_LEGEND.map((b) => (
              <li key={b.label}>
                <Swatch mark="fill" color={rgb(b.color)} />
                <span>{b.label}</span>
              </li>
            ))}
          </ul>
          {/* Height provenance. The 3D city is drawn with MODELLED heights:
              OSM carries a real `height` on 0.21% of buildings in Nakhon Si
              Thammarat and no commercial dataset covers Thailand at all
              (measured — see lib/buildingHeights.ts). Without this line the
              extruded city reads as surveyed, which is the one impression it
              must not give. `heightCensus` is refreshed by buildingsLayer() on
              every layer build, so these counts describe what is on screen.

              It lives here, in the legend the map actually renders, rather than
              in BuildingLegend.tsx — that component is no longer mounted
              anywhere, and a well-written honesty label on an orphaned
              component is worse than none, because it looks delivered. */}
          {heightCensus.total > 0 ? (
            <p className="map-legend__heights" data-testid="height-provenance">
              <strong>
                3D heights: {heightCensus.measured} height-tagged ·{" "}
                {heightCensus.total - heightCensus.measured} modelled
              </strong>
              <span>
                Heights use source tags where available, otherwise type/area estimates.
                Source tags are not verified surveys. 3D uses neutral masonry and
                schematic roofs at 1:1 height. With Esri imagery at city zoom in3D, aerial pixels are projected onto roof surfaces; this adds image detail, not surveyed roof geometry or facade textures. {CLASSIFIED_ROOF_COUNT} roofs have aerial-reviewed form; the rest remain unverified neutral caps, not confirmed flat roofs. Roof dimensions and materials are unmeasured.
                Satellite-derived infill footprints: Microsoft Global ML Buildings (CDLA2). Image dates and completeness are unverified; no roof shape or height is supplied by that footprint detection. Type colours apply to 2D footprints. The chedi is an authored bell-and-spire reconstruction aligned approximately to the aerial-checked round OSM footprint; its surface detail is not surveyed.
              </span>
            </p>
          ) : null}
        </details>
      )}
    </details>
    {credit}
    </>
  );
}
