import type { AirQualityPoint, FallbackTier, RainfallStation, WaterGauge } from "@nst/shared";
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

// Bar scales are stated next to every bar. Fullness: 100% = water at the
// bank crest (the feed can exceed 100 when overbank; the bar just fills).
// Rain: 90 mm / 24 h is TMD's "very heavy" threshold. PM2.5: 55.5 µg/m³ is
// where US-EPA "unhealthy" begins.
const WATER_BAR_MAX = 100;
const RAIN_BAR_MAX = 90;
const PM25_BAR_MAX = 55.5;

function fmt1(n: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}${unit}`;
}

function fmt0(n: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}${unit}`;
}

function BandLabel({ band }: { band: SituationBand }) {
  return <StatusText level={bandStatus(band)}>{bandLabel(band)}</StatusText>;
}

function ConcentrationBar({
  label,
  value,
  max,
  unit,
  scale,
}: {
  label: string;
  value: number | null;
  max: number;
  unit: string;
  /** What a full bar means, in words. */
  scale: string;
}) {
  const pct = value == null ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="sit-bar">
      <div className="sit-bar__meta">
        <span>{label}</span>
        <span className="num">{fmt1(value, unit)}</span>
      </div>
      <span className="pc-bar" aria-hidden="true">
        <span className="pc-bar__fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="sit-bar__scale">{scale}</span>
    </div>
  );
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
          : "calm";

  return (
    <section className="panel" aria-label="Sensor situation">
      <PanelHeader
        title="SENSOR SITUATION"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="flooddash·airdash"
        actions={
          <span aria-label={`Overall ${bandLabel(overall)}`}>
            <BandLabel band={overall} />
          </span>
        }
      />

      {/* Water — FloodDash */}
      <section className="pc-section" aria-label="Water situation">
        <header className="sit-pane__hdr">
          <h3 className="sit-pane__title">WATER</h3>
          <BandLabel band={water.band} />
        </header>

        <dl className="pc-stats">
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

        <ConcentrationBar
          label="Fullest channel"
          value={water.maxFullnessPct}
          max={WATER_BAR_MAX}
          unit="%"
          scale="Full bar = water at the bank"
        />
        <ConcentrationBar
          label="Most rain in 24 h (one station)"
          value={rain.maxRain24h}
          max={RAIN_BAR_MAX}
          unit=" mm"
          scale="Full bar = 90 mm, very heavy rain"
        />

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

        <dl className="pc-stats">
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
            <dd className="num">{Math.round(air.unhealthyShare * 100)}%</dd>
          </div>
        </dl>

        <ConcentrationBar
          label="Highest PM2.5"
          value={air.maxPm25}
          max={PM25_BAR_MAX}
          unit=" µg/m³"
          scale="Full bar = 55.5 µg/m³, unhealthy"
        />

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
