/**
 * BuildingLegend — on-map key decoding the building type → colour scheme.
 *
 * Buildings are coloured by type (OSM tags, or a curated `mnType` override);
 * unclassified `building=yes` footprints stay neutral slate. This legend is the
 * single visual key for that scheme. Collapsible to stay out of the way; only
 * mounted when the buildings layer is enabled (wired in App).
 */

import { BUILDING_LEGEND } from "../map/layers";

function swatchCss(color: [number, number, number]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export function BuildingLegend() {
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
    </details>
  );
}
