import type { BuildingProperties } from "../map/layers";
import { useTwinBuilding } from "../hooks/useTwinBuilding";
import { API_BASE } from "../lib/apiBase";
import { StreetViewThumb } from "./StreetViewThumb";
import { Dialog } from "./Dialog";

interface Props {
  building: BuildingProperties | null;
  /** [lng, lat] where the building was picked — drives the Street View thumbnail. */
  coord?: [number, number] | null;
  onClose: () => void;
}

/**
 * Right-anchored, non-modal card showing the picked building's metadata.
 * Enhanced with digital-twin data: related sensors + live state from the twin store.
 * Escape or the Close button closes it; focus moves to the card and back.
 */
export function BuildingCard({ building, coord, onClose }: Props) {
  // Query the semantic twin for this building (hook runs unconditionally).
  const twin = useTwinBuilding(building?.id ?? null);
  if (!building) return null;

  const name = building.nameEn || building.name || building.nameTh || "Untitled building";
  const altName = building.nameTh && building.nameTh !== name ? building.nameTh : null;
  const osmId = building.id;

  // Find sensors that monitor this building
  const sensors = twin.related.filter(
    (r) => r.object.kind === "sensor" && (r.relation.predicate === "monitors" || r.relation.predicate === "located_in"),
  );

  return (
    <Dialog
      open
      modal={false}
      size="sm"
      onClose={onClose}
      eyebrow="NST · Building"
      title={name}
      description={altName ? <span lang="th">{altName}</span> : undefined}
    >
      <dl className="building-card-meta">
        {building.building && building.building !== "yes" && (
          <>
            <dt>TYPE</dt>
            <dd>{building.building}</dd>
          </>
        )}
        {building.levels != null && (
          <>
            <dt>LEVELS</dt>
            <dd>{building.levels}</dd>
          </>
        )}
        {building.height != null && (
          <>
            <dt>HEIGHT</dt>
            <dd>{building.height} m</dd>
          </>
        )}
        {building.operator && (
          <>
            <dt>OPERATOR</dt>
            <dd>{building.operator}</dd>
          </>
        )}
        <dt>OSM</dt>
        <dd className="num">{osmId}</dd>
      </dl>

      {/* ── Ground truth: Google Street View at this location ── */}
      {coord && (
        <section className="building-card-section" aria-label="Street View">
          <h3 className="eyebrow">STREET VIEW</h3>
          <StreetViewThumb coord={coord} />
        </section>
      )}

      {/* ── Digital Twin: Related Sensors ── */}
      {sensors.length > 0 && (
        <section className="building-card-section">
          <h3 className="eyebrow">SENSORS ({sensors.length})</h3>
          <ul className="building-card-sensors">
            {sensors.map((s) => (
              <li key={s.object.id}>
                <span className="sensor-name">{s.object.name}</span>
                <span className="sensor-pred">{s.relation.predicate}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Digital Twin: Latest State ── */}
      {twin.state.length > 0 && (
        <section className="building-card-section">
          <h3 className="eyebrow">LIVE STATE</h3>
          <div className="building-card-state">
            {twin.state.map((pt) => (
              <div key={`${pt.metric}-${pt.time}`} className="state-row">
                <span className="state-metric">{pt.metric}</span>
                <span className="state-value num">{pt.value.toFixed(1)}</span>
                <span className="state-source">{pt.source}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {twin.loading && (
        <div className="building-card-loading" role="status">
          <span className="dot loading" aria-hidden="true" /> Querying twin…
        </div>
      )}

      {/* Link to full twin object */}
      {twin.object && (
        <a
          href={`${API_BASE}/api/twin/objects/${encodeURIComponent(osmId)}`}
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          Open in Twin API →
        </a>
      )}
    </Dialog>
  );
}
