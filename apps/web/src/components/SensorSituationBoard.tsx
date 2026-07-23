import type { AirQualityPoint, FallbackTier, RainfallStation, WaterGauge } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import {
  bandLabel,
  summarizeAir,
  summarizeRain,
  summarizeWater,
  thaDeeFlowSteps,
  type SituationBand,
} from "../lib/sensorSituation";

/**
 * SENSOR SITUATION — graphic understanding of what the city is facing.
 *
 * Water (FloodDash) leads; air (AirDash) rides alongside. Numbers, flow
 * direction, and concentration bars — not just a station list. Rams
 * structure with Lichtenstein pop accents on severity so a serious board
 * can still feel alive.
 */

const BAND_VAR: Record<SituationBand, string> = {
  calm: "var(--rt-green)",
  watch: "var(--rt-yellow)",
  elevated: "var(--rt-orange)",
  critical: "var(--rt-red)",
};

const BAND_INK: Record<SituationBand, string> = {
  calm: "var(--rt-glyph)",
  watch: "var(--rt-glyph-dark)",
  elevated: "var(--rt-glyph)",
  critical: "var(--rt-glyph)",
};

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

function fmt1(n: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}${unit}`;
}

function fmt0(n: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}${unit}`;
}

function trendGlyph(t: WaterGauge["trend"] | "unknown"): string {
  if (t === "rising") return "▲";
  if (t === "falling") return "▼";
  if (t === "stable") return "→";
  return "·";
}

function ConcentrationBar({
  label,
  value,
  max,
  color,
  unit,
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
  unit: string;
}) {
  const pct = value == null ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="ssb-bar" title={`${label}: ${fmt1(value, unit)}`}>
      <div className="ssb-bar__meta mono">
        <span>{label}</span>
        <span>{fmt1(value, unit)}</span>
      </div>
      <div className="ssb-bar__track">
        <div className="ssb-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
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
  const flow = thaDeeFlowSteps(waterGauges);

  const overall: SituationBand =
    water.band === "critical" || rain.band === "critical" || air.band === "critical"
      ? "critical"
      : water.band === "elevated" || rain.band === "elevated" || air.band === "elevated"
        ? "elevated"
        : water.band === "watch" || rain.band === "watch" || air.band === "watch"
          ? "watch"
          : "calm";

  return (
    <div className="ssb">
      <PanelHeader
        title="SENSOR SITUATION"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="flooddash·airdash"
        actions={
          <span
            className="ssb-burst mono"
            style={{ background: BAND_VAR[overall], color: BAND_INK[overall] }}
            aria-label={`Overall ${bandLabel(overall)}`}
          >
            {bandLabel(overall)}
          </span>
        }
      />

      {/* Water — FloodDash */}
      <section className="ssb-pane ssb-pane--water" aria-label="Water situation">
        <header className="ssb-pane__hdr">
          <span className="ssb-pane__title mono">WATER</span>
          <span className="ssb-pane__pow mono" style={{ background: BAND_VAR[water.band], color: BAND_INK[water.band] }}>
            {bandLabel(water.band)}
          </span>
        </header>

        <div className="ssb-kpi-row">
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">STATIONS</span>
            <span className="ssb-kpi__val mono">{water.stationCount}</span>
          </div>
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">OVERBANK</span>
            <span className="ssb-kpi__val mono" style={{ color: water.overbank > 0 ? "var(--rt-red)" : undefined }}>
              {water.overbank}
            </span>
          </div>
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">RISING</span>
            <span className="ssb-kpi__val mono" style={{ color: water.rising > 0 ? "var(--rt-orange)" : undefined }}>
              ▲{water.rising}
            </span>
          </div>
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">MAX FULL</span>
            <span className="ssb-kpi__val mono">{fmt0(water.maxFullnessPct, "%")}</span>
          </div>
        </div>

        <ConcentrationBar
          label="Channel fullness (peak)"
          value={water.maxFullnessPct}
          max={120}
          color="var(--rt-blue)"
          unit="%"
        />
        <ConcentrationBar
          label="Rain 24 h (peak station)"
          value={rain.maxRain24h}
          max={120}
          color="var(--rt-blue)"
          unit=" mm"
        />

        {flow.length >= 2 && (
          <div className="ssb-flow" aria-label="Tha Dee flow direction">
            <div className="ssb-flow__label mono">FLOW · คลองท่าดี → CITY</div>
            <div className="ssb-flow__track">
              {flow.map((step, i) => (
                <button
                  key={step.nameEn}
                  type="button"
                  className="ssb-flow__node"
                  onClick={() => onFocus(step.lng, step.lat)}
                  title={`${step.name} / ${step.nameEn}`}
                  style={{
                    borderColor: step.situationLevel >= 5
                      ? "var(--rt-red)"
                      : step.situationLevel >= 4
                        ? "var(--rt-orange)"
                        : "var(--ink)",
                  }}
                >
                  <span className="ssb-flow__name">{step.name}</span>
                  <span className="ssb-flow__num mono">
                    {fmt1(step.levelM, " m")} {trendGlyph(step.trend)}
                  </span>
                  <span className="ssb-flow__fb mono">
                    {step.freeboardM == null
                      ? "—"
                      : step.freeboardM >= 0
                        ? `${fmt1(step.freeboardM)} m free`
                        : `${fmt1(-step.freeboardM)} m OVER`}
                  </span>
                  {i < flow.length - 1 && <span className="ssb-flow__arrow" aria-hidden>》</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {water.worst && (
          <button
            type="button"
            className="ssb-worst"
            onClick={() => onFocus(water.worst!.lng, water.worst!.lat)}
          >
            <span className="mono ssb-worst__tag">HOTTEST GAUGE</span>
            <span className="ssb-worst__name">{water.worst.name}</span>
            <span className="mono ssb-worst__meta">
              L{water.worst.situationLevel} · {fmt1(water.worst.levelMsl, " m")} · {water.worst.trend}
            </span>
          </button>
        )}

        {onShowWaterHeat && (
          <button type="button" className="ssb-heat-btn mono" onClick={onShowWaterHeat}>
            SHOW WATER HEATMAP
          </button>
        )}
      </section>

      {/* Air — AirDash */}
      <section className="ssb-pane ssb-pane--air" aria-label="Air situation">
        <header className="ssb-pane__hdr">
          <span className="ssb-pane__title mono">AIR</span>
          <span className="ssb-pane__pow mono" style={{ background: BAND_VAR[air.band], color: BAND_INK[air.band] }}>
            {bandLabel(air.band)}
          </span>
        </header>

        <div className="ssb-kpi-row">
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">STATIONS</span>
            <span className="ssb-kpi__val mono">{air.withReading}/{air.stationCount || "—"}</span>
          </div>
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">PM2.5</span>
            <span className="ssb-kpi__val mono">{fmt0(air.maxPm25)}</span>
          </div>
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">AQI</span>
            <span className="ssb-kpi__val mono">{fmt0(air.maxAqi)}</span>
          </div>
          <div className="ssb-kpi">
            <span className="ssb-kpi__label mono">UNHEALTHY</span>
            <span className="ssb-kpi__val mono">{Math.round(air.unhealthyShare * 100)}%</span>
          </div>
        </div>

        <ConcentrationBar
          label="PM2.5 concentration (peak)"
          value={air.maxPm25}
          max={150}
          color="var(--rt-yellow)"
          unit=" µg/m³"
        />

        {air.worst && (
          <button
            type="button"
            className="ssb-worst"
            onClick={() => onFocus(air.worst!.lng, air.worst!.lat)}
          >
            <span className="mono ssb-worst__tag">HOTTEST AIR</span>
            <span className="ssb-worst__name">{air.worst.station}</span>
            <span className="mono ssb-worst__meta">
              PM2.5 {fmt0(air.worst.pm25)} · AQI {fmt0(air.worst.aqi)}
            </span>
          </button>
        )}

        {onShowAirHeat && (
          <button type="button" className="ssb-heat-btn mono" onClick={onShowAirHeat}>
            SHOW AIR HEATMAP
          </button>
        )}
      </section>

      <footer className="ssb-powered mono">
        Powered by{" "}
        <a href="https://flood.nonarkara.org" target="_blank" rel="noreferrer">FloodDash</a>
        {" · "}
        <span title="Air quality stack — Air4Thai PCD + AQICN, curated as AirDash">AirDash</span>
        {" by Dr.Non"}
      </footer>
    </div>
  );
}
