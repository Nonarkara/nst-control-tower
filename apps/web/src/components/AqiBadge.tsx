import type { CSSProperties } from "react";
import { maxAqiNext8h, fmtHour } from "../lib/aqi";
import { seriesSummary } from "../lib/cityStatus";

interface TrendPoint {
  at: string;
  aqi: number | null;
  pm25: number | null;
}

export interface AqiTrend {
  station: string;
  category: "good" | "moderate" | "unhealthy-sg" | "unhealthy" | "very-unhealthy" | "hazardous" | null;
  current: { aqi: number | null; pm25: number | null; observedAt: string };
  next8h: TrendPoint[];
  source: string;
}

interface Props {
  trend: AqiTrend | null;
  loading: boolean;
}

const BAND: Record<
  NonNullable<AqiTrend["category"]>,
  { color: string; label: string; advice: string }
> = {
  // US EPA reproduction colours (tokens.css). Used only as a fill/swatch beside ink text.
  good:            { color: "var(--aqi-good)",           label: "GOOD",            advice: "Outdoor activity normal." },
  moderate:        { color: "var(--aqi-moderate)",       label: "MODERATE",        advice: "Sensitive groups: limit prolonged outdoor exertion." },
  "unhealthy-sg":  { color: "var(--aqi-unhealthy-sg)",   label: "UNHEALTHY · SG",  advice: "Sensitive groups should reduce outdoor activity." },
  unhealthy:       { color: "var(--aqi-unhealthy)",      label: "UNHEALTHY",       advice: "Everyone: reduce outdoor exertion. Masks recommended." },
  "very-unhealthy":{ color: "var(--aqi-very-unhealthy)", label: "VERY UNHEALTHY",  advice: "Avoid outdoor exertion. N95 masks outdoors." },
  hazardous:       { color: "var(--aqi-hazardous)",      label: "HAZARDOUS",       advice: "Stay indoors. Run filtration. Cancel outdoor events." },
};

const TREND_STEP = 4;
const AQI_REFERENCE = 100;
const SPARK_W = 200;
const SPARK_H = 32;

export function AqiBadge({ trend, loading }: Props) {
  if (loading || !trend || trend.current.aqi == null || trend.category == null) {
    return (
      <section className="aqib" aria-busy={loading} aria-label="Air quality">
        <h3 className="pc-label">AIR QUALITY · US AQI</h3>
        <span className="skeleton pc-skeleton pc-skeleton--figure" />
        <p className="pc-meta">{loading ? "Connecting…" : "Unavailable"}</p>
      </section>
    );
  }

  const band = BAND[trend.category];
  const peak = maxAqiNext8h(trend);
  const trending = peak - trend.current.aqi;
  const trendArrow = trending >= TREND_STEP ? "▲" : trending <= -TREND_STEP ? "▼" : "→";
  const trendDir = trending >= TREND_STEP ? "rising" : trending <= -TREND_STEP ? "falling" : "stable";

  // Sparkline for next8h (current + 8 points)
  const series = [trend.current.aqi, ...trend.next8h.map((p) => p.aqi)].filter((v): v is number => v != null);
  const maxVal = Math.max(...series, 50);
  const minVal = Math.min(...series, 0);
  const span = Math.max(1, maxVal - minVal);
  const pts = series
    .map((v, i) => {
      const x = series.length > 1 ? (i / (series.length - 1)) * SPARK_W : SPARK_W / 2;
      const y = SPARK_H - ((v - minVal) / span) * SPARK_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const refY = SPARK_H - ((AQI_REFERENCE - minVal) / span) * SPARK_H;

  return (
    <section
      className="aqib"
      aria-label={`Air quality ${band.label}, AQI ${trend.current.aqi}`}
      style={{ "--aqi-color": band.color } as CSSProperties}
    >
      <div className="pc-spread">
        <h3 className="pc-label">AIRDASH · US AQI</h3>
        <span className="aqib__band pc-status">
          <span className="swatch" aria-hidden="true" />
          {band.label}
        </span>
      </div>
      <div className="aqib__row">
        <p className="aqib__num num">{Math.round(trend.current.aqi)}</p>
        <dl className="pc-stats pc-stats--pair">
          <div>
            <dt>PM2.5</dt>
            <dd>
              <span className="num">
                {(trend.current.pm25 ?? 0).toFixed(1)} <span className="aqib__unit">µg/m³</span>
              </span>
            </dd>
          </div>
          <div>
            <dt>Peak 8h</dt>
            <dd>
              <span className="num">
                {Math.round(peak)} <span aria-hidden="true">{trendArrow}</span>
                <span className="visually-hidden"> {trendDir}</span>
              </span>
            </dd>
          </div>
        </dl>
      </div>
      <figure className="pc-section">
        <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" className="pc-spark" aria-hidden="true">
          <line className="pc-spark__threshold" x1="0" y1={refY} x2={SPARK_W} y2={refY} />
          <polyline className="pc-spark__line" points={pts} />
        </svg>
        <figcaption className="visually-hidden">
          AQI now and next 8 hours: {seriesSummary(series)}
        </figcaption>
      </figure>
      <div className="pc-spread">
        <span className="pc-meta">{trend.station}</span>
        <span className="pc-meta num">{fmtHour(trend.current.observedAt)}</span>
      </div>
      <p className="aqib__advice">{band.advice}</p>
      <p className="pc-meta">Powered by AirDash by Dr.Non</p>
    </section>
  );
}
