/**
 * BuildingLegend — on-map key decoding the building type → colour scheme.
 *
 * Buildings are coloured by type (OSM tags, or a curated `mnType` override);
 * unclassified `building=yes` footprints stay neutral slate. This legend is the
 * single visual key for that scheme. Collapsible to stay out of the way; only
 * mounted when the buildings layer is enabled (wired in App).
 *
 * It also carries the HEIGHT provenance, which is the more important half of
 * the honesty story. The 3D city is drawn with modelled heights — OSM
 * `height`/`building:levels` covers 0.21% of buildings in Nakhon Si Thammarat,
 * and no commercial dataset covers Thailand at all (measured; see
 * lib/buildingHeights.ts). Without this line the extruded city looks surveyed,
 * which is the one impression it must not give. `heightCensus` is refreshed by
 * buildingsLayer() on every layer build, so the counts describe what is
 * actually on screen rather than a hard-coded total.
 */

import { BUILDING_LEGEND, heightCensus } from "../map/layers";

function swatchCss(color: [number, number, number]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export function BuildingLegend() {
  const { total, measured } = heightCensus;
  const modelled = total - measured;

  return (
    <details className="building-legend" open>
      <summary className="mono">BUILDING TYPES</summary>
      <div className="building-legend-grid">
        {BUILDING_LEGEND.map((row) => (
          <div key={row.label} className="building-legend-row">
            <span
              className="building-legend-swatch"
              style={{ background: swatchCss(row.color) }}
              aria-hidden="true"
            />
            <span className="building-legend-label mono">{row.label}</span>
          </div>
        ))}
      </div>
      {total > 0 ? (
        <p className="building-legend-heights mono" data-testid="height-provenance">
          {`3D HEIGHTS: ${measured.toLocaleString("en-GB")} measured · ${modelled.toLocaleString("en-GB")} modelled`}
          <span className="building-legend-heights__note">
            {` OSM carries a real height on ${((measured / total) * 100).toFixed(2)}% of NST buildings; no open dataset covers Thailand. The rest is estimated from building type and footprint area — roughly ±1 storey for shophouses.`}
          </span>
        </p>
      ) : null}
    </details>
  );
}
