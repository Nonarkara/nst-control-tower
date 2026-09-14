import type { NasaEarthReadings, FallbackTier } from "@nst/shared";
import {
  satelliteFreshness,
  type LayerId,
} from "../map/presets";
import { PanelHeader } from "./PanelHeader";
import { StatusText } from "../lib/cityStatus";

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

const HEAVY_PRECIP_MM = 20;
const MANY_OPEN_REPORTS = 5;


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
  const heavyPrecip = (nasaReadings?.precipMmDay ?? 0) > HEAVY_PRECIP_MM;

  return (
    <section className="panel" aria-label="Earth observation">
      <PanelHeader
        title="EARTH OBS · NASA GIBS + GISTDA"
        source="nasa-gibs·gistda"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        actions={
          <StatusText level={sheetsConfigured ? "normal" : "watch"}>
            SHEETS {sheetsConfigured ? "ON" : "READY"}
          </StatusText>
        }
      />

      {/* ── LIVE READINGS — NASA MERRA-2 + GISTDA ── */}
      <div className="pc-section">
        <h3 className="pc-label">
          Live readings · NASA MERRA-2{nasaReadings?.dataDate ? ` · ${nasaReadings.dataDate}` : ""}
        </h3>
        <dl className="pc-stats pc-stats--pair">
          <div>
            <dt>Temp · 2 m</dt>
            <dd className="num">{nasaReadings?.tempC != null ? `${nasaReadings.tempC.toFixed(1)}°C` : "—"}</dd>
          </div>
          <div>
            <dt>Precip · day</dt>
            <dd>
              <span className="num">
                {nasaReadings?.precipMmDay != null ? `${nasaReadings.precipMmDay.toFixed(1)} mm` : "—"}
              </span>
              {heavyPrecip && <StatusText level="watch">Heavy</StatusText>}
            </dd>
          </div>
          <div>
            <dt>Solar · GISTDA</dt>
            <dd className="num">{avgSolarIrrKWh != null ? `${avgSolarIrrKWh.toFixed(1)} kWh/m²` : "—"}</dd>
          </div>
          <div>
            <dt>Sky clear</dt>
            <dd className="num">
              {nasaReadings?.clearnessIndex != null ? `${(nasaReadings.clearnessIndex * 100).toFixed(0)}%` : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="pc-section">
        <dl className="pc-stats">
          <div>
            <dt>EO layers on</dt>
            <dd className="num">{activeEarthLayers.length}/{EARTH_LAYERS.length}</dd>
          </div>
          <div>
            <dt>GISTDA points</dt>
            <dd className="num">{gistdaPoiCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Solar roofs</dt>
            <dd className="num">{gistdaSolarCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Land use</dt>
            <dd className="num">{gistdaLandUseCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Flood areas</dt>
            <dd className="num">{floodZoneCount}</dd>
          </div>
          <div>
            <dt>Open reports</dt>
            <dd>
              <span className="num">{openIncidentCount}</span>
              {openIncidentCount >= MANY_OPEN_REPORTS && <StatusText level="watch">High</StatusText>}
            </dd>
          </div>
        </dl>
      </div>

      <div className="pc-section">
        <p className="note">
          Satellite earth-observation overlays (NASA GIBS). Each tints the whole map by
          one measured signal — toggle one at a time to read it. Updates daily/sub-daily.
        </p>
        <div className="layer-toggles eo-toggles" role="group" aria-label="Earth observation layers">
          {EARTH_LAYERS.map((l) => {
            const on = enabledLayers.has(l.id);
            return (
              <button
                key={l.id}
                type="button"
                className={`layer-toggle ${on ? "on" : "off"}`}
                onClick={() => onToggleLayer(l.id)}
                aria-pressed={on}
                title={`${l.what} · ${on ? "tap to hide" : "tap to show"}`}
              >
                <span className="eo-toggle__head">
                  <span>{l.label}</span>
                  <span className="eo-toggle__state" aria-hidden="true">{on ? "On" : "Off"}</span>
                </span>
                <span className="eo-toggle__what">{l.what}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ul className="pc-list" aria-label="Earth observation workflows">
        {WORKFLOWS.map((w) => (
          <li key={w.title} className="eo-workflow">
            <span className="pc-spread">
              <span className="eo-workflow__title">{w.title}</span>
              <span className="pc-meta">{w.layers}</span>
            </span>
            <span className="pc-meta">{w.signal}</span>
          </li>
        ))}
      </ul>

      <p className="pc-meta">
        {hasFloodStack ? "Flood stack active" : "Turn on EAR lens for flood stack"}
        {" · "}
        {hasHeatStack ? "Heat/haze visible" : "Heat/haze layers available"}
      </p>
      <p className="pc-meta num">
        IMERG {imergFreshness?.date ?? "n/a"} · FLOOD {floodFreshness?.date ?? "n/a"} · {waterwayCount.toLocaleString()} waterways · {fisheryZoneCount} fishery zones
      </p>
    </section>
  );
}
