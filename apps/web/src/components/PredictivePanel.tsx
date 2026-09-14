/**
 * PredictivePanel — TimesFM zero-shot forecast strips for 5 municipal metrics.
 *
 * Data source: /api/twin/predictions (Cloudflare Worker reads from twin_state
 * rows written by the Python forecast service every hour).
 *
 * Each metric row shows:
 *   • Metric label + horizon
 *   • Inline SVG sparkline with p10/p90 confidence band + p50 line
 *   • Amber alert chip when max forecast > threshold
 *   • "No data" fallback when the Python service hasn't run yet
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerId } from "../map/presets";
import { PanelHeader } from "./PanelHeader";
import { formatAge, peakLabel } from "../lib/predictive";
import type { ForecastPoint } from "../lib/predictive";
import { StatusText, seriesSummary } from "../lib/cityStatus";

export interface ForecastMetric {
  metric: string;
  label: string;
  unit: string;
  alertThreshold: number;
  generatedAt: string | null;
  horizon: ForecastPoint[];
}

interface PredictionsResponse {
  forecasts: ForecastMetric[];
  count: number;
}

/** Maps each forecast metric to the map layers it should enable when clicked. */
export const METRIC_LAYER_MAP: Record<string, { layers: LayerId[]; flyToCoast?: boolean }> = {
  "precipitation.forecast": { layers: ["satellite-imerg"] },
  "tideHeight.forecast":    { layers: ["ferry-terminals"], flyToCoast: true },
  "incidentRate.forecast":  { layers: ["incidents-city-reports"] },
  "aqi.forecast":           { layers: ["satellite-aerosol", "satellite-no2"] },
  "vesselCount.forecast":   { layers: ["ais-vessels"] },
};

/** Human-readable metric names for the ForecastAlertBadge. */
export const METRIC_LABEL: Record<string, string> = {
  "precipitation.forecast": "RAIN",
  "tideHeight.forecast":    "TIDE",
  "incidentRate.forecast":  "INCIDENTS",
  "aqi.forecast":           "AQI",
  "vesselCount.forecast":   "VESSELS",
};

interface Props {
  apiBase: string;
  onMetricClick?: (metric: string) => void;
  onAlert?: (metric: string) => void;
  onForecastsLoaded?: (forecasts: ForecastMetric[]) => void;
  ageMinutes?: number | null;
  fallbackTier?: import("@nst/shared").FallbackTier;
}

// Width × height of each sparkline SVG in px
const W = 120;
const H = 32;
const PAD = 2;

function Sparkline({ points, alertThreshold, label, unit }: { points: ForecastPoint[]; alertThreshold: number; label: string; unit: string }) {
  if (points.length < 2) return <span className="pc-meta">—</span>;

  const vals = points.map((p) => p.p50);
  const lo   = points.map((p) => p.p10 ?? p.p50);
  const hi   = points.map((p) => p.p90 ?? p.p50);

  const yMin = Math.min(...lo, 0);
  const yMax = Math.max(...hi, alertThreshold * 0.5);
  const yRange = yMax - yMin || 1;

  const xScale = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const yScale = (v: number) => H - PAD - ((v - yMin) / yRange) * (H - PAD * 2);

  // Confidence band polygon (p10 bottom, p90 top, clockwise)
  const bandPts = [
    ...points.map((p, i) => `${xScale(i)},${yScale(p.p90 ?? p.p50)}`),
    ...[...points].reverse().map((p, ri) => `${xScale(points.length - 1 - ri)},${yScale(p.p10 ?? p.p50)}`),
  ].join(" ");

  // p50 polyline
  const linePts = vals.map((v, i) => `${xScale(i)},${yScale(v)}`).join(" ");

  // Alert threshold line
  const threshY = yScale(alertThreshold);
  const isAlert = Math.max(...vals) > alertThreshold;
  const digits = Math.max(...vals) < 10 ? 1 : 0;

  return (
    <span className="pred-strip__spark-svg">
      <svg className="pc-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <polygon className="pc-spark__band" points={bandPts} />
        {threshY >= PAD && threshY <= H - PAD && (
          <line
            className={`pc-spark__threshold${isAlert ? " pc-spark__threshold--breach" : ""}`}
            x1={PAD} y1={threshY} x2={W - PAD} y2={threshY}
          />
        )}
        <polyline className="pc-spark__line" points={linePts} />
      </svg>
      <span className="visually-hidden">
        {label} median forecast, next {points.length} hours: {seriesSummary(vals, unit ? ` ${unit}` : "", digits)}
        {isAlert ? ` Exceeds alert threshold ${alertThreshold}${unit}.` : ""}
      </span>
    </span>
  );
}


export function PredictivePanel({ apiBase, onMetricClick, onAlert, onForecastsLoaded, ageMinutes, fallbackTier }: Props) {
  const [data, setData] = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which alert metrics have already been reported to avoid re-firing on polls
  const reportedAlerts = useRef<Set<string>>(new Set());

  // Keep the latest callbacks in refs so the fetch effect can depend on `apiBase`
  // ALONE. Callers pass inline arrow props (new identity every render); if those
  // were in the effect deps, the effect would re-run — and re-fetch — on every
  // parent re-render, hammering /api/twin/predictions until the rate limiter trips.
  const onAlertRef = useRef(onAlert);
  const onForecastsLoadedRef = useRef(onForecastsLoaded);
  useEffect(() => {
    onAlertRef.current = onAlert;
    onForecastsLoadedRef.current = onForecastsLoaded;
  });

  useEffect(() => {
    let active = true;
    const fetch_ = () => {
      setLoading(true);
      fetch(`${apiBase}/api/twin/predictions`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<PredictionsResponse>;
        })
        .then((d) => {
          if (!active) return;
          setData(d);
          setLoading(false);
          setError(null);
          onForecastsLoadedRef.current?.(d.forecasts);
          // Fire alert callbacks for newly-breached thresholds
          const onAlert = onAlertRef.current;
          if (onAlert) {
            for (const fm of d.forecasts) {
              const isAlert = fm.horizon.length > 0 &&
                Math.max(...fm.horizon.map((p) => p.p50)) > fm.alertThreshold;
              if (isAlert && !reportedAlerts.current.has(fm.metric)) {
                reportedAlerts.current.add(fm.metric);
                onAlert(fm.metric);
              }
            }
          }
        })
        .catch((e: Error) => {
          if (active) { setError(e.message); setLoading(false); }
        });
    };
    fetch_();
    const id = window.setInterval(fetch_, 5 * 60_000); // refresh every 5 min
    return () => { active = false; window.clearInterval(id); };
  }, [apiBase]);

  const hasAnyData = useMemo(
    () => data?.forecasts.some((f) => f.horizon.length > 0),
    [data]
  );

  return (
    <section className="panel" aria-label="Predictive intelligence" aria-busy={loading}>
      <PanelHeader
        title="PREDICTIVE INTELLIGENCE"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="timesfm·zs"
      />

      {loading && !data && <p className="pc-meta">LOADING …</p>}

      {error && (
        <p role="status">
          <StatusText level="watch">Forecast service offline</StatusText>{" "}
          <span className="pc-meta">{error}</span>
        </p>
      )}

      {!loading && !error && !hasAnyData && (
        <p className="note">Forecasts resume when the prediction service reports in.</p>
      )}

      {data?.forecasts.map((fm) => {
        if (!fm.horizon.length) return null;
        const isAlert = Math.max(...fm.horizon.map((p) => p.p50)) > fm.alertThreshold;
        const content = (
          <>
            <span className="pred-strip__head">
              <span className="pred-strip__label">{fm.label}</span>
              {isAlert && (
                <StatusText level="warning">
                  Above <span className="num">{fm.alertThreshold}{fm.unit}</span>
                </StatusText>
              )}
              <span className="pc-meta num">{peakLabel(fm.horizon, fm.unit)}</span>
              {onMetricClick && <span className="pred-strip__map" aria-hidden="true">→ MAP</span>}
            </span>
            <span className="pred-strip__spark">
              <Sparkline points={fm.horizon} alertThreshold={fm.alertThreshold} label={fm.label} unit={fm.unit} />
              <span className="pc-meta num">{fm.horizon.length}h</span>
            </span>
            {fm.generatedAt && <span className="pc-meta">{formatAge(fm.generatedAt)}</span>}
          </>
        );
        return onMetricClick ? (
          <button
            key={fm.metric}
            type="button"
            className="pred-strip"
            onClick={() => onMetricClick(fm.metric)}
            title={`Enable ${fm.label} on map`}
          >
            {content}
            <span className="visually-hidden">Enable {fm.label} on map</span>
          </button>
        ) : (
          <div key={fm.metric} className="pred-strip">
            {content}
          </div>
        );
      })}

      <p className="pc-meta">GOOGLE TIMESFM 2.0 · 200M · ZERO-SHOT INFERENCE</p>
    </section>
  );
}
