import type { NasaEarthReadings, FallbackTier } from "@nst/shared";
import {
  satelliteFreshness,
  type LayerId,
} from "../map/presets";
import { PanelHeader } from "./PanelHeader";

interface Props {
  enabledLayers: Set<LayerId>;
  onToggleLayer: (id: LayerId) => void;
  gistdaPoiCount: number;
  gistdaSolarCount: number;
  gistdaLandUseCount: number;
  floodZoneCount: number;
  waterwayCount: number;
  fisheryZoneCount: number;
  openIncidentCount: number;
  sheetsConfigured: boolean;
  nasaReadings: NasaEarthReadings | null;
  avgSolarIrrKWh: number | null;
  ageMinutes?: number;
  fallbackTier?: FallbackTier;
}

// Each EO layer paints the map by ONE measured satellite variable. The `what`
// line is shown under the toggle so an operator knows what they're looking at and
// why the layers differ — not just a cryptic acronym (Rams: make it understandable).
const EARTH_LAYERS: Array<{ id: LayerId; label: string; what: string }> = [
  { id: "satellite-imerg",   label: "Rain",  what: "NASA rainfall rate — where it's pouring now" },
  { id: "satellite-flood",   label: "Flood", what: "MODIS standing water — recent inundation" },
  { id: "satellite-lst",     label: "Heat",  what: "Land-surface temp — urban heat islands" },
  { id: "satellite-aerosol", label: "Haze",  what: "Aerosol depth — haze / PM2.5 proxy" },
  { id: "satellite-no2",     label: "NO₂",   what: "Tropospheric NO₂ — traffic + power plumes" },
  { id: "satellite-ndvi",    label: "NDVI",  what: "Vegetation greenness — drought / crops" },
];

const WORKFLOWS = [
  {
    title: "Flood watch",
    layers: "IMERG + MODIS flood + waterways",
    signal: "rain cells over drainage backflow zones",
  },
  {
    title: "Heat / haze",
    layers: "LST + AOD + NO2 + AQ trend",
    signal: "street-level health advisory context",
  },
  {
    title: "Coastal economy",
    layers: "SST + fisheries + night lights",
    signal: "small-boat and aquaculture exposure",
  },
  {
    title: "Solar rooftops",
    layers: "GISTDA LOD2 + building twin",
    signal: "rankable municipal solar candidates",
  },
];

export function EarthAlphaBrief({
  enabledLayers,
  onToggleLayer,
  gistdaPoiCount,
  gistdaSolarCount,
  gistdaLandUseCount,
  floodZoneCount,
  waterwayCount,
  fisheryZoneCount,
  openIncidentCount,
  sheetsConfigured,
  nasaReadings,
  avgSolarIrrKWh,
  ageMinutes,
  fallbackTier,
}: Props) {
  const activeEarthLayers = EARTH_LAYERS.filter((l) => enabledLayers.has(l.id));
  const floodFreshness = satelliteFreshness("satellite-flood");
  const imergFreshness = satelliteFreshness("satellite-imerg");
  const hasFloodStack = enabledLayers.has("satellite-flood") && enabledLayers.has("waterways");
  const hasHeatStack =
    enabledLayers.has("satellite-lst") ||
    enabledLayers.has("satellite-aerosol") ||
    enabledLayers.has("satellite-no2");

  return (
    <div className="col" style={{ gap: 8 }}>
      <PanelHeader
        title="EARTH OBS · NASA GIBS + GISTDA"
        source="nasa-gibs·gistda"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        actions={
          <span className="eyebrow mono" style={{ color: sheetsConfigured ? "var(--good)" : "var(--warn)" }}>
            SHEETS {sheetsConfigured ? "ON" : "READY"}
          </span>
        }
      />

      {/* ── LIVE READINGS — NASA MERRA-2 + GISTDA ── */}
      <div style={{ borderTop: "2px solid var(--data)", paddingTop: 8 }}>
        <div className="eyebrow mono" style={{ color: "var(--data)", marginBottom: 6 }}>
          LIVE READINGS · NASA MERRA-2{nasaReadings?.dataDate ? ` · ${nasaReadings.dataDate}` : ""}
        </div>
        <div className="marine-detail-grid">
          <div>
            <div className="eyebrow">TEMP · 2M</div>
            <div className="mono">
              {nasaReadings?.tempC != null ? `${nasaReadings.tempC.toFixed(1)}°C` : "—"}
            </div>
          </div>
          <div>
            <div className="eyebrow">PRECIP · DAY</div>
            <div className="mono" style={{
              color: (nasaReadings?.precipMmDay ?? 0) > 20 ? "var(--warn)" : undefined,
            }}>
              {nasaReadings?.precipMmDay != null ? `${nasaReadings.precipMmDay.toFixed(1)} mm` : "—"}
            </div>
          </div>
          <div>
            <div className="eyebrow">SOLAR · GISTDA</div>
            <div className="mono" style={{ color: "var(--gold)" }}>
              {avgSolarIrrKWh != null ? `${avgSolarIrrKWh.toFixed(1)} kWh/m²` : "—"}
            </div>
          </div>
          <div>
            <div className="eyebrow">SKY CLEAR</div>
            <div className="mono">
              {nasaReadings?.clearnessIndex != null
                ? `${(nasaReadings.clearnessIndex * 100).toFixed(0)}%`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="marine-detail-grid">
        <div>
          <div className="eyebrow">EO LAYERS ON</div>
          <div className="mono" style={{ color: activeEarthLayers.length ? "var(--accent)" : "var(--text-3)" }}>
            {activeEarthLayers.length}/{EARTH_LAYERS.length}
          </div>
        </div>
        <div>
          <div className="eyebrow">GISTDA POINTS</div>
          <div className="mono">{gistdaPoiCount.toLocaleString()}</div>
        </div>
        <div>
          <div className="eyebrow">SOLAR ROOFS</div>
          <div className="mono">{gistdaSolarCount.toLocaleString()}</div>
        </div>
        <div>
          <div className="eyebrow">LAND USE</div>
          <div className="mono">{gistdaLandUseCount.toLocaleString()}</div>
        </div>
        <div>
          <div className="eyebrow">FLOOD AREAS</div>
          <div className="mono" style={{ color: floodZoneCount ? "var(--warn)" : "var(--text-3)" }}>
            {floodZoneCount}
          </div>
        </div>
        <div>
          <div className="eyebrow">OPEN REPORTS</div>
          <div className="mono" style={{ color: openIncidentCount >= 5 ? "var(--warn)" : "var(--text)" }}>
            {openIncidentCount}
          </div>
        </div>
      </div>

      <div className="eyebrow mono" style={{ color: "var(--text-3)", lineHeight: 1.5, marginBottom: 2 }}>
        Satellite earth-observation overlays (NASA GIBS). Each tints the whole map by
        one measured signal — toggle one at a time to read it. Updates daily/sub-daily.
      </div>
      <div className="layer-toggles" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 4 }}>
        {EARTH_LAYERS.map((l) => {
          const on = enabledLayers.has(l.id);
          return (
            <button
              key={l.id}
              className={`layer-toggle ${on ? "on" : "off"}`}
              onClick={() => onToggleLayer(l.id)}
              aria-pressed={on}
              title={`${l.what} · ${on ? "tap to hide" : "tap to show"}`}
              style={{ cursor: "pointer", textAlign: "left", width: "100%", flexDirection: "column", alignItems: "stretch", gap: 1 }}
            >
              <span className="row" style={{ justifyContent: "space-between", width: "100%" }}>
                <span style={{ fontWeight: 600 }}>{l.label}</span>
                <span className="mono caption" style={{ color: on ? "var(--accent)" : "var(--text-3)" }}>{on ? "ON" : "off"}</span>
              </span>
              <span className="eyebrow" style={{ color: "var(--text-3)", lineHeight: 1.3, whiteSpace: "normal", textTransform: "none", letterSpacing: 0 }}>
                {l.what}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {WORKFLOWS.map((w) => (
          <div key={w.title} style={{ borderLeft: "2px solid var(--accent)", paddingLeft: 8 }}>
            <div className="spread" style={{ gap: 8 }}>
              <span>{w.title}</span>
              <span className="eyebrow mono" style={{ color: "var(--text-3)" }}>{w.layers}</span>
            </div>
            <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>{w.signal}</div>
          </div>
        ))}
      </div>

      <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
        {hasFloodStack ? "FLOOD STACK ACTIVE" : "TURN ON EAR LENS FOR FLOOD STACK"}
        {" · "}
        {hasHeatStack ? "HEAT/HAZE VISIBLE" : "HEAT/HAZE LAYERS AVAILABLE"}
      </div>
      <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
        IMERG {imergFreshness?.date ?? "n/a"} · FLOOD {floodFreshness?.date ?? "n/a"} · {waterwayCount.toLocaleString()} WATERWAYS · {fisheryZoneCount} FISHERY ZONES
      </div>
    </div>
  );
}
