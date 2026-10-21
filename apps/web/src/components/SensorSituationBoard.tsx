import type { AirQualityPoint, FallbackTier, RainfallStation, WaterGauge } from "@nst/shared";
import { ReferenceGauge } from "./ReferenceGauge";
import { PanelHeader } from "./PanelHeader";
import {
  bandLabel,
  bandStatus,
  situationLevelStatus,
  summarizeAir,
  summarizeRain,
  summarizeWater,
  type SituationBand,
} from "../lib/sensorSituation";
import type { StatusLevel } from "../lib/status";
import { StatusText } from "../lib/cityStatus";
import { aqiBand } from "../lib/worldStrip";

/**
 * SENSOR SITUATION — graphic understanding of what the city is facing.
 *
 * Water (FloodDash) leads; air (AirDash) rides alongside. Numbers, flow
 * direction, and concentration bars — not just a station list. Severity is a
 * plain label with its status glyph beside the figure; colour marks status only.
 */

interface Props {
  waterGauges: WaterGauge[];
  rainfall: RainfallStation[];
  airStations: AirQualityPoint[];
  ageMinutes: number;
  fallbackTier?: FallbackTier;
  onFocus: (lng: number, lat: number) => void;
  onShowWaterHeat?: () => void;
  onShowAirHeat?: () => void;
}

function fmt0(n: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}${unit}`;
}

function BandLabel({ band }: { band: SituationBand }) {
  return <StatusText level={bandStatus(band)}>{bandLabel(band)}</StatusText>;
}

export function SensorSituationBoard({
  waterGauges,
  rainfall,
  airStations,
  ageMinutes,
  fallbackTier,
  onFocus,
  onShowWaterHeat,
  onShowAirHeat,
}: Props) {
  const water = summarizeWater(waterGauges);
  const fullest = water.maxFullnessPct == null ? undefined : waterGauges.find(g => g.fullnessPct === water.maxFullnessPct);
  const rain = summarizeRain(rainfall);
  const air = summarizeAir(airStations);
  // Air speaks the same AQI words as the header ("moderate"), not a
  // separate CALM/WATCH scale that contradicted it.
  const airWords = aqiBand(air.maxAqi);
  const airLevel: StatusLevel =
    air.maxAqi == null ? "unknown" : air.maxAqi <= 50 ? "normal" : air.maxAqi <= 100 ? "watch" : air.maxAqi <= 150 ? "warning" : "critical";

  const overall: SituationBand =
    water.band === "critical" || rain.band === "critical" || air.band === "critical"
      ? "critical"
      : water.band === "elevated" || rain.band === "elevated" || air.band === "elevated"
        ? "elevated"
        : water.band === "watch" || rain.band === "watch" || air.band === "watch"
          ? "watch"
          : water.band === "unknown" || rain.band === "unknown" || air.band === "unknown"
            ? "unknown"
            : "calm";

  return (
    <section className="panel" aria-label="Sensor situation">
      <PanelHeader
        title="SENSOR SITUATION"
        ageMinutes={ageMinutes}
        fallbackTier={overall === "unknown" ? "unavailable" : fallbackTier}
        source="flooddash·airdash"
        // The overall band only speaks when it adds something: a gap in the
        // data. Otherwise it repeated the headline card and the WATER row
        // below ("WARNING", "ELEVATED", "ELEVATED") and the eye had no winner.
        actions={overall === "unknown" ? (
          <span aria-label={`Overall ${bandLabel(overall)}`}>
            <BandLabel band={overall} />
          </span>
        ) : undefined}
      />

      {(water.band === "unknown" || rain.band === "unknown" || air.band === "unknown") && (
        <p className="note" role="status">ข้อมูลเซนเซอร์ไม่ครบ · Some feeds have no usable readings; conditions are unknown.</p>
      )}

      {/* Water — FloodDash */}
      <section className="pc-section" aria-label="Water situation">
        <header className="sit-pane__hdr">
          <h3 className="sit-pane__title">WATER</h3>
          <BandLabel band={water.band} />
        </header>

        <dl className="pc-stats pc-stats--pair">
          <div>
            <dt>Stations</dt>
            <dd className="num">{water.stationCount}</dd>
          </div>
          <div>
            <dt>Overbank</dt>
            <dd>
              <span className="num">{water.overbank}</span>
              {water.overbank > 0 && <StatusText level="critical">Over bank</StatusText>}
            </dd>
          </div>
          <div>
            <dt>Rising</dt>
            <dd className="num">
              <span>
                <span aria-hidden="true">▲</span>
                {water.rising}
              </span>
            </dd>
          </div>
          <div>
            <dt>Max full</dt>
            <dd className="num">{fmt0(water.maxFullnessPct, "%")}</dd>
          </div>
        </dl>

        <ReferenceGauge label="Fullest channel" value={water.maxFullnessPct} unit="%" max={125}
          ticks={[0, 50, 100, 125]}
          thresholds={[{ at: 85, label: "Review", level: "warning" }, { at: 100, label: "Bank", level: "critical" }]}
          basis={`HII fullness · 85% local review policy; 100% bank. Gaps in percentage points.${fullest ? ` Station: ${fullest.stationCode ?? fullest.name}` : ""}`} />
        <ReferenceGauge label="Most rain in 24 h (one station)" value={rain.maxRain24h} unit="mm" max={150}
          ticks={[0, 50, 100, 150]}
          thresholds={[{ at: 35.1, label: "Heavy", level: "warning" }, { at: 90.1, label: "Very heavy", level: "critical" }]}
          basis="TMD 24-hour rain classes; past accumulation, not additional forecast rain." />

        {/* The worst gauge and its time to overtop are in the headline card
            at the top of this rail — not repeated here. */}

        {onShowWaterHeat && (
          <button type="button" className="btn" onClick={onShowWaterHeat}>
            Show water heatmap
          </button>
        )}
      </section>

      {/* Air — AirDash */}
      <section className="pc-section" aria-label="Air situation">
        <header className="sit-pane__hdr">
          <h3 className="sit-pane__title">AIR</h3>
          <StatusText level={airLevel}>{air.maxAqi == null ? "NO DATA" : airWords.label.toUpperCase()}</StatusText>
        </header>

        <dl className="pc-stats pc-stats--pair">
          <div>
            <dt>Stations</dt>
            <dd className="num">{air.withReading}/{air.stationCount || "—"}</dd>
          </div>
          <div>
            <dt>PM2.5</dt>
            <dd className="num">{fmt0(air.maxPm25)}</dd>
          </div>
          <div>
            <dt>AQI</dt>
            <dd className="num">{fmt0(air.maxAqi)}</dd>
          </div>
          <div>
            <dt>Unhealthy</dt>
            <dd className="num">{air.withReading ? `${Math.round(air.unhealthyShare * 100)}%` : "—"}</dd>
          </div>
        </dl>

        <ReferenceGauge label="Highest PM2.5" value={air.maxPm25} unit="µg/m³" max={100}
          ticks={[0, 25, 50, 75, 100]}
          thresholds={[{ at: 35.5, label: "Sensitive groups", level: "warning" }, { at: 55.5, label: "Unhealthy", level: "critical" }]}
          basis="US EPA 24h reference; source averaging window unverified. AQI retains its source scale." />

        {air.worst && (
          <button
            type="button"
            className="sit-worst"
            onClick={() => onFocus(air.worst!.lng, air.worst!.lat)}
          >
            <span className="pc-label">HOTTEST AIR</span>
            <span className="sit-worst__name">{air.worst.station}</span>
            <span className="sit-worst__meta num">
              PM2.5 {fmt0(air.worst.pm25)} · AQI {fmt0(air.worst.aqi)}
            </span>
          </button>
        )}

        {onShowAirHeat && (
          <button type="button" className="btn" onClick={onShowAirHeat}>
            Show air heatmap
          </button>
        )}
      </section>

      <p className="flood-meta">Reference scales: <a href="https://www5.tmd.go.th/info/เกณฑ์อากาศ" target="_blank" rel="noreferrer">TMD rain</a> · <a href="https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html" target="_blank" rel="noreferrer">US EPA 24h PM2.5</a></p>
      <footer className="pc-meta">
        Powered by{" "}
        <a className="link" href="https://flood.nonarkara.org" target="_blank" rel="noreferrer">FloodDash</a>
        {" · "}
        <span title="Air quality stack — Air4Thai PCD + AQICN, curated as AirDash">AirDash</span>
        {" by Dr.Non"}
      </footer>
    </section>
  );
}
