/**
 * FloodCommand — the God Mode planning panel. Composes the four capabilities
 * the mayor needs in one place:
 *
 *   1. Street-flood SCENARIO — a water level (m MSL) compared point-by-point
 *      against the HII 2025 road-elevation survey (18,359 points, cm accuracy)
 *      → which streets go under, how deep, how many km. Presets anchor to the
 *      surveyed historical flood marks (NORMAL median · PABUK 2019 max).
 *   2. IMPACT readout — auditable arithmetic (lib/floodScenario.ts), not model.
 *   3. 3-DAY WATERSHED RAIN — WRF-ROMS (HII) forecast averaged over the Khao
 *      Luang–Tha Dee catchment: the water that will be coming down.
 *   4. SEASONAL CALENDAR — 17 years of satellite-detected flooding per city
 *      tambon per month (GISTDA/HII): when to pre-position what, where.
 *
 * Honesty rules baked in: the scenario is a static-level (bathtub) comparison
 * with no flow routing; coverage is the HII survey area (eastern lowland);
 * WRF is a model forecast. All three caveats are shown in the footer.
 */

import { useMemo } from "react";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { FallbackTier, WrfRainDay } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import type { FloodMarkProps, RoadLevelProps } from "../map/layers";
import {
  SCENARIO_PRESETS,
  SCENARIO_MIN_M,
  SCENARIO_MAX_M,
  buildScenarioIndex,
  floodScenarioStats,
} from "../lib/floodScenario";
import { SEASONAL_FLOOD_RISK, SEASONAL_RISK_SOURCE } from "../data/seasonalFloodRisk";

interface Props {
  /** Scenario water level (m MSL) or null = scenario off (elevation ramp). */
  scenarioLevel: number | null;
  onScenarioChange: (level: number | null) => void;
  roadLevels: FeatureCollection<Point, RoadLevelProps> | null;
  floodMarks: FeatureCollection<Point, FloodMarkProps> | null;
  /** True when the street-flood-sim map layer is enabled (FLOOD lens). */
  scenarioLayerOn: boolean;
  wrfOutlook: WrfRainDay[];
  wrfDay: 1 | 2 | 3;
  onWrfDayChange: (day: 1 | 2 | 3) => void;
  /** Whether the wrf-rain-grid map layer is enabled + its toggle. */
  wrfLayerOn: boolean;
  onToggleWrfLayer: () => void;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
  wrfNote?: string;
}

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const RISK_CELL_COLOR = [
  "var(--bg-3)",  // 0 — no recorded flooding
  "var(--data)",  // 1 — low (1–3 events / 17 y)
  "var(--warn)",  // 2 — medium (4–8)
  "var(--bad)",   // 3 — high (9+)
];

function rainTone(mm: number): string {
  if (mm >= 90) return "var(--crit)";
  if (mm >= 35) return "var(--bad)";
  if (mm >= 10) return "var(--warn)";
  if (mm >= 1) return "var(--data)";
  return "var(--text-3)";
}

export function FloodCommand({
  scenarioLevel,
  onScenarioChange,
  roadLevels,
  floodMarks,
  scenarioLayerOn,
  wrfOutlook,
  wrfDay,
  onWrfDayChange,
  wrfLayerOn,
  onToggleWrfLayer,
  ageMinutes,
  fallbackTier,
  wrfNote,
}: Props) {
  const index = useMemo(
    () => (roadLevels ? buildScenarioIndex(roadLevels) : null),
    [roadLevels],
  );
  const marks = useMemo(
    () => (floodMarks?.features ?? []) as Feature<Point, FloodMarkProps>[],
    [floodMarks],
  );
  const stats = useMemo(
    () => (index && scenarioLevel != null ? floodScenarioStats(index, marks, scenarioLevel) : null),
    [index, marks, scenarioLevel],
  );

  const currentMonth = new Date().getMonth(); // 0-based, matches risk[] index

  return (
    <div className="col" style={{ gap: 8 }}>
      <PanelHeader
        title="FLOOD COMMAND // GOD MODE"
        source="hii-survey · wrf-roms · gistda"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      {/* ── 1 · Street-flood scenario ─────────────────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          STREET SCENARIO · WATER LEVEL (m MSL)
        </div>
        <div className="fc-presets">
          <button
            onClick={() => onScenarioChange(null)}
            aria-pressed={scenarioLevel == null}
            className={`mono ${scenarioLevel == null ? "active" : ""}`}
            title="Scenario off — streets colored by surveyed elevation instead"
          >
            OFF
          </button>
          {SCENARIO_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => onScenarioChange(p.levelM)}
              aria-pressed={scenarioLevel === p.levelM}
              className={`mono ${scenarioLevel === p.levelM ? "active" : ""}`}
              title={
                p.key === "pabuk"
                  ? "Highest surveyed Tropical Storm Pabuk (Jan 2019) high-water mark"
                  : "Median surveyed normal-season high-water mark"
              }
            >
              {p.label} {p.levelM.toFixed(2)}
            </button>
          ))}
        </div>
        <input
          type="range"
          className="fc-slider"
          min={SCENARIO_MIN_M}
          max={SCENARIO_MAX_M}
          step={0.05}
          value={scenarioLevel ?? SCENARIO_MIN_M}
          onChange={(e) => onScenarioChange(Number(e.target.value))}
          aria-label="Scenario water level in metres above mean sea level"
        />
        {scenarioLevel != null && stats && (
          <div className="fc-impact mono">
            <span style={{ color: stats.wetShare > 0.5 ? "var(--bad)" : stats.wetShare > 0.15 ? "var(--warn)" : "var(--good)" }}>
              {(stats.wetShare * 100).toFixed(0)}% of surveyed streets under water
            </span>
            <span className="fc-impact-sub">
              ≈ {stats.wetKm.toFixed(1)} of {stats.totalKm.toFixed(1)} km · deepest {stats.deepestM.toFixed(2)} m ·
              exceeds {stats.marksExceeded}/{stats.marksTotal} historical marks
            </span>
          </div>
        )}
        {scenarioLevel != null && !scenarioLayerOn && (
          <div className="eyebrow mono" style={{ color: "var(--warn)" }}>
            Enable "Street levels / flood scenario" (FLOOD lens) to see it on the map.
          </div>
        )}
      </div>

      {/* ── 2 · 3-day watershed rain (WRF-ROMS) ───────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          WATERSHED RAIN · NEXT 3 DAYS · KHAO LUANG→CITY
        </div>
        {wrfOutlook.length === 0 ? (
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {wrfNote ?? "Awaiting WRF-ROMS model feed."}
          </div>
        ) : (
          <div className="fc-wrf-days">
            {wrfOutlook.map((d) => (
              <button
                key={d.day}
                onClick={() => onWrfDayChange(d.day)}
                aria-pressed={wrfDay === d.day}
                className={`fc-wrf-day mono ${wrfDay === d.day ? "active" : ""}`}
                title={`Valid ${d.validDate} · catchment max ${d.catchmentMaxMm} mm · city mean ${d.cityMeanMm} mm`}
              >
                <span className="fc-wrf-label">D{d.day}</span>
                <span className="fc-wrf-mm" style={{ color: rainTone(d.catchmentMeanMm) }}>
                  {Math.round(d.catchmentMeanMm)}
                </span>
                <span className="fc-wrf-unit">mm</span>
              </button>
            ))}
            <button
              onClick={onToggleWrfLayer}
              aria-pressed={wrfLayerOn}
              className={`mono ${wrfLayerOn ? "active" : ""}`}
              title="Show the selected day's forecast-rain grid on the map (~3 km cells)"
            >
              MAP
            </button>
          </div>
        )}
      </div>

      {/* ── 3 · Seasonal risk calendar ────────────────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          SEASONAL FLOOD CALENDAR · CITY TAMBONS · 17-YEAR RECORD
        </div>
        <div className="fc-calendar">
          <div className="fc-cal-row fc-cal-head">
            <span className="fc-cal-name" />
            {MONTHS.map((m, i) => (
              <span key={i} className={`fc-cal-month mono ${i === currentMonth ? "now" : ""}`}>{m}</span>
            ))}
          </div>
          {SEASONAL_FLOOD_RISK.map((t) => (
            <div key={t.geocode} className="fc-cal-row" title={`${t.th} · worst month flooded ${t.peakFloods17y}× in 17 years`}>
              <span className="fc-cal-name mono">{t.th}</span>
              {t.risk.map((r, i) => (
                <span
                  key={i}
                  className={`fc-cal-cell ${i === currentMonth ? "now" : ""}`}
                  style={{ background: RISK_CELL_COLOR[r] ?? RISK_CELL_COLOR[0] }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="eyebrow mono" style={{ color: "var(--text-3)", marginTop: 2 }}>
          {SEASONAL_RISK_SOURCE}
        </div>
      </div>

      {/* ── Honesty footer ────────────────────────────────────────────── */}
      <div className="eyebrow mono" style={{ color: "var(--text-3)", borderTop: "1px solid var(--line)", paddingTop: 6, lineHeight: 1.5 }}>
        Scenario = static water level vs surveyed street elevations (HII 2025,
        m MSL, eastern-lowland coverage only) — no flow routing or drainage
        dynamics. Rain outlook = WRF-ROMS model, not observation. Presets are
        real surveyed high-water marks.
      </div>
    </div>
  );
}
