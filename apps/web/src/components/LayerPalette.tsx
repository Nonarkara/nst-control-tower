import { useMemo, useState } from "react";
import type { FallbackTier } from "@nst/shared";
import {
  ALL_LAYERS,
  COMPUTED_LAYERS,
  LAYER_GROUP_LABEL,
  LENSES,
  satelliteFreshness,
  type LayerGroup,
  type LayerId,
  type LensId,
} from "../map/presets";

/** Per-layer health for the subset of toggles backed by a live feed. Lets the
 *  palette show *why* a layer is empty — "needs key" vs simply no features —
 *  instead of a silent dead toggle. */
export interface LayerStatus {
  tier?: FallbackTier | "loading";
  note?: string;
}

interface Props {
  lens: LensId;
  onLensChange: (l: LensId) => void;
  enabled: Set<LayerId>;
  onToggleLayer: (id: LayerId) => void;
  /** Feature counts per layer — when present, shown next to each label so
   *  the operator immediately sees "AIS 0" vs "AIS 14" without looking at the map. */
  counts?: Partial<Record<LayerId, number>>;
  /** Feed health per layer — drives the "needs key" pill on degraded feeds. */
  statuses?: Partial<Record<LayerId, LayerStatus>>;
}

const GROUP_ORDER: LayerGroup[] = ["municipality", "maritime", "mobility", "incidents", "open-data", "environment", "imagery"];

// Short, plain-language hint shown under a group header so an operator understands
// what the (often similar-looking) layers are for and how they interact — Rams:
// make it understandable. Only the satellite-heavy groups need one.
const GROUP_HINT: Partial<Record<LayerGroup, string>> = {
  imagery:
    "Map backdrops + satellite washes. Pick ONE base (Esri HD / MODIS / VIIRS / terrain); the colour overlays (rain · heat · haze · NO₂ · NDVI) each tint the whole map — one at a time. Hover any layer for detail.",
  environment:
    "Flood, water & earth-observation layers — the city's flood story. Hover any layer for what it shows.",
};

export function LayerPalette({ lens, onLensChange, enabled, onToggleLayer, counts, statuses }: Props) {
  // group → list of layers (preserve declaration order within each group)
  const grouped = useMemo(() => {
    const m = new Map<LayerGroup, typeof ALL_LAYERS>();
    for (const g of GROUP_ORDER) m.set(g, []);
    for (const l of ALL_LAYERS) m.get(l.group)?.push(l);
    return m;
  }, []);

  const [collapsed, setCollapsed] = useState<Record<LayerGroup, boolean>>(() => ({
    municipality: false,
    security: false,
    maritime: true,
    mobility: false,
    incidents: true,
    "open-data": true,
    environment: true,
    imagery: true,
  }));
  const toggleGroup = (g: LayerGroup) => setCollapsed((c) => ({ ...c, [g]: !c[g] }));

  const enabledByGroup = (g: LayerGroup) =>
    (grouped.get(g) ?? []).filter((l) => enabled.has(l.id)).length;

  return (
    <div className="col">
      <div>
        <div className="map-view-shortcuts" role="group" aria-label="Map views">
          {([{ id: "flood", label: "Flood" }, { id: "executive", label: "City" }, { id: "environment", label: "Air" }] as const).map(view => <button type="button" key={view.id} aria-pressed={lens === view.id} onClick={() => onLensChange(view.id)}>{view.label}</button>)}
        </div>
        <label className="eyebrow palette-eyebrow" htmlFor="lens-select">Advanced map views</label>
        <select id="lens-select" className="lens-select" value={lens}
          onChange={event => onLensChange(event.target.value as LensId)} aria-describedby="lens-description">
          {LENSES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        {/* One sentence under the picker. The full paragraph sat in a tinted,
            ruled box six lines tall — the rail spent more height explaining
            the control than the control itself took. */}
        <p id="lens-description" className="lens-explainer caption">
          {leadSentences(LENSES.find((l) => l.id === lens)?.describe ?? "")}
        </p>
      </div>

      <hr className="divider" />

      <div>
        <h2 className="eyebrow palette-eyebrow">Map overlays</h2>
        <p className="caption palette-intro">Picking a map view resets these. The number is how many items a layer has now.</p>
        <div className="layer-groups">
          {GROUP_ORDER.map((g) => {
            const list = grouped.get(g) ?? [];
            if (list.length === 0) return null;
            const on = enabledByGroup(g);
            const isCollapsed = collapsed[g];
            return (
              <section key={g} className={`layer-group ${isCollapsed ? "is-collapsed" : ""}`}>
                <button
                  type="button"
                  className="layer-group-head"
                  onClick={() => toggleGroup(g)}
                  aria-expanded={!isCollapsed}
                  aria-label={`${LAYER_GROUP_LABEL[g]} layers (${on} of ${list.length} on)`}
                >
                  <span className="layer-group-name mono">{LAYER_GROUP_LABEL[g]}</span>
                  <span className="layer-group-meta mono">{on}/{list.length}</span>
                  <span className="layer-group-chevron mono">{isCollapsed ? "▸" : "▾"}</span>
                </button>
                {!isCollapsed && GROUP_HINT[g] && (
                  <div className="caption palette-hint">
                    {GROUP_HINT[g]}
                  </div>
                )}
                {!isCollapsed && (
                  <div className="layer-toggles">
                    {list.map((l) => {
                      const isOn = enabled.has(l.id);
                      const status = statuses?.[l.id];
                      const needsKey = status?.tier === "unavailable";
                      const freshness = satelliteFreshness(l.id);
                      const fullTitle = freshness
                        ? `${l.describe}\n\nImagery date: ${freshness.date} (${freshness.label})`
                        : l.describe;
                      return (
                        <button
                          type="button"
                          key={l.id}
                          className={`layer-toggle ${isOn ? "on" : "off"}`}
                          role="checkbox"
                          aria-checked={isOn}
                          title={fullTitle}
                          aria-describedby={`layer-desc-${l.id}`}
                          onClick={() => onToggleLayer(l.id)}
                        >
                          <span className="row">
                            <span className="swatch" style={{ background: l.swatch }} aria-hidden="true" />
                            <span>{l.label}</span>
                            <span id={`layer-desc-${l.id}`} className="visually-hidden">{fullTitle}</span>
                          </span>
                          <span className="row palette-toggle-meta">
                            {freshness && (
                              <span className="mono caption layer-age" title={`Imagery date: ${freshness.date}`}>
                                {freshness.label}
                              </span>
                            )}
                            {/* Degraded feed (e.g. missing API key) — say so explicitly instead of a
                                silent "0" that looks like a bug. The note explains what's wrong. */}
                            {needsKey ? (
                              <span
                                className="mono caption layer-needs-key"
                                title={status?.note ?? "Feed unavailable — check API key / connectivity"}
                              >
                                needs key
                              </span>
                            ) : /* Computed/decorative layers have no feature collection — a "0" count would
                                falsely suggest a failed feed. Fall back to on/off for those. */
                            !COMPUTED_LAYERS.has(l.id) && counts != null && counts[l.id] != null ? (
                              <span
                                className={`mono caption layer-count ${counts[l.id]! > 0 ? "layer-count-ok" : "layer-count-zero"}`}
                                title={`${counts[l.id]!.toLocaleString()} features loaded`}
                              >
                                {counts[l.id]!.toLocaleString()}
                              </span>
                            ) : (
                              <span className="caption" aria-hidden="true">{isOn ? "on" : "off"}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Whole sentences up to ~140 characters (at least one) — never cut mid-word. */
export function leadSentences(text: string, max = 140): string {
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s.trim()}` : s.trim();
    if (out && next.length > max) break;
    out = next;
  }
  return out;
}
